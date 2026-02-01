# Interface: DraggableOptions

Defined in: [interaction/Draggable.ts:7](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L7)

Options for configuring draggable behavior.

## Properties

### constrainX?

> `optional` **constrainX**: \[`number`, `number`\]

Defined in: [interaction/Draggable.ts:9](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L9)

X-axis constraints as [min, max] or null for no constraint

***

### constrainY?

> `optional` **constrainY**: \[`number`, `number`\]

Defined in: [interaction/Draggable.ts:11](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L11)

Y-axis constraints as [min, max] or null for no constraint

***

### onDrag()?

> `optional` **onDrag**: (`mobject`, `position`, `delta`) => `void`

Defined in: [interaction/Draggable.ts:15](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L15)

Callback during drag with position and delta

#### Parameters

##### mobject

[`Mobject`](../classes/Mobject.md)

##### position

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`void`

***

### onDragEnd()?

> `optional` **onDragEnd**: (`mobject`, `position`) => `void`

Defined in: [interaction/Draggable.ts:17](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L17)

Callback when drag ends

#### Parameters

##### mobject

[`Mobject`](../classes/Mobject.md)

##### position

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`void`

***

### onDragStart()?

> `optional` **onDragStart**: (`mobject`, `position`) => `void`

Defined in: [interaction/Draggable.ts:13](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L13)

Callback when drag starts

#### Parameters

##### mobject

[`Mobject`](../classes/Mobject.md)

##### position

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`void`

***

### snapToGrid?

> `optional` **snapToGrid**: `number`

Defined in: [interaction/Draggable.ts:19](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L19)

Grid size for snapping, or null for no snapping
