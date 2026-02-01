# Class: Unwrite

Defined in: [animation/creation/Create.ts:938](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/creation/Create.ts#L938)

Unwrite animation - reverse of Write, erases text character by character.

## Extends

- [`Write`](Write.md)

## Constructors

### Constructor

> **new Unwrite**(`mobject`, `options`): `Unwrite`

Defined in: [animation/creation/Create.ts:939](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/creation/Create.ts#L939)

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

##### options

[`WriteOptions`](../interfaces/WriteOptions.md) = `{}`

#### Returns

`Unwrite`

#### Overrides

[`Write`](Write.md).[`constructor`](Write.md#constructor)

## Properties

### \_hasBegun

> `protected` **\_hasBegun**: `boolean` = `false`

Defined in: [animation/Animation.ts:37](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L37)

Track if begin() has been called

#### Inherited from

[`Write`](Write.md).[`_hasBegun`](Write.md#_hasbegun)

***

### \_isFinished

> `protected` **\_isFinished**: `boolean` = `false`

Defined in: [animation/Animation.ts:34](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L34)

Whether the animation has finished

#### Inherited from

[`Write`](Write.md).[`_isFinished`](Write.md#_isfinished)

***

### \_startTime

> `protected` **\_startTime**: `number` = `null`

Defined in: [animation/Animation.ts:31](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L31)

Time when the animation started (set by Timeline)

#### Inherited from

[`Write`](Write.md).[`_startTime`](Write.md#_starttime)

***

### duration

> `readonly` **duration**: `number`

Defined in: [animation/Animation.ts:25](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L25)

Duration of the animation in seconds

#### Inherited from

[`Write`](Write.md).[`duration`](Write.md#duration)

***

### lagRatio

> `protected` `readonly` **lagRatio**: `number`

Defined in: [animation/creation/Create.ts:446](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/creation/Create.ts#L446)

#### Inherited from

[`Write`](Write.md).[`lagRatio`](Write.md#lagratio)

***

### mobject

> `readonly` **mobject**: [`Mobject`](Mobject.md)

Defined in: [animation/Animation.ts:22](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L22)

The mobject being animated

#### Inherited from

[`Write`](Write.md).[`mobject`](Write.md#mobject)

***

### rateFunc

> `readonly` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:28](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L28)

Rate function controlling the animation's pacing

#### Inherited from

[`Write`](Write.md).[`rateFunc`](Write.md#ratefunc)

***

### remover

> **remover**: `boolean` = `false`

Defined in: [animation/Animation.ts:43](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L43)

If true, the scene will remove this mobject after the animation finishes.
Used by FadeOut (like Python manim's remover=True).

#### Inherited from

[`Write`](Write.md).[`remover`](Write.md#remover)

## Accessors

### startTime

#### Get Signature

> **get** **startTime**(): `number`

Defined in: [animation/Animation.ts:125](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L125)

Get the start time of this animation (set by Timeline)

##### Returns

`number`

#### Set Signature

> **set** **startTime**(`time`): `void`

Defined in: [animation/Animation.ts:132](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L132)

Set the start time of this animation (used by Timeline)

##### Parameters

###### time

`number`

##### Returns

`void`

#### Inherited from

[`Write`](Write.md).[`startTime`](Write.md#starttime)

## Methods

### begin()

> **begin**(): `void`

Defined in: [animation/creation/Create.ts:488](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/creation/Create.ts#L488)

Called when the animation starts.
Subclasses can override to set up initial state.

#### Returns

`void`

#### Inherited from

[`Write`](Write.md).[`begin`](Write.md#begin)

***

### finish()

> **finish**(): `void`

Defined in: [animation/creation/Create.ts:813](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/creation/Create.ts#L813)

Called when the animation ends.
Subclasses can override to clean up or finalize state.

#### Returns

`void`

#### Inherited from

[`Write`](Write.md).[`finish`](Write.md#finish)

***

### interpolate()

> **interpolate**(`alpha`): `void`

Defined in: [animation/creation/Create.ts:676](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/creation/Create.ts#L676)

Apply the animation at a given progress value.

#### Parameters

##### alpha

`number`

Progress from 0 (start) to 1 (end)

#### Returns

`void`

#### Inherited from

[`Write`](Write.md).[`interpolate`](Write.md#interpolate)

***

### isFinished()

> **isFinished**(): `boolean`

Defined in: [animation/Animation.ts:109](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L109)

Check if the animation has finished

#### Returns

`boolean`

#### Inherited from

[`Write`](Write.md).[`isFinished`](Write.md#isfinished)

***

### reset()

> **reset**(): `void`

Defined in: [animation/Animation.ts:116](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L116)

Reset the animation to its initial state

#### Returns

`void`

#### Inherited from

[`Write`](Write.md).[`reset`](Write.md#reset)

***

### update()

> **update**(`_dt`, `currentTime`): `void`

Defined in: [animation/Animation.ts:79](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L79)

Update the animation for the current frame.

#### Parameters

##### \_dt

`number`

Time delta since last frame (unused, but available for subclasses)

##### currentTime

`number`

Current time in the timeline

#### Returns

`void`

#### Inherited from

[`Write`](Write.md).[`update`](Write.md#update)
