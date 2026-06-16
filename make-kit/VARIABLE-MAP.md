# Variable reconciliation: tokens JSON ↔ Figma library

Goal: make `tokens/*.json` the single source of truth for **both** the Make CSS
(`tokens.css`) and the Figma Variables. Today the Figma file
(`Styles - Reusable Components`) uses ad-hoc names that don't match the JSON.

> Scope: this map currently covers only the variables observed on the **Button**
> component set (node `14933-1867`). The remaining components need a scan to
> complete it. Pattern is representative.

## Canonical naming (from the JSON)

The JSON token path *is* the canonical name. In Figma that becomes a collection +
slash-grouped variable; in CSS it's the kebab var already emitted by
`build-tokens.js`.

| JSON path                      | Canonical Figma variable      | CSS var (tokens.css)              |
| ------------------------------ | ----------------------------- | --------------------------------- |
| `theme.brand.default`          | `theme` → `brand/default`     | `--theme-brand-default`           |
| `theme.accent.default`         | `theme` → `accent/default`    | `--theme-accent-default`          |
| `theme.system.foreground`      | `theme` → `system/foreground` | `--theme-system-foreground`       |
| `theme.system.foreground20`    | `theme` → `system/foreground20` | `--theme-system-foreground-20`  |
| `theme.system.background`      | `theme` → `system/background` | `--theme-system-background`       |
| `theme.system.onSurfaceBrand`  | `theme` → `system/onSurfaceBrand` | `--theme-system-on-surface-brand` |
| `theme.negative.background`    | `theme` → `negative/background` | `--theme-negative-background`   |
| `theme.disable.background`     | `theme` → `disable/background`  | `--theme-disable-background`     |
| `theme.disable.foreground`     | `theme` → `disable/foreground`  | `--theme-disable-foreground`     |
| `spacing.lg`                   | `spacing` → `lg`              | `--spacing-lg`                    |
| `radius.default` / `radius.full` | `radius` → `default` / `full` | `--radius-default` / `--radius-full` |
| `typography.body`              | text style `body`             | `--typography-body`               |
| `effects.shadow.sm`            | effect style `shadow/sm`      | `--shadow-sm`                     |

## Current Figma → canonical (renames needed)

| Current Figma name              | Resolved value   | Should be (canonical)            | Note |
| ------------------------------- | ---------------- | -------------------------------- | ---- |
| `var(--ctp-brand)`              | `#00c983`        | `theme/brand/default`            | rename |
| `var(--ctp-accent)`             | `#0099ff`        | `theme/accent/default`           | rename |
| `var(--ctp-system-background)`  | `#ffffff`        | `theme/system/background`        | rename |
| `var(--ctp-system-foreground)`  | `#333333`        | `theme/system/foreground`        | rename (value is correct/solid; the MCP just serialized it as 8-digit hex) |
| `var(--ctp-negative-background)`| `#d9624f`        | `theme/negative/background`      | rename |
| `var(--ctp-disable-background)` | `#e8e8e8`        | `theme/disable/background`       | rename |
| `var(--ctp-disable-foreground)` | `#777777`        | `theme/disable/foreground`       | rename |
| `system/on-surface-brand`       | `#ffffff`        | `theme/system/onSurfaceBrand`    | regroup under `theme` |
| `system/on-surface-dark`        | `#ffffff`        | `theme/system/onSurfaceDark`     | regroup |
| `system/shadow-elevation`       | `#33333333`      | `theme/system/shadowElevation`   | regroup |
| `Margin & Padding/lg` (sm/md/xl)| `24` (8/16/32)   | `spacing/lg` (sm/md/xl)          | rename collection → `spacing` |
| `default` / `full` (radius)     | `3` / `9999`     | `radius/default` / `radius/full` | move into a `radius` collection |
| `Body Text` (text style)        | Open Sans 13/24  | `body`                           | rename text style |
| `Hero Title` (text style)       | Open Sans 24/36  | `h1`                             | rename text style |
| `Font Awesome Icon` (text style)| FA5 13/900       | `icon`                           | rename text style |
| `Floating Button Elevation`     | drop shadow      | `shadow/sm`                      | rename effect style |

## Inconsistency to resolve on the Figma side

**Mixed conventions** — colors use both `--ctp-*` (flat) and `system/*`
(grouped). Pick one: the canonical `theme/<group>/<key>` grouping. (Values
themselves check out.)

## Does this block the swap?

**No.** Instances created by the plugin keep whatever variables the component set
already binds. Renaming is about a clean shared token contract (and future Code
Connect), not about making the swap work. Prove the swap first; reconcile names as
a deliberate pass.

## How to enforce it from the JSON

Extend `build-tokens.js` with a second emitter that outputs a
**Tokens-Studio-format** JSON (or a Variables import) from the same
`tokens/*.json`. Importing that into Figma creates correctly-named variables in
one shot, instead of hand-renaming. (Not built yet — say the word.)
