# Class: ScaleInPlace

Defined in: [animation/transform/TransformExtensions.ts:947](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/transform/TransformExtensions.ts#L947)

ScaleInPlace animation - scales a mobject without moving its center.
Unlike regular scale which might affect position, this keeps center fixed.

## Extends

- [`Animation`](Animation.md)

## Constructors

### Constructor

> **new ScaleInPlace**(`mobject`, `options`): `ScaleInPlace`

Defined in: [animation/transform/TransformExtensions.ts:960](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/transform/TransformExtensions.ts#L960)

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

##### options

[`ScaleInPlaceOptions`](../interfaces/ScaleInPlaceOptions.md)

#### Returns

`ScaleInPlace`

#### Overrides

[`Animation`](Animation.md).[`constructor`](Animation.md#constructor)

## Properties

### \_hasBegun

> `protected` **\_hasBegun**: `boolean` = `false`

Defined in: [animation/Animation.ts:37](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L37)

Track if begin() has been called

#### Inherited from

[`Animation`](Animation.md).[`_hasBegun`](Animation.md#_hasbegun)

***

### \_isFinished

> `protected` **\_isFinished**: `boolean` = `false`

Defined in: [animation/Animation.ts:34](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L34)

Whether the animation has finished

#### Inherited from

[`Animation`](Animation.md).[`_isFinished`](Animation.md#_isfinished)

***

### \_startTime

> `protected` **\_startTime**: `number` = `null`

Defined in: [animation/Animation.ts:31](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L31)

Time when the animation started (set by Timeline)

#### Inherited from

[`Animation`](Animation.md).[`_startTime`](Animation.md#_starttime)

***

### duration

> `readonly` **duration**: `number`

Defined in: [animation/Animation.ts:25](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L25)

Duration of the animation in seconds

#### Inherited from

[`Animation`](Animation.md).[`duration`](Animation.md#duration)

***

### mobject

> `readonly` **mobject**: [`Mobject`](Mobject.md)

Defined in: [animation/Animation.ts:22](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L22)

The mobject being animated

#### Inherited from

[`Animation`](Animation.md).[`mobject`](Animation.md#mobject)

***

### rateFunc

> `readonly` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:28](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L28)

Rate function controlling the animation's pacing

#### Inherited from

[`Animation`](Animation.md).[`rateFunc`](Animation.md#ratefunc)

***

### remover

> **remover**: `boolean` = `false`

Defined in: [animation/Animation.ts:43](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L43)

If true, the scene will remove this mobject after the animation finishes.
Used by FadeOut (like Python manim's remover=True).

#### Inherited from

[`Animation`](Animation.md).[`remover`](Animation.md#remover)

***

### scaleFactor

> `readonly` **scaleFactor**: `number`

Defined in: [animation/transform/TransformExtensions.ts:949](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/transform/TransformExtensions.ts#L949)

Scale factor

## Accessors

### startTime

#### Get Signature

> **get** **startTime**(): `number`

Defined in: [animation/Animation.ts:125](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L125)

Get the start time of this animation (set by Timeline)

##### Returns

`number`

#### Set Signature

> **set** **startTime**(`time`): `void`

Defined in: [animation/Animation.ts:132](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L132)

Set the start time of this animation (used by Timeline)

##### Parameters

###### time

`number`

##### Returns

`void`

#### Inherited from

[`Animation`](Animation.md).[`startTime`](Animation.md#starttime)

## Methods

### begin()

> **begin**(): `void`

Defined in: [animation/transform/TransformExtensions.ts:965](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/transform/TransformExtensions.ts#L965)

Called when the animation starts.
Subclasses can override to set up initial state.

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`begin`](Animation.md#begin)

***

### finish()

> **finish**(): `void`

Defined in: [animation/transform/TransformExtensions.ts:993](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/transform/TransformExtensions.ts#L993)

Called when the animation ends.
Subclasses can override to clean up or finalize state.

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`finish`](Animation.md#finish)

***

### interpolate()

> **interpolate**(`alpha`): `void`

Defined in: [animation/transform/TransformExtensions.ts:977](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/transform/TransformExtensions.ts#L977)

Apply the animation at a given progress value.

#### Parameters

##### alpha

`number`

Progress from 0 (start) to 1 (end)

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`interpolate`](Animation.md#interpolate)

***

### isFinished()

> **isFinished**(): `boolean`

Defined in: [animation/Animation.ts:109](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L109)

Check if the animation has finished

#### Returns

`boolean`

#### Inherited from

[`Animation`](Animation.md).[`isFinished`](Animation.md#isfinished)

***

### reset()

> **reset**(): `void`

Defined in: [animation/Animation.ts:116](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L116)

Reset the animation to its initial state

#### Returns

`void`

#### Inherited from

[`Animation`](Animation.md).[`reset`](Animation.md#reset)

***

### update()

> **update**(`_dt`, `currentTime`): `void`

Defined in: [animation/Animation.ts:79](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L79)

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

[`Animation`](Animation.md).[`update`](Animation.md#update)
