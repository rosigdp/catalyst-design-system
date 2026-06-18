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

| Component    | Props                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| `Button`     | `variant` primary \| secondary \| destructive \| card · `size` default \| large · `leadingIcon` / `trailingIcon` (content is auto-inferred from which slots are provided) |
| `Badge`      | `variant` positive \| negative \| warning \| disable \| info                   |
| `Avatar`     | `shape` circle \| square · `size` xs \| sm \| md \| lg \| xl · `state` default \| disabled · `mode` view \| edit · `src` / `initials` (visualization is auto-inferred from src/initials) |
| `TextAction` | `variant` link \| action \| destructive                                        |
| `IconAction` | `variant` action \| destructive · `icon`                                       |
| `Textfield`  | `mode` edit \| view · `state` default \| focus \| error \| disabled · `multiLine` · `leadingIcon` / `trailingIcon` · `leadingButton` / `trailingButton` |
| `Input`      | wraps a control: `label`, `supportingText`, `state` default \| error, `optional`, `metric`, `counter`, `questionIcon`, `infoIcon`, `selectionInfobox` |

Notes for Button:

- `card` is an outlined CTA (dashed brand-colored border on white). Use sparingly for "add"-style affordances; per the design system it is only intended for `size="large"` with a leading icon + label.
- Don't set `content` explicitly. Just provide the relevant slots — `leadingIcon`, `trailingIcon`, or the label as children — and the component sets the right Figma `Content` variant automatically (`Leading Icon + Label`, `Icon Only`, `Label Only`, etc.).

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

Each kit component already emits a `data-name` carrying its variant properties
in slash-separated form. Do not rename or strip these — the
**Make → Design System** Figma plugin matches the base against your component
set and maps each suffix part to whichever variant property contains that value.

| Component   | data-name shape                                       |
| ----------- | ----------------------------------------------------- |
| Button      | `Button/{variant}/{size}/{content}`                   |
| Badge       | `Badge/{variant}`                                     |
| Avatar      | `Avatar/{size}/{shape}/{visualization}/{state}/{mode}`|
| TextAction  | `TextAction/{variant}`                                |
| IconAction  | `IconAction/{variant}`                                |
| Textfield   | `Textfield/{mode}/{state}`                            |
| Input       | `Input/{state}`                                       |

When you must add a wrapper, give it a meaningful `data-name`; never leave layers
as `Frame`, `Group`, or `div`.
