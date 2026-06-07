# Avatar

Avatars visually represent an entity.

## When to Use

Use an avatar when:

* Displaying a user profile.
* Displaying a company, product, or business entity.
* Displaying ownership, authorship, or assignment.
* A visual identifier is needed but a full image may not be available.

Avoid using avatars for:

* Decorative images.
* Content illustrations.
* Image galleries.
* Interactive actions.

## Shapes

### Circle

Use for people and user profiles.

Examples:

* Employee
* User
* Approver
* Requestor

### Square

Use for business entities.

Examples:

* Company
* Product
* Branch
* Department

## Visualization Types

### Image

Use when an image is available.

Rules:

* Images should use cover fit mode.
* The image should fill the entire avatar area.

### Initials

Use when an image is unavailable.

Rules:

* Display up to two alphabetical characters.
* Use generated background colors.
* Text should remain readable against the selected background color.

Examples:

* John Doe → JD
* CATAPA → C

### Placeholder

Use when neither an image nor initials can be determined.

Examples:

* New company before a name is entered.
* Empty profile image during creation.

Rules:

* Use the placeholder icon.
* Use disabled colors.

## Sizes

### XS

Common use:

* Dense tables
* Compact lists

### SM

Common use:

* Lists
* Cards
* Navigation

### MD

Common use:

* Employee summaries
* Profile sections

### LG

Common use:

* Detail page headers
* Employee profiles
* Company profiles

### XL

Common use:

* Profile pages
* Identity-focused screens

### Custom

Use when required by the use case.

## Supporting Button

Use a supporting button when the avatar is interactive.

Examples:

* Upload image
* Change image
* Edit image
* Zoom image

Rules:

* Place at the bottom-right corner of the avatar.
* Overlap the avatar boundary.
* Use a circular shape.

## States

### Default

Displays either an image or initials.

Rules:

* If the image is loading, display initials until the image is available.

### Empty

Displays the placeholder visualization.

Use when:

* No image is available.
* Initials cannot yet be determined.

### Disabled

Represents an inactive or unavailable user or entity.

Rules:

* Display the avatar in grayscale.

## Specification Notes

* Avatars use a 1:1 aspect ratio.
* Avatars do not perform actions themselves.
* Use a supporting button to indicate avatar-related actions.
* Use initials before placeholder whenever initials can be generated.
