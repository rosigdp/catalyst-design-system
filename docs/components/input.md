# Input

Inputs provide a consistent structure for collecting, displaying, and validating user-entered information.

Input is a base component used by form controls such as textfields, radio groups, checkbox groups, and other input types.

## Purpose

The input component establishes a shared structure for:

* Labels
* Label metadata
* Supporting text
* Validation messages
* Orientation

Individual input types define their own control behavior and appearance.

## Structure

An input consists of:

1. Label
2. Input Control
3. Supporting Text

## Orientation

### Vertical

Use for most forms.

### Horizontal

Use when labels and controls need to be compact, such as for filters on top of a table.

## Label

Labels identify the purpose of an input.

Rules:

* Use clear and concise language.
* Use noun or the name of the data if possible.
* Use terminology that users understand.
* Always use label unless for inputs on table column when a header column can serve as the label.

Examples:

* Employee Name
* Country
* Effective Date
* Tax Status

## Label Metadata

Labels may contain additional metadata.

### Optional

Indicates the field is not required.

Rules:
* Use parentheses, i.e. (Optional).
* Do not use this or asterisks (*) for mandatory inputs.

### Metric

Provides unit context.

Current use:

* Currency: e.g. (IDR), (USD), etc.
* Percentage: e.g. (%).

### Question Icon

Displays additional context about the data.

Rules:

* Use `question-circle` icon.
* Opens a tooltip.
* Use if the label cannot explain the data context by itself.

### Info Icon

Displays contextual information.

Rules:

* Use `info-circle` icon.
* Only use if guide infobox corresponding to the inputs is used.

## Supporting Text

Supporting text appears below the input control.

Use for:

* Short input guidance
* Contextual hints
* Validation feedback
* Status messages

Examples:

Rules:

* Keep supporting text concise.
* Use supporting text only when it adds value.
* Use guide infobox instead if the input guidance are long and detailed.

## States

### Default

The standard appearance.

### Error

Use when validation fails.

Rules:

* Error messages are displayed in the supporting text area, e.g. "This field is required".
* Input is focused on the first error of the page.

## Input Types

The following components use the input base component:

* Textfield
* Radio Group
* Checkbox Group
* File Upload
* Multi Select

Each input type defines:

* Control appearance
* Control states
* Selection behavior
* Input-specific interactions

while inheriting:

* Label
* Label metadata
* Orientation
* Supporting text
* Validation messaging

from the input component.

## Specification Notes

* Input defines layout and metadata only.
* Input does not define the visual appearance of the control itself.
* Input types are responsible for control-specific states and interactions.
* Orientation should be chosen based on readability, available space, and form complexity.
