# Class: Draggable

Defined in: [interaction/Draggable.ts:25](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L25)

Makes a mobject draggable with mouse and touch support.

## Constructors

### Constructor

> **new Draggable**(`mobject`, `scene`, `options?`): `Draggable`

Defined in: [interaction/Draggable.ts:47](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L47)

Create a new Draggable behavior.

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

The mobject to make draggable

##### scene

[`Scene`](Scene.md)

The scene containing the mobject

##### options?

[`DraggableOptions`](../interfaces/DraggableOptions.md)

Draggable configuration options

#### Returns

`Draggable`

## Accessors

### isDragging

#### Get Signature

> **get** **isDragging**(): `boolean`

Defined in: [interaction/Draggable.ts:66](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L66)

Get whether the mobject is currently being dragged.

##### Returns

`boolean`

***

### isEnabled

#### Get Signature

> **get** **isEnabled**(): `boolean`

Defined in: [interaction/Draggable.ts:73](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L73)

Get whether dragging is enabled.

##### Returns

`boolean`

***

### mobject

#### Get Signature

> **get** **mobject**(): [`Mobject`](Mobject.md)

Defined in: [interaction/Draggable.ts:80](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L80)

Get the mobject this draggable is attached to.

##### Returns

[`Mobject`](Mobject.md)

## Methods

### disable()

> **disable**(): `void`

Defined in: [interaction/Draggable.ts:225](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L225)

Disable dragging.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [interaction/Draggable.ts:232](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L232)

Clean up event listeners.

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [interaction/Draggable.ts:218](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Draggable.ts#L218)

Enable dragging.

#### Returns

`void`
