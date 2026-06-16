# Catalyst — Figma Make guidelines

Paste this into your Figma Make project's **guidelines / system prompt** so every
generation composes from the Catalyst kit with names the swap plugin understands.

---

## Design system

Build UI **only** from the Catalyst kit components. Never hand-roll a button,
badge, input, avatar, or link with raw `<div>`/`<button>` elements — import and
use the kit instead:

```tsx
import { Button, Badge, Avatar, TextAction, IconAction, Textfield, Input } from "./components";
```

Available components and their props:

| Component    | Props (variant / size / state)                          |
| ------------ | ------------------------------------------------------- |
| `Button`     | `variant` primary \| secondary \| destructive · `size` default \| large |
| `Badge`      | `variant` positive \| negative \| warning \| disable \| info |
| `Avatar`     | `shape` circle \| square · `size` xs \| sm \| md \| lg \| xl · `src` / `initials` |
| `TextAction` | `variant` link \| action \| destructive                 |
| `IconAction` | `variant` action \| destructive                         |
| `Textfield`  | `state` default \| focus \| error \| disabled · `multiLine` |
| `Input`      | wraps a control: `label`, `supportingText`, `state` default \| error |

## Tokens

All colors, spacing, radius, typography, and shadows come from `tokens.css`
(loaded at the project root). **Never use hardcoded hex/px values** for anything
the tokens cover — use the components, which already bind to:

- color → `var(--theme-…)`   (e.g. `--theme-brand-default`, `--theme-system-foreground`)
- spacing → `var(--spacing-xs|sm|md|lg|xl)`
- radius → `var(--radius-default|full)`
- type → `var(--typography-body|small|label|link|h1…h5)`

Theme switching: default = catapa/light, add `class="dark"` for dark, or
`data-theme="harmony"` for the harmony theme.

## Naming (critical for design handoff)

Each kit component already emits a `data-name` of the form
**`Component/variant/size`** (e.g. `Button/primary/large`, `Badge/info`,
`Avatar/circle/md`). Do not rename or strip these. They let the
**Make → Design System** Figma plugin map each layer to the matching design-system
component set and set its variant properties automatically.

When you must add a wrapper, give it a meaningful `data-name`; never leave layers
as `Frame`, `Group`, or `div`.
