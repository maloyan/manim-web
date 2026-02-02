# Interface: SelectionManagerOptions

Defined in: [interaction/SelectionManager.ts:19](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/SelectionManager.ts#L19)

Options for configuring the SelectionManager.

## Properties

### boxSelectColor?

> `optional` **boxSelectColor**: `string`

Defined in: [interaction/SelectionManager.ts:27](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/SelectionManager.ts#L27)

Color of the box selection overlay. Defaults to '#58C4DD' (manim blue).

***

### boxSelectOpacity?

> `optional` **boxSelectOpacity**: `number`

Defined in: [interaction/SelectionManager.ts:25](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/SelectionManager.ts#L25)

Opacity of the box selection overlay. Defaults to 0.15.

***

### highlightColor?

> `optional` **highlightColor**: `string`

Defined in: [interaction/SelectionManager.ts:21](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/SelectionManager.ts#L21)

Color of the selection highlight outline. Defaults to '#FFFF00' (yellow).

***

### highlightWidth?

> `optional` **highlightWidth**: `number`

Defined in: [interaction/SelectionManager.ts:23](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/SelectionManager.ts#L23)

Width of the selection highlight outline. Defaults to 2.

***

### onSelectionChange()?

> `optional` **onSelectionChange**: (`selected`) => `void`

Defined in: [interaction/SelectionManager.ts:29](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/interaction/SelectionManager.ts#L29)

Callback when selection changes.

#### Parameters

##### selected

`ReadonlySet`\<[`Mobject`](../classes/Mobject.md)\>

#### Returns

`void`
