# Class: CameraFrame

Defined in: [core/CameraFrame.ts:44](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L44)

CameraFrame wraps a Camera3D and exposes ManimGL-compatible Euler angle
methods for both immediate use and animation (via the `.animate` proxy).

## Constructors

### Constructor

> **new CameraFrame**(`aspectRatio`, `options`): `CameraFrame`

Defined in: [core/CameraFrame.ts:60](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L60)

#### Parameters

##### aspectRatio

`number` = `...`

##### options

[`CameraFrameOptions`](../interfaces/CameraFrameOptions.md) = `{}`

#### Returns

`CameraFrame`

## Properties

### mobjectStub

> `readonly` **mobjectStub**: [`Mobject`](Mobject.md)

Defined in: [core/CameraFrame.ts:58](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L58)

A lightweight Mobject stub used as the Animation target.
This lets CameraAnimation integrate with the existing Timeline / Scene.play()
system which requires every Animation to have a `.mobject`.

## Accessors

### animate

#### Get Signature

> **get** **animate**(): [`CameraAnimateProxy`](CameraAnimateProxy.md)

Defined in: [core/CameraFrame.ts:301](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L301)

Returns a proxy that records camera state changes and produces a
CameraAnimation when called with `scene.play()`.

Usage (property, default 1s smooth):
  scene.play(frame.animate.incrementPhi(PI/4))
  scene.play(frame.animate.setEulerAngles({ theta: PI/4, phi: PI/3 }))

Usage (method with options):
  scene.play(frame.animateTo({ duration: 2 }).incrementPhi(PI/4))

##### Returns

[`CameraAnimateProxy`](CameraAnimateProxy.md)

## Methods

### \_applyState()

> **\_applyState**(`state`): `void`

Defined in: [core/CameraFrame.ts:275](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L275)

Apply a full camera state.

#### Parameters

##### state

[`CameraFrameState`](../interfaces/CameraFrameState.md)

#### Returns

`void`

***

### \_snapshot()

> **\_snapshot**(): [`CameraFrameState`](../interfaces/CameraFrameState.md)

Defined in: [core/CameraFrame.ts:263](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L263)

Capture the current camera state.

#### Returns

[`CameraFrameState`](../interfaces/CameraFrameState.md)

***

### animateTo()

> **animateTo**(`options`): [`CameraAnimateProxy`](CameraAnimateProxy.md)

Defined in: [core/CameraFrame.ts:308](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L308)

Like `animate`, but accepts AnimationOptions (duration, rateFunc).

#### Parameters

##### options

`CameraAnimationOptions` = `{}`

#### Returns

[`CameraAnimateProxy`](CameraAnimateProxy.md)

***

### getCamera3D()

> **getCamera3D**(): [`Camera3D`](Camera3D.md)

Defined in: [core/CameraFrame.ts:89](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L89)

Get the underlying Camera3D instance.

#### Returns

[`Camera3D`](Camera3D.md)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/CameraFrame.ts:205](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L205)

Get the look-at center.

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

***

### getDistance()

> **getDistance**(): `number`

Defined in: [core/CameraFrame.ts:181](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L181)

Get the distance from the look-at target.

#### Returns

`number`

***

### getEulerAngles()

> **getEulerAngles**(): \[`number`, `number`, `number`\]

Defined in: [core/CameraFrame.ts:103](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L103)

Get the current Euler angles [theta, phi, gamma].

#### Returns

\[`number`, `number`, `number`\]

***

### getFieldOfView()

> **getFieldOfView**(): `number`

Defined in: [core/CameraFrame.ts:193](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L193)

Get the current field of view in degrees.

#### Returns

`number`

***

### getGamma()

> **getGamma**(): `number`

Defined in: [core/CameraFrame.ts:158](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L158)

Get the current gamma (roll) angle.

#### Returns

`number`

***

### getPhi()

> **getPhi**(): `number`

Defined in: [core/CameraFrame.ts:139](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L139)

Get the current phi (polar) angle.

#### Returns

`number`

***

### getTheta()

> **getTheta**(): `number`

Defined in: [core/CameraFrame.ts:120](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L120)

Get the current theta (azimuthal) angle.

#### Returns

`number`

***

### getThreeCamera()

> **getThreeCamera**(): `PerspectiveCamera`

Defined in: [core/CameraFrame.ts:94](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L94)

Get the underlying Three.js PerspectiveCamera.

#### Returns

`PerspectiveCamera`

***

### incrementGamma()

> **incrementGamma**(`delta`): `this`

Defined in: [core/CameraFrame.ts:170](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L170)

Increment the gamma (roll) angle by delta.

#### Parameters

##### delta

`number`

#### Returns

`this`

***

### incrementPhi()

> **incrementPhi**(`delta`): `this`

Defined in: [core/CameraFrame.ts:151](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L151)

Increment the phi (polar) angle by delta.

#### Parameters

##### delta

`number`

#### Returns

`this`

***

### incrementTheta()

> **incrementTheta**(`delta`): `this`

Defined in: [core/CameraFrame.ts:132](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L132)

Increment the theta (azimuthal) angle by delta.

#### Parameters

##### delta

`number`

#### Returns

`this`

***

### moveTo()

> **moveTo**(`point`): `this`

Defined in: [core/CameraFrame.ts:210](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L210)

Move the look-at center to a point. Camera position updates accordingly.

#### Parameters

##### point

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

***

### setAspectRatio()

> **setAspectRatio**(`ratio`): `this`

Defined in: [core/CameraFrame.ts:217](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L217)

Set the aspect ratio of the underlying camera.

#### Parameters

##### ratio

`number`

#### Returns

`this`

***

### setDistance()

> **setDistance**(`value`): `this`

Defined in: [core/CameraFrame.ts:186](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L186)

Set the distance from the look-at target.

#### Parameters

##### value

`number`

#### Returns

`this`

***

### setEulerAngles()

> **setEulerAngles**(`opts`): `this`

Defined in: [core/CameraFrame.ts:111](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L111)

Set Euler angles (absolute). Any parameter left undefined is unchanged.

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

this for chaining

***

### setFieldOfView()

> **setFieldOfView**(`fov`): `this`

Defined in: [core/CameraFrame.ts:198](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L198)

Set the field of view in degrees.

#### Parameters

##### fov

`number`

#### Returns

`this`

***

### setGamma()

> **setGamma**(`value`): `this`

Defined in: [core/CameraFrame.ts:163](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L163)

Set the gamma (roll) angle absolutely.

#### Parameters

##### value

`number`

#### Returns

`this`

***

### setPhi()

> **setPhi**(`value`): `this`

Defined in: [core/CameraFrame.ts:144](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L144)

Set the phi (polar) angle absolutely.

#### Parameters

##### value

`number`

#### Returns

`this`

***

### setTheta()

> **setTheta**(`value`): `this`

Defined in: [core/CameraFrame.ts:125](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/CameraFrame.ts#L125)

Set the theta (azimuthal) angle absolutely.

#### Parameters

##### value

`number`

#### Returns

`this`
