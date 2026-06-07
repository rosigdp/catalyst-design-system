# Icon Action

An icon action is an icon that performs an action when clicked.

Icon actions are typically displayed individually or as a group of actions associated with a specific item or component.

The following are not considered icon actions:

- Input control icons: Operate the parent control rather than performing an action.
- Help icons: Reveal information rather than performing an action.
- Status icons: Communicate state rather than performing an action.

## When to Use

Use an icon action when:

* Space is limited.
* The action is commonly represented by a recognizable icon.
* The action is contextual to a specific item or component.
* The action is part of a group of related actions.

Avoid using icon actions when:

* The action is the primary call to action.
* The icon meaning may be unclear.
* The action requires strong visual emphasis.

## Anatomy

An icon action contains an icon.

Rules:

* Use icons that are already established within the product.
* Avoid introducing custom icon meanings.
* Icon actions should provide a visible label through a tooltip, column header, or nearby context.

## Variants

### Action

Use for standard actions.

Examples:

* pencil-alt (Edit)
* eye (View)
* download (Download)
* plus (Add)

### Destructive

Use for destructive actions.

Examples:

* trash-alt (Delete)
* times (Remove)

Rules:

* Use only when the action may alter, remove, or invalidate data.

## Component Use Cases

### Table Column

Common use:

* Edit row
* Delete row

Rules:

* Use the column header to provide the action label instead of displaying tooltips on every row action.

### Card

Use for contextual actions related to the card content.

Rules:

* Place action icons as a group on the right side of the card header.

### Other Components

Use when the icon meaning is recognizable within the component context.

Examples:

* Delete file
* Download file

## Grouping

Rules:

* Display icon actions inline.
* Group related actions together.
* When action and destructive icon actions appear together, place the action on the right.
* Consider a dropdown menu when more than three icon actions are required.
* Icon actions and text actions may appear within the same action group.
* Do not mix icon actions with buttons within the same action group.

## Specification Notes

* Icon actions do not contain text.
* Icon actions do not have a disabled state.
* Use text actions when the action label is important for understanding.
* Use buttons when stronger visual emphasis is required.
