# Class: AnimationGroup

Defined in: [animation/AnimationGroup.ts:63](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/AnimationGroup.ts#L63)

## Extends

- [`Animation`](Animation.md)

## Extended by

- [`LaggedStart`](LaggedStart.md)
- [`Succession`](Succession.md)

## Constructors

### Constructor

> **new AnimationGroup**(`animations`, `options`): `AnimationGroup`

Defined in: [animation/AnimationGroup.ts:76](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/AnimationGroup.ts#L76)

#### Parameters

##### animations

[`Animation`](Animation.md)[]

##### options

[`AnimationGroupOptions`](../interfaces/AnimationGroupOptions.md) = `{}`

#### Returns

`AnimationGroup`

#### Overrides

[`Animation`](Animation.md).[`constructor`](Animation.md#constructor)

## Properties

### \_hasBegun

> `protected` **\_hasBegun**: `boolean` = `false`

Defined in: [animation/Animation.ts:37](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L37)

Track if begin() has been called

#### Inherited from

[`Animation`](Animation.md).[`_hasBegun`](Animation.md#_hasbegun)

***

### \_isFinished

> `protected` **\_isFinished**: `boolean` = `false`

Defined in: [animation/Animation.ts:34](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L34)

Whether the animation has finished

#### Inherited from

[`Animation`](Animation.md).[`_isFinished`](Animation.md#_isfinished)

***

### \_startTime

> `protected` **\_startTime**: `number` = `null`

Defined in: [animation/Animation.ts:31](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L31)

Time when the animation started (set by Timeline)

#### Inherited from

[`Animation`](Animation.md).[`_startTime`](Animation.md#_starttime)

***

### animations

> `readonly` **animations**: [`Animation`](Animation.md)[]

Defined in: [animation/AnimationGroup.ts:65](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/AnimationGroup.ts#L65)

Child animations

***

### duration

> `readonly` **duration**: `number`

Defined in: [animation/Animation.ts:25](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L25)

Duration of the animation in seconds

#### Inherited from

[`Animation`](Animation.md).[`duration`](Animation.md#duration)

***

### lagRatio

> `readonly` **lagRatio**: `number`

Defined in: [animation/AnimationGroup.ts:68](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/AnimationGroup.ts#L68)

Lag ratio

***

### mobject

> `readonly` **mobject**: [`Mobject`](Mobject.md)

Defined in: [animation/Animation.ts:22](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L22)

The mobject being animated

#### Inherited from

[`Animation`](Animation.md).[`mobject`](Animation.md#mobject)

***

### rateFunc

> `readonly` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:28](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L28)

Rate function controlling the animation's pacing

#### Inherited from

[`Animation`](Animation.md).[`rateFunc`](Animation.md#ratefunc)

***

### remover

> **remover**: `boolean` = `false`

Defined in: [animation/Animation.ts:43](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L43)

If true, the scene will remove this mobject after the animation finishes.
Used by FadeOut (like Python manim's remover=True).

#### Inherited from

[`Animation`](Animation.md).[`remover`](Animation.md#remover)

## Accessors

### startTime

#### Get Signature

> **get** **startTime**(): `number`

Defined in: [animation/Animation.ts:125](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L125)

Get the start time of this animation (set by Timeline)

##### Returns

`number`

#### Set Signature

> **set** **startTime**(`time`): `void`

Defined in: [animation/Animation.ts:132](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L132)

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

Defined in: [animation/AnimationGroup.ts:96](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/AnimationGroup.ts#L96)

Set up the animation - compute start/end times and call begin on all children

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`begin`](Animation.md#begin)

***

### finish()

> **finish**(): `void`

Defined in: [animation/AnimationGroup.ts:164](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/AnimationGroup.ts#L164)

Finish all child animations

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`finish`](Animation.md#finish)

***

### interpolate()

> **interpolate**(`alpha`): `void`

Defined in: [animation/AnimationGroup.ts:130](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/AnimationGroup.ts#L130)

Interpolate all child animations based on group alpha

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

Defined in: [animation/AnimationGroup.ts:174](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/AnimationGroup.ts#L174)

Check if all child animations have finished

#### Returns

`boolean`

#### Overrides

[`Animation`](Animation.md).[`isFinished`](Animation.md#isfinished)

***

### reset()

> **reset**(): `void`

Defined in: [animation/AnimationGroup.ts:181](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/AnimationGroup.ts#L181)

Reset the animation group

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`reset`](Animation.md#reset)

***

### update()

> **update**(`_dt`, `currentTime`): `void`

Defined in: [animation/Animation.ts:79](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L79)

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
