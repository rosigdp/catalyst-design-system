# Textfield

Textfields allow users to input and edit text.

## Base

Textfield uses `input` as its base component.

## When to Use

Use a textfield when:

* The input is text in any format.
* The text input can be typed directly or sourced from selection by picker button.

## Types

### Single Line

Use for short values.

Examples:

* Employee Name
* Email Address
* Phone Number
* ID Number

Rules:

* Text does not wrap.
* Resize is not available.

### Multi Line

Use for longer free-text values.

Examples:

* Address
* Description
* Reason

Rules:

* Text can wrap.
* Resize is available.

## Modes

### Edit

Use when the value can be entered or changed.

Edit mode displays the textfield container with padding, border, background, and interaction states.

### View

Use after the value is saved or when the value is shown as read-only information.

View mode displays only:

* Label
* Value

## Anatomy

A textfield may contain:

* Value
* Placeholder
* Icon
* Leading button
* Trailing button

## Value

User input or value populated from selection.

Rules:

* Selected values should populate the textfield.
* Selected value of single selection populate the textfield with the main attribute of the value, e.g. Name.
* Selected value of multiple selection populate the textfield with "{number of selection} {input label}(s) selected".

## Placeholder

Show placeholder text when input is empty.

Rules:

* Placeholder is sentence case.
* Use "Type {input label}" if input can only be typed.
* Use "Select {input label}" if input can be selected, such as for dropdown textfield.
* Use "Search {input label}" for search textfield.

## Icons

Textfield icons are control icons, not icon actions.

Current use:

* times (Clear)
* caret-down (Dropdown)
* calendar-alt (Date/Month/Year Picker)
* search (Search)

Rules:

* Only use those defined in current use.
* Put icons on the right end of the textfield.
* Only use one icon at one textfield, except for the Clear icon.
* Clear icon is on the left side of another icon.
* Only show Clear icon when input is Optional.

## Buttons

Textfields may include a button on either side of the textfield.

Common examples:

* Trailing button, `user` icon (Select employee)
* Leading button, Country + `caret-down` icon (Select country)
* Trailing button, `eye` icon (Show password)
* Trailing button, `list` icon (Open picker)
* Trailing button, Parameter + `caret-down` icon (Select parameter)

Rules:

* Textfield buttons use the secondary button variant.
* Use this pattern when the textfield needs a selection mechanism or additional functionality.

## States

### Default

The initial appearance when the textfield is not interacted with.

### Focus

Use when the textfield receives focus by clicking or keyboard navigation.

Rules:

* Apply `effects.focus.glow`.
* Change the border to the brand color.

### Error

Use when validation fails.

Rules:

* Change the border to the negative color.
* Show the error message in the supporting text area.
* Use negative color for the supporting text.

### Disabled

Use when the textfield cannot be typed in.

Rules:

* Do not allow typing.
* The value can still be populated from selectors, such as Employee Picker or Picker Modal.

## Supporting Text

Use supporting text for:

* Contextual hints
* Feedback
* Validation messages

Rules:

* Supporting text appears below the textfield.
* Supporting text uses small typography.
* Error messages use negative color.
* Use an infobox instead when the message needs stronger emphasis or more context.
