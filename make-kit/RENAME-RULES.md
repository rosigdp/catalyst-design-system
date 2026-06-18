# Auto-name rules

Figma Make sometimes pastes layers into Figma without preserving the kit's
`data-name` attribute — they come in as `Frame 1234`, `Group 5`, etc. The
**Make → Design System** plugin's **Auto-name** button reverses that: it walks
the selected layers and renames anything it can confidently match to the
kit-convention form (`Component/variant/size/…`) so the swap step can find a
target.

The inference itself lives in `figma-make-to-ds/code.js` (`inferKitName`) — it
has to run inside the Figma plugin sandbox where the nodes actually exist. This
doc is the **rule reference** so the convention is visible next to the kit, not
buried in plugin code.

## How it decides

For each candidate layer (FRAME / GROUP / INSTANCE / COMPONENT in the
selection), the inference tries each component in order and returns the first
confident match. Tolerance for color matches is ±15 per RGB channel, so theme
variants render through Make's rasterization still snap to the right token.

| Component   | Signals used                                                                                                              | Output                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Button      | Fill color → `primary`/`destructive`/`secondary`/`card` (white + dashed stroke). Height ≥50 → `large`. Mix of icon-font and body-font text children, ordered by x, picks the Content variant. | `Button/{variant}/{size}/{content}`                |
| Badge       | Pill shape (cornerRadius ≥30) AND height ≤32. Fill color matches one of the alternate tints (positive/negative/warning/info/disable). | `Badge/{variant}`                                  |
| Avatar      | Square 1:1 frame at one of the canonical sizes (24/36/72/108/144). Radius >⅓w → `circle`, else `square`. Image fill child → `image`; body text child → `initials`; otherwise `placeholder`. Low opacity → `disabled`. | `Avatar/{size}/{shape}/{visualization}/{state}/view` |
| TextAction  | Underlined text. Fill color matches `accent` → `link`, `brand` → `action`, anything else → `destructive`.                  | `TextAction/{variant}`                             |
| IconAction  | FRAME/GROUP with exactly one icon-font text child, no fill.                                                                | `IconAction/action` (variant defaults to action — colour signal isn't reliable for icon-only buttons) |
| Textfield   | FRAME with both fill and stroke. Stroke `brand` → `focus`; stroke `negative` → `error`; fill `disable-bg` → `disabled`; else `default`. Mode defaults to `edit`. | `Textfield/edit/{state}`                           |

## Confidence boundaries

The inference deliberately **bails out and returns `null`** rather than
guessing when:

- Fills/strokes don't match any token (no Catalyst-coloured layer here).
- Avatar isn't a perfect square at a canonical size.
- IconAction-shaped frame has more than one text child.
- The layer already looks like it has a kit-style name (`Component/…`).

Layers that don't match anything keep their current name and the Swap step's
existing manual-picker UI is the fallback.

## Updating the rules

If the design system gains a new variant or token, edit `inferKitName` and the
related per-component helpers in `figma-make-to-ds/code.js`, then update the
row in the table above. The colour constants under `COLORS` at the top of the
inference section are the single place to add a new tint.

## What the button does, step by step

1. Walks the candidate layers (same set the scanner already collects).
2. For each, computes a proposed name via `inferKitName`.
3. Applies the rename in Figma (`node.name = proposed`) for ones that produced a
   match.
4. Posts a `{ renamed, total }` summary to the UI.
5. Automatically re-runs `scan()` so the suggestion list reflects the new names.
