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
