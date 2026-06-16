# Catalyst Make Kit

A coded React + Tailwind-friendly component kit generated from the Catalyst
token + component specs (`../tokens`, `../components`). Its job: make **Figma
Make** generate screens that are (a) styled from Catalyst tokens and (b) named so
the **Make → Design System** plugin can swap them into real design-system
component instances.

## Why this exists

Tokens alone don't fix layer names. Figma Make names pasted layers after the
**code** it generates. If Make builds with anonymous `<div>`s you get
`Frame 1` / `Group 2`. If it builds with these named components, you get
`Button/primary/large`, `Badge/info`, etc. — which the plugin maps 1:1 to your
component sets, variants included.

## Contents

| File                  | Purpose                                                        |
| --------------------- | ------------------------------------------------------------- |
| `build-tokens.js`     | Generates `tokens.css` from `../tokens/*.json` (run with node). |
| `tokens.css`          | **Generated** — all tokens as CSS variables. Do not hand-edit. |
| `components/*.tsx`    | Button, Badge, Avatar, TextAction, IconAction, Textfield, Input. |
| `components/index.ts` | Barrel export.                                                |
| `Stickersheet.tsx`    | One of every variant — paste into Figma to expose the library and verify names. |
| `GUIDELINES.md`       | Text to paste into Figma Make's guidelines.                   |

## Tokens are generated — one source of truth

`../tokens/*.json` is the **only** place you edit tokens. `tokens.css` is a build
output. After changing any token JSON, regenerate:

```sh
node make-kit/build-tokens.js
```

The script flattens every token group into CSS variables (`--theme-…`,
`--spacing-…`, `--radius-…`, `--typography-…`, `--shadow-…`, `--breakpoint-…`)
across the catapa light/dark and harmony themes. Never edit `tokens.css` by hand —
your changes would be overwritten on the next build.

## Setup in Figma Make

1. Add `tokens.css`, `components/`, and `Stickersheet.tsx` to the Make project.
2. Import `tokens.css` once at the root.
3. Paste `GUIDELINES.md` into the project's guidelines so Make always composes
   from the kit and keeps the `Component/variant/size` names.

## The naming convention

Every component emits `data-name="Component/variant/size"`:

| Layer name             | → DS component set | Variant props set        |
| ---------------------- | ------------------ | ------------------------ |
| `Button/primary/large` | Button             | Variant=primary, Size=large |
| `Badge/info`           | Badge              | Variant=info             |
| `Avatar/circle/md`     | Avatar             | Shape=circle, Size=md    |
| `Textfield/error`      | Textfield          | State=error              |

The plugin scores the **base** (`Button`) against your component sets, then maps
the remaining parts onto whichever variant property contains each value — so
property naming on the Figma side doesn't have to match exactly.

## End-to-end workflow

1. **Once:** in your Figma DS library, build the 7 components as component sets
   with variant properties (primary/secondary/…, default/large, etc.). Publish.
2. **Once:** paste the **Stickersheet** into your working file (or keep the
   library used there) so the plugin's catalog sees every component.
3. Generate a screen in Figma Make using the kit → copy into Figma.
4. Select it, run **Make → Design System**, review the suggested mappings
   (variants are auto-filled from the names), and **Swap**.

## Verify the names (don't assume)

Figma Make's layer-naming isn't a documented contract and can change. After your
first generation, paste into Figma and **read the Layers panel**: confirm names
look like `Button/primary/large`. If Make collapses or renames layers, adjust the
`data-name` strings in the components (or the guidelines) until they survive the
copy — then the rest of the pipeline is automatic.

## Notes

- Components use inline styles bound to the CSS vars, so they're self-contained
  and don't need a Tailwind config. You can later map the same vars into a
  Tailwind theme if you prefer utility classes.
- Interactive `:hover`/`:focus` visuals are represented as explicit `state`
  props (e.g. `Textfield state="focus"`) so a specific state can be rendered for
  the stickersheet; wire real interaction in app code as needed.
- Icon glyphs use Font Awesome 5 (per `typography.icon`); pass the glyph via the
  `icon` / `leadingIcon` props.
