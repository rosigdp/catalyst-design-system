// Make → Design System
// Main thread (runs in the Figma sandbox, has full document API access).
//
// Flow:
//   1. Build a catalog of available design-system components.
//      - Local components/sets defined in this file.
//      - Remote (team-library) components that are already referenced by an
//        instance somewhere in the document. Figma has no API to list every
//        component in a published library without its key, so we harvest the
//        keys from instances already present in the file (a stickersheet or
//        sample frame is the easy way to make the whole library available).
//   2. Collect "swap candidates" from the current selection (the stuff pasted
//      in from Figma Make: frames, groups, instances, components).
//   3. Score each candidate against the catalog by name similarity and send
//      suggestions to the UI.
//   4. When the user confirms mappings, instantiate the chosen DS component,
//      copy text + position over, and replace the original layer.

figma.showUI(__html__, { width: 460, height: 640, themeColors: true });

// refId -> catalog entry, kept alive between messages so swap can resolve them.
var catalogMap = new Map();

// ---------------------------------------------------------------------------
// Text / name normalization + similarity scoring
// ---------------------------------------------------------------------------

var STOP = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'to', 'frame', 'group', 'component',
  'default', 'wrapper', 'container', 'content', 'auto', 'layout', 'copy',
  'instance', 'div', 'span', 'root', 'main'
]);

function normalize(s) {
  return (s || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // splitCamelCase
    .replace(/[_\-/.]+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s) {
  return normalize(s).split(' ').filter(function (t) {
    return t && !STOP.has(t);
  });
}

// Split a layer name like "Button/primary/large" into the component base name
// and the variant parts. Make-kit components emit names in this shape so we can
// match the base against a component set and set its variant properties.
function parseName(name) {
  var raw = (name || '').split('/').map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length; });
  if (raw.length <= 1) return { base: name || '', parts: [] };
  return { base: raw[0], parts: raw.slice(1) };
}

function score(aTok, bTok, aNorm, bNorm) {
  if (!aTok.length || !bTok.length) return 0;
  var setB = new Set(bTok);
  var inter = 0;
  for (var i = 0; i < aTok.length; i++) if (setB.has(aTok[i])) inter++;
  var union = new Set(aTok.concat(bTok)).size;
  var jac = inter / union;
  var bonus = 0;
  if (aNorm === bNorm) bonus = 0.5;
  else if (aNorm.indexOf(bNorm) !== -1 || bNorm.indexOf(aNorm) !== -1) bonus = 0.2;
  return Math.min(1, jac + bonus);
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

// Live catalog list, kept in sync with catalogMap. Built in two phases so the
// UI can show local components immediately on big files instead of blocking on
// a full-document instance walk.
var catalogList = [];

function addToCatalog(seen, entry) {
  if (seen.has(entry.refId)) return;
  seen.add(entry.refId);
  entry.tok = tokens(entry.name);
  entry.norm = normalize(entry.name);
  catalogMap.set(entry.refId, entry);
  catalogList.push(entry);
}

// Phase 1 — local components/sets on the CURRENT PAGE only. We deliberately do
// not call figma.loadAllPagesAsync()/scan figma.root: on large library files
// that loads every page into memory and freezes the plugin. The current page is
// always loaded, so this is fast and can't hang.
async function buildLocalCatalog(seen) {
  var locals = figma.currentPage.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] });
  for (var i = 0; i < locals.length; i++) {
    var node = locals[i];
    // Skip variant children that live inside a set; the set represents them.
    if (node.type === 'COMPONENT' && node.parent && node.parent.type === 'COMPONENT_SET') continue;
    addToCatalog(seen, {
      refId: 'local:' + node.id,
      name: node.name,
      isRemote: false,
      isSet: node.type === 'COMPONENT_SET',
      nodeId: node.id,
      key: null
    });
  }
}

// Phase 2 — remote (team-library) components, harvested from instances already
// present in the document. Bounded + yielding so a huge library file can't hang
// the plugin (getMainComponentAsync is async per node).
var REMOTE_INSTANCE_CAP = 4000;
async function buildRemoteCatalog(seen) {
  var instances = figma.currentPage.findAllWithCriteria({ types: ['INSTANCE'] });
  var limit = Math.min(instances.length, REMOTE_INSTANCE_CAP);
  for (var j = 0; j < limit; j++) {
    var main;
    try {
      main = await instances[j].getMainComponentAsync();
    } catch (e) {
      main = null;
    }
    if (main && main.remote) {
      var target = main;
      if (main.parent && main.parent.type === 'COMPONENT_SET') target = main.parent;
      if (target.key) {
        addToCatalog(seen, {
          refId: 'remote:' + target.key,
          name: target.name,
          isRemote: true,
          isSet: target.type === 'COMPONENT_SET',
          nodeId: null,
          key: target.key
        });
      }
    }
    if ((j & 255) === 0) await Promise.resolve(); // let the UI breathe
  }
}

function catalogPayload() {
  return catalogList
    .slice()
    .sort(function (a, b) { return a.name.localeCompare(b.name); })
    .map(function (c) {
      return { refId: c.refId, name: c.name, isRemote: c.isRemote, isSet: c.isSet };
    });
}

// ---------------------------------------------------------------------------
// Candidate collection from the selection
// ---------------------------------------------------------------------------

var CANDIDATE_TYPES = new Set(['FRAME', 'GROUP', 'INSTANCE', 'COMPONENT']);
var CANDIDATE_CAP = 600;

function firstTextPreview(node) {
  if (node.type === 'TEXT') return node.characters;
  if ('findOne' in node) {
    var t = node.findOne(function (n) { return n.type === 'TEXT'; });
    if (t) return t.characters;
  }
  return '';
}

function collectCandidates(selection) {
  var out = [];
  var seen = new Set();

  function visit(node) {
    if (out.length >= CANDIDATE_CAP) return;
    if (CANDIDATE_TYPES.has(node.type) && !seen.has(node.id)) {
      seen.add(node.id);
      out.push(node);
    }
    if ('children' in node) {
      for (var i = 0; i < node.children.length; i++) visit(node.children[i]);
    }
  }

  for (var i = 0; i < selection.length; i++) visit(selection[i]);
  return out;
}

function suggestionsFor(candNode, catalog) {
  // Score against the base name only ("Button/primary/large" -> "Button"),
  // so variant suffixes don't dilute the match to the component set.
  var parsed = parseName(candNode.name);
  var aNorm = normalize(parsed.base);
  var aTok = tokens(parsed.base);
  var scored = [];
  for (var i = 0; i < catalog.length; i++) {
    var c = catalog[i];
    var s = score(aTok, c.tok, aNorm, c.norm);
    if (s > 0.05) {
      scored.push({ refId: c.refId, name: c.name, isRemote: c.isRemote, isSet: c.isSet, score: s });
    }
  }
  scored.sort(function (a, b) { return b.score - a.score; });
  return scored.slice(0, 6);
}

function candidatesPayload(nodes) {
  return nodes.map(function (n) {
    return {
      id: n.id,
      name: n.name,
      kind: n.type,
      w: Math.round('width' in n ? n.width : 0),
      h: Math.round('height' in n ? n.height : 0),
      preview: firstTextPreview(n).slice(0, 60),
      variantParts: parseName(n.name).parts,
      suggestions: suggestionsFor(n, catalogList)
    };
  });
}

async function scan() {
  var selection = figma.currentPage.selection;
  if (!selection || selection.length === 0) {
    figma.ui.postMessage({ type: 'scanned', candidates: [], catalog: [], error: 'NO_SELECTION', phase: 'full' });
    return;
  }

  catalogMap = new Map();
  catalogList = [];
  var seen = new Set();
  var nodes = collectCandidates(selection);

  // Phase 1: local components — show results immediately.
  await buildLocalCatalog(seen);
  figma.ui.postMessage({
    type: 'scanned',
    candidates: candidatesPayload(nodes),
    catalog: catalogPayload(),
    phase: 'local'
  });

  // Phase 2: team-library components — bounded background pass.
  figma.ui.postMessage({ type: 'progress', message: 'Scanning library components…' });
  await buildRemoteCatalog(seen);
  figma.ui.postMessage({
    type: 'scanned',
    candidates: candidatesPayload(nodes),
    catalog: catalogPayload(),
    phase: 'full'
  });
}

// ---------------------------------------------------------------------------
// Heuristic naming — infer kit-convention names from Figma node structure.
//
// Used when Figma Make pastes layers without preserving the kit's `data-name`
// attributes. The rules mirror the kit's `Component/variant/size/...` shape so
// the downstream catalog match + variant-map can pick up where they would have
// if Make had emitted the names directly.
//
// See make-kit/RENAME-RULES.md for the full rule table.
// ---------------------------------------------------------------------------

function getSolidFill(node) {
  var fills = node.fills;
  if (!fills || fills === figma.mixed) return null;
  for (var i = 0; i < fills.length; i++) {
    var f = fills[i];
    if (f.type === 'SOLID' && f.visible !== false) {
      return {
        r: Math.round(f.color.r * 255),
        g: Math.round(f.color.g * 255),
        b: Math.round(f.color.b * 255),
        a: f.opacity == null ? 1 : f.opacity
      };
    }
  }
  return null;
}

function getStrokeColor(node) {
  var s = node.strokes;
  if (!s || s === figma.mixed || !s.length) return null;
  for (var i = 0; i < s.length; i++) {
    var stroke = s[i];
    if (stroke.type === 'SOLID' && stroke.visible !== false) {
      return {
        r: Math.round(stroke.color.r * 255),
        g: Math.round(stroke.color.g * 255),
        b: Math.round(stroke.color.b * 255)
      };
    }
  }
  return null;
}

function rgbClose(a, b, tol) {
  if (!a || !b) return false;
  var t = tol == null ? 15 : tol;
  return Math.abs(a.r - b.r) <= t && Math.abs(a.g - b.g) <= t && Math.abs(a.b - b.b) <= t;
}

// Canonical Catalyst token colors (catapa/light) the kit emits at runtime.
var COLORS = {
  brand:         { r: 0,   g: 201, b: 131 },
  negative:      { r: 217, g: 98,  b: 79  },
  white:         { r: 255, g: 255, b: 255 },
  accent:        { r: 0,   g: 153, b: 255 },
  foreground:    { r: 51,  g: 51,  b: 51  },
  disableBg:     { r: 232, g: 232, b: 232 },
  // Badge backgroundAlternate tints
  positiveBg:    { r: 209, g: 247, b: 211 },
  negativeBg:    { r: 255, g: 219, b: 219 },
  warningBg:     { r: 255, g: 249, b: 223 },
  infoBg:        { r: 208, g: 243, b: 255 },
  disableAltBg:  { r: 241, g: 241, b: 241 }
};

var ICON_FONT_RE = /awesome|material|icons?$/i;

function isIconText(t) {
  if (!t || t.type !== 'TEXT') return false;
  var fn = t.fontName;
  return !!(fn && fn !== figma.mixed && ICON_FONT_RE.test(fn.family || ''));
}

function findChildren(node) {
  return ('children' in node ? node.children : []).filter(function (c) {
    return c.visible !== false;
  });
}

function findAllTexts(node) {
  if (node.type === 'TEXT') return [node];
  if (!('findAllWithCriteria' in node)) return [];
  return node.findAllWithCriteria({ types: ['TEXT'] });
}

// Already in kit convention? Skip inference.
function looksKitNamed(node) {
  return /^[A-Z][a-zA-Z]+\/.+/.test(node.name || '');
}

// ---- Per-component inference ----

function inferButton(node) {
  var fill = getSolidFill(node);
  var stroke = getStrokeColor(node);
  var dashed = !!(node.dashPattern && node.dashPattern.length);

  var variant = null;
  if (rgbClose(fill, COLORS.brand))         variant = 'primary';
  else if (rgbClose(fill, COLORS.negative)) variant = 'destructive';
  else if (rgbClose(fill, COLORS.white))    variant = (stroke && dashed) ? 'card' : (stroke ? 'secondary' : null);

  if (!variant) return null;

  // Confidence guard: a button has children (label/icon) and rounded corners.
  var kids = findChildren(node);
  if (!kids.length) return null;
  var radius = node.cornerRadius;
  if (typeof radius === 'number' && radius > 32 && variant !== 'card') return null; // too round → likely badge

  var size = node.height >= 50 ? 'large' : 'default';

  // Content from text/icon mix, ordered left-to-right.
  var texts = findAllTexts(node).slice().sort(function (a, b) {
    return (a.absoluteBoundingBox && a.absoluteBoundingBox.x) - (b.absoluteBoundingBox && b.absoluteBoundingBox.x);
  });
  var leadingIcon = false, trailingIcon = false, hasLabel = false;
  for (var i = 0; i < texts.length; i++) {
    if (isIconText(texts[i])) {
      if (!hasLabel) leadingIcon = true;
      else trailingIcon = true;
    } else if ((texts[i].characters || '').trim()) {
      hasLabel = true;
    }
  }
  var content;
  if (hasLabel && leadingIcon && trailingIcon) content = 'leadingIcon+label+trailingIcon';
  else if (hasLabel && leadingIcon) content = 'leadingIcon+label';
  else if (hasLabel && trailingIcon) content = 'label+trailingIcon';
  else if (hasLabel) content = 'labelOnly';
  else content = 'iconOnly';

  return 'Button/' + variant + '/' + size + '/' + content;
}

function inferBadge(node) {
  var fill = getSolidFill(node);
  if (!fill) return null;
  var radius = node.cornerRadius;
  // Badge is a small pill (full radius) with one of the alternate tints.
  if (typeof radius !== 'number' || radius < 30) return null;
  var variant = null;
  if (rgbClose(fill, COLORS.positiveBg))   variant = 'positive';
  else if (rgbClose(fill, COLORS.negativeBg))    variant = 'negative';
  else if (rgbClose(fill, COLORS.warningBg))     variant = 'warning';
  else if (rgbClose(fill, COLORS.infoBg))        variant = 'info';
  else if (rgbClose(fill, COLORS.disableAltBg))  variant = 'disable';
  if (!variant) return null;
  if (node.height && node.height > 32) return null; // too tall → likely button
  return 'Badge/' + variant;
}

var AVATAR_SIZE_MAP = { 24: 'xs', 36: 'sm', 72: 'md', 108: 'lg', 144: 'xl' };

function inferAvatar(node) {
  var w = Math.round(node.width || 0);
  var h = Math.round(node.height || 0);
  if (!w || w !== h) return null;
  var sz = AVATAR_SIZE_MAP[w];
  if (!sz) return null;
  var radius = node.cornerRadius;
  var shape = (typeof radius === 'number' && radius > w / 3) ? 'circle' : 'square';
  // Visualization: image (IMG/RECT with image fill), initials (TEXT child), else placeholder
  var kids = findChildren(node);
  var viz = 'placeholder';
  for (var i = 0; i < kids.length; i++) {
    var k = kids[i];
    if (k.type === 'TEXT' && !isIconText(k) && (k.characters || '').trim()) { viz = 'initials'; break; }
    var f = k.fills;
    if (f && f !== figma.mixed) {
      for (var j = 0; j < f.length; j++) {
        if (f[j].type === 'IMAGE') { viz = 'image'; break; }
      }
    }
  }
  // State: grayscale = disabled (effects/filters can't be inspected; lean on opacity heuristic)
  var state = (node.opacity != null && node.opacity < 0.9) ? 'disabled' : 'default';
  return 'Avatar/' + sz + '/' + shape + '/' + viz + '/' + state + '/view';
}

function inferTextAction(node) {
  // Single TEXT with underline OR a wrapper with one underlined TEXT child.
  var t = node.type === 'TEXT' ? node : (findChildren(node).filter(function (c) { return c.type === 'TEXT'; })[0]);
  if (!t || t.type !== 'TEXT') return null;
  var deco = t.textDecoration;
  if (deco !== 'UNDERLINE') return null;
  var fills = t.fills;
  if (!fills || fills === figma.mixed || !fills.length) return null;
  var f = fills[0];
  if (f.type !== 'SOLID') return null;
  var rgb = { r: Math.round(f.color.r * 255), g: Math.round(f.color.g * 255), b: Math.round(f.color.b * 255) };
  var variant = null;
  if (rgbClose(rgb, COLORS.accent)) variant = 'link';
  else if (rgbClose(rgb, COLORS.brand)) variant = 'action';
  else variant = 'destructive';
  return 'TextAction/' + variant;
}

function inferIconAction(node) {
  // Icon-only button-ish: small frame with a single icon-font text and no fill.
  if (node.type !== 'FRAME' && node.type !== 'GROUP') return null;
  var kids = findChildren(node);
  if (kids.length !== 1) return null;
  if (!isIconText(kids[0])) return null;
  var fill = getSolidFill(node);
  if (fill) return null;
  // No way to tell action vs destructive without color context; default to action.
  return 'IconAction/action';
}

function inferTextfield(node) {
  // A frame with border + background containing an input/text child.
  if (!('children' in node)) return null;
  var stroke = getStrokeColor(node);
  if (!stroke) return null;
  var fill = getSolidFill(node);
  if (!fill) return null;
  var state = 'default';
  if (rgbClose(stroke, COLORS.brand)) state = 'focus';
  else if (rgbClose(stroke, COLORS.negative)) state = 'error';
  else if (rgbClose(fill, COLORS.disableBg)) state = 'disabled';
  // Mode: detect by whether there's an editable-looking inner element. Without
  // that signal, assume edit.
  return 'Textfield/edit/' + state;
}

function inferKitName(node) {
  if (looksKitNamed(node)) return null;
  try {
    return inferButton(node)
        || inferBadge(node)
        || inferAvatar(node)
        || inferTextAction(node)
        || inferIconAction(node)
        || inferTextfield(node);
  } catch (e) { return null; }
}

async function normalizeNames() {
  var selection = figma.currentPage.selection;
  if (!selection || !selection.length) {
    figma.ui.postMessage({ type: 'normalized', renamed: 0, total: 0, error: 'NO_SELECTION' });
    return;
  }
  var nodes = collectCandidates(selection);
  var renamed = 0;
  var preview = [];
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var name = inferKitName(n);
    if (name && name !== n.name) {
      var before = n.name;
      try { n.name = name; renamed++; preview.push({ from: before, to: name }); }
      catch (e) { /* locked node — skip */ }
    }
  }
  figma.ui.postMessage({ type: 'normalized', renamed: renamed, total: nodes.length, preview: preview.slice(0, 8) });
  // Re-scan so suggestions reflect the new names.
  await scan();
}

// ---------------------------------------------------------------------------
// Swapping
// ---------------------------------------------------------------------------

function depthOf(node) {
  var d = 0;
  var p = node.parent;
  while (p) { d++; p = p.parent; }
  return d;
}

function ancestorRemoved(node, removed) {
  var p = node.parent;
  while (p) {
    if (removed.has(p.id)) return true;
    p = p.parent;
  }
  return false;
}

// Map parsed variant parts (["primary","large"]) onto a component set's
// variant properties by finding which property each value belongs to.
function buildVariantMap(componentSet, parts) {
  var map = {};
  if (!parts || !parts.length) return map;
  var defs = componentSet.variantGroupProperties || {};
  var want = parts.map(normalize);
  for (var propName in defs) {
    if (!Object.prototype.hasOwnProperty.call(defs, propName)) continue;
    var options = (defs[propName] && defs[propName].values) || [];
    for (var i = 0; i < options.length; i++) {
      if (want.indexOf(normalize(options[i])) !== -1) {
        map[propName] = options[i];
        break;
      }
    }
  }
  return map;
}

async function instantiate(refId, parts) {
  var entry = catalogMap.get(refId);
  if (!entry) return null;
  var comp = null;
  var set = null;

  if (entry.isRemote) {
    if (entry.isSet) {
      set = await figma.importComponentSetByKeyAsync(entry.key);
      comp = set.defaultVariant || (set.children && set.children[0]) || null;
    } else {
      comp = await figma.importComponentByKeyAsync(entry.key);
    }
  } else {
    var node = await figma.getNodeByIdAsync(entry.nodeId);
    if (!node) return null;
    if (node.type === 'COMPONENT_SET') {
      set = node;
      comp = node.defaultVariant || (node.children && node.children[0]) || null;
    } else {
      comp = node;
    }
  }

  if (!comp || typeof comp.createInstance !== 'function') return null;
  var inst = comp.createInstance();

  // Best-effort: drive variant properties from the layer-name suffix.
  if (set && parts && parts.length) {
    try {
      var map = buildVariantMap(set, parts);
      if (Object.keys(map).length) inst.setProperties(map);
    } catch (e) { /* leave on default variant if values don't match */ }
  }
  return inst;
}

// Keep the design-system component at its OWN intrinsic size — only reposition.
// (Resizing to the source frame would stretch the DS component.)
function placeLike(inst, node) {
  try { inst.x = node.x; inst.y = node.y; } catch (e) {}
}

// Icon layers (Font Awesome / Material glyphs) must never receive the label text.
function isIconFont(fn) {
  return !!fn && fn !== figma.mixed && /awesome|material|icons?$/i.test(fn.family || '');
}

async function transferText(src, inst) {
  var srcTexts = src.type === 'TEXT' ? [src] : src.findAllWithCriteria({ types: ['TEXT'] });

  // Source labels = visible, non-icon text in order.
  var labels = [];
  for (var i = 0; i < srcTexts.length; i++) {
    if (isIconFont(srcTexts[i].fontName)) continue;
    var ch = (srcTexts[i].characters || '').trim();
    if (ch) labels.push(srcTexts[i].characters);
  }
  if (!labels.length) return;

  // 1) Preferred: set the component's TEXT properties (the DS-correct label slot).
  try {
    var props = inst.componentProperties || {};
    var textKeys = Object.keys(props).filter(function (k) {
      return props[k] && props[k].type === 'TEXT';
    });
    if (textKeys.length) {
      var pmap = {};
      for (var t = 0; t < textKeys.length && t < labels.length; t++) pmap[textKeys[t]] = labels[t];
      inst.setProperties(pmap);
      return;
    }
  } catch (e) { /* fall through to direct text-node write */ }

  // 2) Fallback: write into non-icon text layers only.
  var dstAll = inst.type === 'TEXT' ? [inst] : inst.findAllWithCriteria({ types: ['TEXT'] });
  var dst = dstAll.filter(function (n) { return !isIconFont(n.fontName); });
  if (!dst.length) return;

  // A single label should land on the most label-like node (longest current text),
  // not blindly on index 0.
  if (labels.length === 1 && dst.length > 1) {
    dst = dst.slice().sort(function (a, b) {
      return (b.characters || '').length - (a.characters || '').length;
    }).slice(0, 1);
  }

  for (var d = 0; d < dst.length; d++) {
    var node = dst[d];
    var label = labels[Math.min(d, labels.length - 1)];
    try {
      if (node.fontName === figma.mixed) continue;
      await figma.loadFontAsync(node.fontName);
      node.characters = label;
    } catch (e) {}
  }
}

async function performSwap(mappings) {
  var items = [];
  for (var i = 0; i < mappings.length; i++) {
    var node = await figma.getNodeByIdAsync(mappings[i].nodeId);
    if (node && node.parent) items.push({ node: node, refId: mappings[i].refId });
  }
  // Shallowest first so a swapped parent skips its now-orphaned descendants.
  items.sort(function (a, b) { return depthOf(a.node) - depthOf(b.node); });

  var removed = new Set();
  var created = [];
  var result = { success: 0, failed: 0, skipped: 0, errors: [] };

  for (var j = 0; j < items.length; j++) {
    var it = items[j];
    if (ancestorRemoved(it.node, removed)) { result.skipped++; continue; }
    try {
      var inst = await instantiate(it.refId, parseName(it.node.name).parts);
      if (!inst) { result.failed++; result.errors.push('Could not import: ' + it.node.name); continue; }

      var parent = it.node.parent;
      var idx = parent.children.indexOf(it.node);
      placeLike(inst, it.node);
      await transferText(it.node, inst);
      parent.insertChild(idx, inst);
      removed.add(it.node.id);
      it.node.remove();
      created.push(inst);
      result.success++;
    } catch (e) {
      result.failed++;
      result.errors.push((it.node ? it.node.name + ': ' : '') + (e && e.message ? e.message : String(e)));
    }
  }

  if (created.length) {
    try { figma.currentPage.selection = created; } catch (e) {}
  }
  return result;
}

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

figma.ui.onmessage = async function (msg) {
  try {
    if (msg.type === 'scan') {
      await scan();
    } else if (msg.type === 'normalize') {
      await normalizeNames();
    } else if (msg.type === 'swap') {
      var result = await performSwap(msg.mappings || []);
      figma.ui.postMessage({ type: 'swapped', result: result });
      var note = result.success + ' swapped';
      if (result.skipped) note += ', ' + result.skipped + ' skipped';
      if (result.failed) note += ', ' + result.failed + ' failed';
      figma.notify(note);
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (e) {
    figma.ui.postMessage({ type: 'error', message: e && e.message ? e.message : String(e) });
    figma.notify('Error: ' + (e && e.message ? e.message : String(e)), { error: true });
  }
};

// Re-scan automatically when the selection changes so the panel stays in sync.
figma.on('selectionchange', function () {
  figma.ui.postMessage({ type: 'selectionchanged', count: figma.currentPage.selection.length });
});

// Kick off an initial scan on launch. Surface failures instead of leaving the
// UI stuck on "Scanning…".
scan().catch(function (e) {
  figma.ui.postMessage({ type: 'error', message: e && e.message ? e.message : String(e) });
});
