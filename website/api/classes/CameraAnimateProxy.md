# Class: CameraAnimateProxy

Defined in: [core/CameraFrame.ts:377](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L377)

Fluent builder returned by `CameraFrame.animate`.

Each method records a target state change and returns `this`,
so you can chain: `frame.animate.incrementPhi(PI/4).setFieldOfView(60)`.

The proxy itself is used as the Animation argument to `scene.play()`.
When play() calls `.begin()`, the proxy finalises the CameraAnimation.

## Extends

- [`Animation`](Animation.md)

## Constructors

### Constructor

> **new CameraAnimateProxy**(`frame`, `options`): `CameraAnimateProxy`

Defined in: [core/CameraFrame.ts:383](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L383)

#### Parameters

##### frame

[`CameraFrame`](CameraFrame.md)

##### options

`CameraAnimationOptions` = `{}`

#### Returns

`CameraAnimateProxy`

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

### duration

> `readonly` **duration**: `number`

Defined in: [animation/Animation.ts:25](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L25)

Duration of the animation in seconds

#### Inherited from

[`Animation`](Animation.md).[`duration`](Animation.md#duration)

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

Defined in: [core/CameraFrame.ts:448](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L448)

Called when the animation starts.
Subclasses can override to set up initial state.

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`begin`](Animation.md#begin)

***

### finish()

> **finish**(): `void`

Defined in: [core/CameraFrame.ts:487](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L487)

Called when the animation ends.
Subclasses can override to clean up or finalize state.

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`finish`](Animation.md#finish)

***

### getFrame()

> **getFrame**(): [`CameraFrame`](CameraFrame.md)

Defined in: [core/CameraFrame.ts:493](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L493)

Get the CameraFrame this proxy animates.

#### Returns

[`CameraFrame`](CameraFrame.md)

***

### incrementGamma()

> **incrementGamma**(`delta`): `this`

Defined in: [core/CameraFrame.ts:411](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L411)

Animate incrementing gamma by delta.

#### Parameters

##### delta

`number`

#### Returns

`this`

***

### incrementPhi()

> **incrementPhi**(`delta`): `this`

Defined in: [core/CameraFrame.ts:405](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L405)

Animate incrementing phi by delta.

#### Parameters

##### delta

`number`

#### Returns

`this`

***

### incrementTheta()

> **incrementTheta**(`delta`): `this`

Defined in: [core/CameraFrame.ts:399](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L399)

Animate incrementing theta by delta.

#### Parameters

##### delta

`number`

#### Returns

`this`

***

### interpolate()

> **interpolate**(`alpha`): `void`

Defined in: [core/CameraFrame.ts:457](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L457)

Interpolate camera state at the given alpha (0..1).

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

Defined in: [animation/Animation.ts:109](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L109)

Check if the animation has finished

#### Returns

`boolean`

#### Inherited from

[`Animation`](Animation.md).[`isFinished`](Animation.md#isfinished)

***

### moveTo()

> **moveTo**(`point`): `this`

Defined in: [core/CameraFrame.ts:429](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L429)

Animate moving the look-at center.

#### Parameters

##### point

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

***

### reset()

> **reset**(): `void`

Defined in: [animation/Animation.ts:116](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Animation.ts#L116)

Reset the animation to its initial state

#### Returns

`void`

#### Inherited from

[`Animation`](Animation.md).[`reset`](Animation.md#reset)

***

### setDistance()

> **setDistance**(`value`): `this`

Defined in: [core/CameraFrame.ts:417](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L417)

Animate setting distance.

#### Parameters

##### value

`number`

#### Returns

`this`

***

### setEulerAngles()

> **setEulerAngles**(`opts`): `this`

Defined in: [core/CameraFrame.ts:391](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L391)

Animate setting Euler angles (absolute targets).

#### Parameters

##### opts

###### gamma?

`number`

###### phi?

`number`

###### theta?

`number`

#### Returns

`this`

***

### setFieldOfView()

> **setFieldOfView**(`fov`): `this`

Defined in: [core/CameraFrame.ts:423](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L423)

Animate setting field of view.

#### Parameters

##### fov

`number`

#### Returns

`this`

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

***

### withDuration()

> **withDuration**(`seconds`): `this`

Defined in: [core/CameraFrame.ts:435](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L435)

Override duration for this animation (builder-style).

#### Parameters

##### seconds

`number`

#### Returns

`this`

***

### withRateFunc()

> **withRateFunc**(`fn`): `this`

Defined in: [core/CameraFrame.ts:441](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L441)

Override rate function (builder-style).

#### Parameters

##### fn

[`RateFunction`](../type-aliases/RateFunction.md)

#### Returns

`this`
