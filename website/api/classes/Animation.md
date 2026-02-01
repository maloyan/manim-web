# Abstract Class: Animation

Defined in: [animation/Animation.ts:20](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L20)

## Extended by

- [`CameraAnimateProxy`](CameraAnimateProxy.md)
- [`FadeIn`](FadeIn.md)
- [`FadeOut`](FadeOut.md)
- [`Create`](Create.md)
- [`DrawBorderThenFill`](DrawBorderThenFill.md)
- [`Uncreate`](Uncreate.md)
- [`Write`](Write.md)
- [`AddTextLetterByLetter`](AddTextLetterByLetter.md)
- [`RemoveTextLetterByLetter`](RemoveTextLetterByLetter.md)
- [`Transform`](Transform.md)
- [`ApplyPointwiseFunction`](ApplyPointwiseFunction.md)
- [`FadeToColor`](FadeToColor.md)
- [`Rotate`](Rotate.md)
- [`Scale`](Scale.md)
- [`GrowFromCenter`](GrowFromCenter.md)
- [`Shift`](Shift.md)
- [`MoveToTargetPosition`](MoveToTargetPosition.md)
- [`MoveAlongPath`](MoveAlongPath.md)
- [`Homotopy`](Homotopy.md)
- [`ComplexHomotopy`](ComplexHomotopy.md)
- [`SmoothedVectorizedHomotopy`](SmoothedVectorizedHomotopy.md)
- [`PhaseFlow`](PhaseFlow.md)
- [`AnimationGroup`](AnimationGroup.md)
- [`UpdateFromFunc`](UpdateFromFunc.md)
- [`UpdateFromAlphaFunc`](UpdateFromAlphaFunc.md)
- [`Rotating`](Rotating.md)
- [`Broadcast`](Broadcast.md)
- [`Indicate`](Indicate.md)
- [`Flash`](Flash.md)
- [`Circumscribe`](Circumscribe.md)
- [`Wiggle`](Wiggle.md)
- [`ShowPassingFlash`](ShowPassingFlash.md)
- [`ApplyWave`](ApplyWave.md)
- [`FocusOn`](FocusOn.md)
- [`Pulse`](Pulse.md)
- [`ShowCreationThenDestruction`](ShowCreationThenDestruction.md)
- [`WiggleOutThenIn`](WiggleOutThenIn.md)

## Constructors

### Constructor

> **new Animation**(`mobject`, `options`): `Animation`

Defined in: [animation/Animation.ts:45](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L45)

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

##### options

[`AnimationOptions`](../interfaces/AnimationOptions.md) = `{}`

#### Returns

`Animation`

## Properties

### \_hasBegun

> `protected` **\_hasBegun**: `boolean` = `false`

Defined in: [animation/Animation.ts:37](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L37)

Track if begin() has been called

***

### \_isFinished

> `protected` **\_isFinished**: `boolean` = `false`

Defined in: [animation/Animation.ts:34](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L34)

Whether the animation has finished

***

### \_startTime

> `protected` **\_startTime**: `number` = `null`

Defined in: [animation/Animation.ts:31](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L31)

Time when the animation started (set by Timeline)

***

### duration

> `readonly` **duration**: `number`

Defined in: [animation/Animation.ts:25](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L25)

Duration of the animation in seconds

***

### mobject

> `readonly` **mobject**: [`Mobject`](Mobject.md)

Defined in: [animation/Animation.ts:22](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L22)

The mobject being animated

***

### rateFunc

> `readonly` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:28](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L28)

Rate function controlling the animation's pacing

***

### remover

> **remover**: `boolean` = `false`

Defined in: [animation/Animation.ts:43](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L43)

If true, the scene will remove this mobject after the animation finishes.
Used by FadeOut (like Python manim's remover=True).

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

## Methods

### begin()

> **begin**(): `void`

Defined in: [animation/Animation.ts:55](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L55)

Called when the animation starts.
Subclasses can override to set up initial state.

#### Returns

`void`

***

### finish()

> **finish**(): `void`

Defined in: [animation/Animation.ts:64](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L64)

Called when the animation ends.
Subclasses can override to clean up or finalize state.

#### Returns

`void`

***

### interpolate()

> `abstract` **interpolate**(`alpha`): `void`

Defined in: [animation/Animation.ts:72](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L72)

Apply the animation at a given progress value.

#### Parameters

##### alpha

`number`

Progress from 0 (start) to 1 (end)

#### Returns

`void`

***

### isFinished()

> **isFinished**(): `boolean`

Defined in: [animation/Animation.ts:109](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L109)

Check if the animation has finished

#### Returns

`boolean`

***

### reset()

> **reset**(): `void`

Defined in: [animation/Animation.ts:116](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L116)

Reset the animation to its initial state

#### Returns

`void`

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
