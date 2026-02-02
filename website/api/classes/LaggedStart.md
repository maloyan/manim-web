# Class: LaggedStart

Defined in: [animation/LaggedStart.ts:37](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/LaggedStart.ts#L37)

LaggedStart class for cases where class instantiation is preferred.

## Extends

- [`AnimationGroup`](AnimationGroup.md)

## Constructors

### Constructor

> **new LaggedStart**(`animations`, `options`): `LaggedStart`

Defined in: [animation/LaggedStart.ts:38](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/LaggedStart.ts#L38)

#### Parameters

##### animations

[`Animation`](Animation.md)[]

##### options

[`LaggedStartOptions`](../interfaces/LaggedStartOptions.md) = `{}`

#### Returns

`LaggedStart`

#### Overrides

[`AnimationGroup`](AnimationGroup.md).[`constructor`](AnimationGroup.md#constructor)

## Properties

### \_hasBegun

> `protected` **\_hasBegun**: `boolean` = `false`

Defined in: [animation/Animation.ts:37](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L37)

Track if begin() has been called

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`_hasBegun`](AnimationGroup.md#_hasbegun)

***

### \_isFinished

> `protected` **\_isFinished**: `boolean` = `false`

Defined in: [animation/Animation.ts:34](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L34)

Whether the animation has finished

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`_isFinished`](AnimationGroup.md#_isfinished)

***

### \_startTime

> `protected` **\_startTime**: `number` = `null`

Defined in: [animation/Animation.ts:31](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L31)

Time when the animation started (set by Timeline)

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`_startTime`](AnimationGroup.md#_starttime)

***

### animations

> `readonly` **animations**: [`Animation`](Animation.md)[]

Defined in: [animation/AnimationGroup.ts:65](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/AnimationGroup.ts#L65)

Child animations

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`animations`](AnimationGroup.md#animations)

***

### duration

> `readonly` **duration**: `number`

Defined in: [animation/Animation.ts:25](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L25)

Duration of the animation in seconds

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`duration`](AnimationGroup.md#duration)

***

### lagRatio

> `readonly` **lagRatio**: `number`

Defined in: [animation/AnimationGroup.ts:68](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/AnimationGroup.ts#L68)

Lag ratio

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`lagRatio`](AnimationGroup.md#lagratio)

***

### mobject

> `readonly` **mobject**: [`Mobject`](Mobject.md)

Defined in: [animation/Animation.ts:22](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L22)

The mobject being animated

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`mobject`](AnimationGroup.md#mobject)

***

### rateFunc

> `readonly` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L28)

Rate function controlling the animation's pacing

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`rateFunc`](AnimationGroup.md#ratefunc)

***

### remover

> **remover**: `boolean` = `false`

Defined in: [animation/Animation.ts:43](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L43)

If true, the scene will remove this mobject after the animation finishes.
Used by FadeOut (like Python manim's remover=True).

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`remover`](AnimationGroup.md#remover)

## Accessors

### startTime

#### Get Signature

> **get** **startTime**(): `number`

Defined in: [animation/Animation.ts:125](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L125)

Get the start time of this animation (set by Timeline)

##### Returns

`number`

#### Set Signature

> **set** **startTime**(`time`): `void`

Defined in: [animation/Animation.ts:132](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L132)

Set the start time of this animation (used by Timeline)

##### Parameters

###### time

`number`

##### Returns

`void`

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`startTime`](AnimationGroup.md#starttime)

## Methods

### begin()

> **begin**(): `void`

Defined in: [animation/AnimationGroup.ts:96](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/AnimationGroup.ts#L96)

Set up the animation - compute start/end times and call begin on all children

#### Returns

`void`

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`begin`](AnimationGroup.md#begin)

***

### finish()

> **finish**(): `void`

Defined in: [animation/AnimationGroup.ts:164](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/AnimationGroup.ts#L164)

Finish all child animations

#### Returns

`void`

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`finish`](AnimationGroup.md#finish)

***

### interpolate()

> **interpolate**(`alpha`): `void`

Defined in: [animation/AnimationGroup.ts:130](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/AnimationGroup.ts#L130)

Interpolate all child animations based on group alpha

#### Parameters

##### alpha

`number`

#### Returns

`void`

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`interpolate`](AnimationGroup.md#interpolate)

***

### isFinished()

> **isFinished**(): `boolean`

Defined in: [animation/AnimationGroup.ts:174](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/AnimationGroup.ts#L174)

Check if all child animations have finished

#### Returns

`boolean`

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`isFinished`](AnimationGroup.md#isfinished)

***

### reset()

> **reset**(): `void`

Defined in: [animation/AnimationGroup.ts:181](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/AnimationGroup.ts#L181)

Reset the animation group

#### Returns

`void`

#### Inherited from

[`AnimationGroup`](AnimationGroup.md).[`reset`](AnimationGroup.md#reset)

***

### update()

> **update**(`_dt`, `currentTime`): `void`

Defined in: [animation/Animation.ts:79](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L79)

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

[`AnimationGroup`](AnimationGroup.md).[`update`](AnimationGroup.md#update)
