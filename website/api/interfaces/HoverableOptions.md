# Interface: HoverableOptions

Defined in: [interaction/Hoverable.ts:7](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/Hoverable.ts#L7)

Options for configuring hoverable behavior.

## Properties

### cursor?

> `optional` **cursor**: `string`

Defined in: [interaction/Hoverable.ts:19](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/Hoverable.ts#L19)

CSS cursor on hover, default 'pointer'

***

### hoverColor?

> `optional` **hoverColor**: `string`

Defined in: [interaction/Hoverable.ts:15](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/Hoverable.ts#L15)

Color change on hover, or null for no change

***

### hoverOpacity?

> `optional` **hoverOpacity**: `number`

Defined in: [interaction/Hoverable.ts:17](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/Hoverable.ts#L17)

Opacity change on hover, or null for no change

***

### hoverScale?

> `optional` **hoverScale**: `number`

Defined in: [interaction/Hoverable.ts:13](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/Hoverable.ts#L13)

Scale factor on hover, default 1.1

***

### onHoverEnd()?

> `optional` **onHoverEnd**: (`mobject`) => `void`

Defined in: [interaction/Hoverable.ts:11](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/Hoverable.ts#L11)

Callback when hover ends

#### Parameters

##### mobject

[`Mobject`](../classes/Mobject.md)

#### Returns

`void`

***

### onHoverStart()?

> `optional` **onHoverStart**: (`mobject`) => `void`

Defined in: [interaction/Hoverable.ts:9](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/Hoverable.ts#L9)

Callback when hover starts

#### Parameters

##### mobject

[`Mobject`](../classes/Mobject.md)

#### Returns

`void`
