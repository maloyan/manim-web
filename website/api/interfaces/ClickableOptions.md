# Interface: ClickableOptions

Defined in: [interaction/Clickable.ts:7](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/interaction/Clickable.ts#L7)

Options for configuring clickable behavior.

## Properties

### onClick()

> **onClick**: (`mobject`, `event`) => `void`

Defined in: [interaction/Clickable.ts:9](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/interaction/Clickable.ts#L9)

Callback when the mobject is clicked

#### Parameters

##### mobject

[`Mobject`](../classes/Mobject.md)

##### event

`MouseEvent`

#### Returns

`void`

***

### onDoubleClick()?

> `optional` **onDoubleClick**: (`mobject`, `event`) => `void`

Defined in: [interaction/Clickable.ts:11](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/interaction/Clickable.ts#L11)

Callback when the mobject is double-clicked

#### Parameters

##### mobject

[`Mobject`](../classes/Mobject.md)

##### event

`MouseEvent`

#### Returns

`void`
