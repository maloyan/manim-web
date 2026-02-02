# Class: ReplacementTransform

Defined in: [animation/transform/Transform.ts:266](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/transform/Transform.ts#L266)

ReplacementTransform - like Transform, but replaces the mobject with the target
in the scene after the animation completes.

## Extends

- [`Transform`](Transform.md)

## Constructors

### Constructor

> **new ReplacementTransform**(`mobject`, `target`, `options`): `ReplacementTransform`

Defined in: [animation/transform/Transform.ts:267](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/transform/Transform.ts#L267)

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

##### target

[`Mobject`](Mobject.md)

##### options

[`AnimationOptions`](../interfaces/AnimationOptions.md) = `{}`

#### Returns

`ReplacementTransform`

#### Overrides

[`Transform`](Transform.md).[`constructor`](Transform.md#constructor)

## Properties

### \_hasBegun

> `protected` **\_hasBegun**: `boolean` = `false`

Defined in: [animation/Animation.ts:37](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L37)

Track if begin() has been called

#### Inherited from

[`Transform`](Transform.md).[`_hasBegun`](Transform.md#_hasbegun)

***

### \_isFinished

> `protected` **\_isFinished**: `boolean` = `false`

Defined in: [animation/Animation.ts:34](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L34)

Whether the animation has finished

#### Inherited from

[`Transform`](Transform.md).[`_isFinished`](Transform.md#_isfinished)

***

### \_startTime

> `protected` **\_startTime**: `number` = `null`

Defined in: [animation/Animation.ts:31](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L31)

Time when the animation started (set by Timeline)

#### Inherited from

[`Transform`](Transform.md).[`_startTime`](Transform.md#_starttime)

***

### duration

> `readonly` **duration**: `number`

Defined in: [animation/Animation.ts:25](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L25)

Duration of the animation in seconds

#### Inherited from

[`Transform`](Transform.md).[`duration`](Transform.md#duration)

***

### mobject

> `readonly` **mobject**: [`Mobject`](Mobject.md)

Defined in: [animation/Animation.ts:22](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L22)

The mobject being animated

#### Inherited from

[`Transform`](Transform.md).[`mobject`](Transform.md#mobject)

***

### rateFunc

> `readonly` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L28)

Rate function controlling the animation's pacing

#### Inherited from

[`Transform`](Transform.md).[`rateFunc`](Transform.md#ratefunc)

***

### remover

> **remover**: `boolean` = `false`

Defined in: [animation/Animation.ts:43](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L43)

If true, the scene will remove this mobject after the animation finishes.
Used by FadeOut (like Python manim's remover=True).

#### Inherited from

[`Transform`](Transform.md).[`remover`](Transform.md#remover)

***

### target

> `readonly` **target**: [`Mobject`](Mobject.md)

Defined in: [animation/transform/Transform.ts:15](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/transform/Transform.ts#L15)

The target mobject to transform into

#### Inherited from

[`Transform`](Transform.md).[`target`](Transform.md#target)

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

[`Transform`](Transform.md).[`startTime`](Transform.md#starttime)

## Methods

### begin()

> **begin**(): `void`

Defined in: [animation/transform/Transform.ts:68](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/transform/Transform.ts#L68)

Set up the animation - align points between mobject and target,
or set up cross-fade if either is not a VMobject.

#### Returns

`void`

#### Inherited from

[`Transform`](Transform.md).[`begin`](Transform.md#begin)

***

### finish()

> **finish**(): `void`

Defined in: [animation/transform/Transform.ts:279](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/transform/Transform.ts#L279)

After finishing, the calling code should replace mobject with target in the scene.
This animation just handles the visual transition.

#### Returns

`void`

#### Overrides

[`Transform`](Transform.md).[`finish`](Transform.md#finish)

***

### interpolate()

> **interpolate**(`alpha`): `void`

Defined in: [animation/transform/Transform.ts:137](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/transform/Transform.ts#L137)

Interpolate between start and target at the given alpha

#### Parameters

##### alpha

`number`

#### Returns

`void`

#### Inherited from

[`Transform`](Transform.md).[`interpolate`](Transform.md#interpolate)

***

### isFinished()

> **isFinished**(): `boolean`

Defined in: [animation/Animation.ts:109](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L109)

Check if the animation has finished

#### Returns

`boolean`

#### Inherited from

[`Transform`](Transform.md).[`isFinished`](Transform.md#isfinished)

***

### reset()

> **reset**(): `void`

Defined in: [animation/Animation.ts:116](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L116)

Reset the animation to its initial state

#### Returns

`void`

#### Inherited from

[`Transform`](Transform.md).[`reset`](Transform.md#reset)

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

[`Transform`](Transform.md).[`update`](Transform.md#update)
