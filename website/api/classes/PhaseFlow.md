# Class: PhaseFlow

Defined in: [animation/movement/Homotopy.ts:393](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L393)

Animation that flows a mobject along a vector field.
The mobject follows the flow lines defined by the vector field function.

Uses the RK4 ODE solver from `utils/ode` for accurate numerical integration.

## Example

```typescript
// Circular flow
const flow = new PhaseFlow(dots, {
  vectorField: ([x, y, z]) => [-y, x, 0],
  virtualTime: 2,
  duration: 3,
});
```

## Extends

- [`Animation`](Animation.md)

## Constructors

### Constructor

> **new PhaseFlow**(`mobject`, `options`): `PhaseFlow`

Defined in: [animation/movement/Homotopy.ts:412](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L412)

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

##### options

[`PhaseFlowOptions`](../interfaces/PhaseFlowOptions.md)

#### Returns

`PhaseFlow`

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

### vectorField

> `readonly` **vectorField**: [`VectorFieldFunction`](../type-aliases/VectorFieldFunction.md)

Defined in: [animation/movement/Homotopy.ts:395](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L395)

The vector field function

***

### virtualTime

> `readonly` **virtualTime**: `number`

Defined in: [animation/movement/Homotopy.ts:398](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L398)

Virtual time to flow through

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

Defined in: [animation/movement/Homotopy.ts:422](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L422)

Store the original points at animation start

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`begin`](Animation.md#begin)

***

### finish()

> **finish**(): `void`

Defined in: [animation/movement/Homotopy.ts:482](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L482)

Ensure the final state is exact

#### Returns

`void`

#### Overrides

[`Animation`](Animation.md).[`finish`](Animation.md#finish)

***

### interpolate()

> **interpolate**(`alpha`): `void`

Defined in: [animation/movement/Homotopy.ts:441](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L441)

Apply the phase flow at the given progress value.
Each point is flowed from its original position for alpha * virtualTime
using RK4 integration from the ODE solver utility.

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
