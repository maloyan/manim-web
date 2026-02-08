# Class: Shift

Defined in: [animation/movement/Shift.ts:14](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Shift.ts#L14)

## Extends

- [`Animation`](Animation.md)

## Constructors

### Constructor

> **new Shift**(`mobject`, `options`): `Shift`

Defined in: [animation/movement/Shift.ts:24](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Shift.ts#L24)

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

##### options

[`ShiftOptions`](../interfaces/ShiftOptions.md)

#### Returns

`Shift`

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

### direction

> `readonly` **direction**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [animation/movement/Shift.ts:16](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Shift.ts#L16)

Direction to shift

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

Defined in: [animation/movement/Shift.ts:32](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Shift.ts#L32)

Set up the animation - store initial position

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`begin`](Animation.md#begin)

***

### finish()

> **finish**(): `void`

Defined in: [animation/movement/Shift.ts:61](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Shift.ts#L61)

Ensure the position is exact at the end

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`finish`](Animation.md#finish)

***

### interpolate()

> **interpolate**(`alpha`): `void`

Defined in: [animation/movement/Shift.ts:49](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Shift.ts#L49)

Interpolate the position at the given alpha

#### Parameters

##### alpha

`number`

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
