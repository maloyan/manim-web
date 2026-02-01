# Class: Hoverable

Defined in: [interaction/Hoverable.ts:25](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Hoverable.ts#L25)

Adds hover effects to a mobject.

## Constructors

### Constructor

> **new Hoverable**(`mobject`, `scene`, `options?`): `Hoverable`

Defined in: [interaction/Hoverable.ts:45](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Hoverable.ts#L45)

Create a new Hoverable behavior.

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

The mobject to add hover effects to

##### scene

[`Scene`](Scene.md)

The scene containing the mobject

##### options?

[`HoverableOptions`](../interfaces/HoverableOptions.md)

Hoverable configuration options

#### Returns

`Hoverable`

## Accessors

### isEnabled

#### Get Signature

> **get** **isEnabled**(): `boolean`

Defined in: [interaction/Hoverable.ts:75](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Hoverable.ts#L75)

Get whether hovering is enabled.

##### Returns

`boolean`

***

### isHovering

#### Get Signature

> **get** **isHovering**(): `boolean`

Defined in: [interaction/Hoverable.ts:68](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Hoverable.ts#L68)

Get whether the mobject is currently being hovered.

##### Returns

`boolean`

***

### mobject

#### Get Signature

> **get** **mobject**(): [`Mobject`](Mobject.md)

Defined in: [interaction/Hoverable.ts:82](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Hoverable.ts#L82)

Get the mobject this hoverable is attached to.

##### Returns

[`Mobject`](Mobject.md)

## Methods

### disable()

> **disable**(): `void`

Defined in: [interaction/Hoverable.ts:195](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Hoverable.ts#L195)

Disable hovering and reset to original state.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [interaction/Hoverable.ts:205](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Hoverable.ts#L205)

Clean up event listeners.

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [interaction/Hoverable.ts:188](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Hoverable.ts#L188)

Enable hovering.

#### Returns

`void`
