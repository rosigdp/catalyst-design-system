# Button

Buttons trigger actions.

## When to Use

Use a button when:

* The action is the primary call to action within a page or component.
* The action requires immediate user attention.
* The action is displayed alongside other buttons, such as in toolbars, filter sections, or modal footers.

## Anatomy

A button may contain:

* Text
* Leading icon
* Trailing icon

Icon usage:

* Use a leading icon when the action is commonly represented by an icon elsewhere in the product, improving recognition and familiarity.
* Use a trailing icon only for dropdown actions.

## Variants

### Primary

Use for the strongest action within a context.

Examples:

* Save
* Submit
* Add
* Download

Rules:

* Only one primary button should appear within the same button group.
* When uncertain, the default action is typically primary.

### Secondary

Use for supporting or alternative actions.

Examples:

* Cancel
* Back
* Close
* Unlock

### Destructive

Use for negative actions.

Examples:

* Delete
* Remove
* Cancel

Rules:

* Use only when the action may alter, remove, or invalidate data.

## Sizes

### Default

The standard button size.

Use for:

* Tables
* General page actions
* Toolbars
* Component actions

### Large

Reserved for final form actions.

Examples:

* Save
* Submit
* Process
* Approve
* Continue

Rules:

* Place at the bottom of forms, modals, filters, or cards.
* Use only for the primary completion action.
* When uncertain, use Default.

## Shapes

### Default

Use for buttons containing text.

Examples:

* Save
* Cancel
* Delete

### Circle

Special case, use for icon-only buttons.

Current usage:

* Upload Avatar
* Help

Rules:

* Circle buttons should contain an icon only.
* Do not place text inside a circle button.

## Button Types

### Text + Icon Button

Use when an icon improves recognition of a common action.

Common icons:

* plus (Add)
* trash-alt (Delete)
* filter (Filter)
* list (Data Statistics Details)

### Text Button

Use when the action is too specific to be represented clearly by an icon.

### Icon Button

Use when space is limited and the icon meaning is widely understood.

Examples:

* Upload Avatar
* Help
* View Data Statistic Details
* View Controls

Rules:

* Provide a tooltip when the action is not already described by nearby context.

### Dropdown Button

Use when several related actions need to be grouped under a single button.

Examples:

* Types of files on Download action
* More Actions

## Grouping

Rules:

* Display buttons inline whenever possible.
* Place primary buttons on the rightmost side of the group.
* Place destructive buttons on the leftmost side of the group.
* Place secondary buttons between destructive and primary buttons.
* All buttons in a group should have the same size.

## Placement

### Top

Use for toolbar and component actions.

Rules:

* Place primary and secondary actions on the top-right side of the component.
* When possible, place destructive actions on the top-left side.

### Bottom

Use for completion and confirmation actions.

Rules:

* Place all actions on the bottom-left side.

## Specification Notes

* Buttons may collapse into icon buttons on smaller screens.
* Multiple actions may be grouped into a dropdown button.
* Icon-only buttons should display their label in a tooltip unless the action is already described by nearby context.
* Button labels use Title Case.
* Button labels should be a verb whenever possible.
