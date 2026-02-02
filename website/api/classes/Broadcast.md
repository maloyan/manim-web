# Class: Broadcast

Defined in: [animation/utility/index.ts:305](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L305)

Broadcast/ripple animation that creates expanding rings from the mobject center.
Useful for emphasis or drawing attention to an object.
Rings expand outward and fade as they grow.

## Extends

- [`Animation`](Animation.md)

## Constructors

### Constructor

> **new Broadcast**(`mobject`, `options`): `Broadcast`

Defined in: [animation/utility/index.ts:330](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L330)

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

##### options

[`BroadcastOptions`](../interfaces/BroadcastOptions.md) = `{}`

#### Returns

`Broadcast`

#### Overrides

[`Animation`](Animation.md).[`constructor`](Animation.md#constructor)

## Properties

### \_hasBegun

> `protected` **\_hasBegun**: `boolean` = `false`

Defined in: [animation/Animation.ts:37](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L37)

Track if begin() has been called

#### Inherited from

[`Animation`](Animation.md).[`_hasBegun`](Animation.md#_hasbegun)

***

### \_isFinished

> `protected` **\_isFinished**: `boolean` = `false`

Defined in: [animation/Animation.ts:34](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L34)

Whether the animation has finished

#### Inherited from

[`Animation`](Animation.md).[`_isFinished`](Animation.md#_isfinished)

***

### \_startTime

> `protected` **\_startTime**: `number` = `null`

Defined in: [animation/Animation.ts:31](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L31)

Time when the animation started (set by Timeline)

#### Inherited from

[`Animation`](Animation.md).[`_startTime`](Animation.md#_starttime)

***

### duration

> `readonly` **duration**: `number`

Defined in: [animation/Animation.ts:25](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L25)

Duration of the animation in seconds

#### Inherited from

[`Animation`](Animation.md).[`duration`](Animation.md#duration)

***

### lagRatio

> `readonly` **lagRatio**: `number`

Defined in: [animation/utility/index.ts:319](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L319)

Lag ratio between rings

***

### maxRadius

> `readonly` **maxRadius**: `number`

Defined in: [animation/utility/index.ts:313](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L313)

Maximum radius

***

### mobject

> `readonly` **mobject**: [`Mobject`](Mobject.md)

Defined in: [animation/Animation.ts:22](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L22)

The mobject being animated

#### Inherited from

[`Animation`](Animation.md).[`mobject`](Animation.md#mobject)

***

### numRings

> `readonly` **numRings**: `number`

Defined in: [animation/utility/index.ts:310](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L310)

Number of rings

***

### rateFunc

> `readonly` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L28)

Rate function controlling the animation's pacing

#### Inherited from

[`Animation`](Animation.md).[`rateFunc`](Animation.md#ratefunc)

***

### remover

> **remover**: `boolean` = `false`

Defined in: [animation/Animation.ts:43](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L43)

If true, the scene will remove this mobject after the animation finishes.
Used by FadeOut (like Python manim's remover=True).

#### Inherited from

[`Animation`](Animation.md).[`remover`](Animation.md#remover)

***

### ringColor

> `readonly` **ringColor**: `string`

Defined in: [animation/utility/index.ts:307](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L307)

Ring color

***

### strokeWidth

> `readonly` **strokeWidth**: `number`

Defined in: [animation/utility/index.ts:316](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L316)

Stroke width

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

[`Animation`](Animation.md).[`startTime`](Animation.md#starttime)

## Methods

### begin()

> **begin**(): `void`

Defined in: [animation/utility/index.ts:342](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L342)

Called when the animation starts.
Subclasses can override to set up initial state.

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`begin`](Animation.md#begin)

***

### finish()

> **finish**(): `void`

Defined in: [animation/utility/index.ts:448](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L448)

Called when the animation ends.
Subclasses can override to clean up or finalize state.

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`finish`](Animation.md#finish)

***

### interpolate()

> **interpolate**(`alpha`): `void`

Defined in: [animation/utility/index.ts:423](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/utility/index.ts#L423)

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

Defined in: [animation/Animation.ts:109](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L109)

Check if the animation has finished

#### Returns

`boolean`

#### Inherited from

[`Animation`](Animation.md).[`isFinished`](Animation.md#isfinished)

***

### reset()

> **reset**(): `void`

Defined in: [animation/Animation.ts:116](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L116)

Reset the animation to its initial state

#### Returns

`void`

#### Inherited from

[`Animation`](Animation.md).[`reset`](Animation.md#reset)

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

[`Animation`](Animation.md).[`update`](Animation.md#update)
