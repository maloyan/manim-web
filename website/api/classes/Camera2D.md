# Class: Camera2D

Defined in: [core/Camera.ts:179](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L179)

2D camera for manimweb scenes.
Wraps Three.js OrthographicCamera with Manim-style frame dimensions.

## Constructors

### Constructor

> **new Camera2D**(`options`): `Camera2D`

Defined in: [core/Camera.ts:189](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L189)

Create a new 2D camera.

#### Parameters

##### options

[`CameraOptions`](../interfaces/CameraOptions.md) = `{}`

Camera configuration options

#### Returns

`Camera2D`

## Accessors

### frame

#### Get Signature

> **get** **frame**(): [`Camera2DFrame`](Camera2DFrame.md)

Defined in: [core/Camera.ts:286](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L286)

Lazy-created Camera2DFrame for Manim-style camera.frame API.
The frame is a VMobject whose position and scale drive the camera,
enabling animations like Restore, MoveToTarget, and updaters.

##### Returns

[`Camera2DFrame`](Camera2DFrame.md)

***

### frameHeight

#### Get Signature

> **get** **frameHeight**(): `number`

Defined in: [core/Camera.ts:234](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L234)

Get the frame height in world units.

##### Returns

`number`

#### Set Signature

> **set** **frameHeight**(`height`): `void`

Defined in: [core/Camera.ts:241](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L241)

Set the frame height in world units.

##### Parameters

###### height

`number`

##### Returns

`void`

***

### frameWidth

#### Get Signature

> **get** **frameWidth**(): `number`

Defined in: [core/Camera.ts:219](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L219)

Get the frame width in world units.

##### Returns

`number`

#### Set Signature

> **set** **frameWidth**(`width`): `void`

Defined in: [core/Camera.ts:226](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L226)

Set the frame width in world units.

##### Parameters

###### width

`number`

##### Returns

`void`

***

### position

#### Get Signature

> **get** **position**(): `Vector3`

Defined in: [core/Camera.ts:249](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L249)

Get the camera position.

##### Returns

`Vector3`

## Methods

### getCamera()

> **getCamera**(): `OrthographicCamera`

Defined in: [core/Camera.ts:266](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L266)

Get the underlying Three.js OrthographicCamera.

#### Returns

`OrthographicCamera`

The OrthographicCamera instance

***

### moveTo()

> **moveTo**(`point`): `void`

Defined in: [core/Camera.ts:257](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L257)

Move the camera to a specific point.

#### Parameters

##### point

\[`number`, `number`, `number`\]

Target position [x, y, z]

#### Returns

`void`

***

### setAspectRatio()

> **setAspectRatio**(`aspectRatio`): `void`

Defined in: [core/Camera.ts:275](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L275)

Update the frame dimensions to match an aspect ratio.
Useful for responsive layouts.

#### Parameters

##### aspectRatio

`number`

Width / height ratio

#### Returns

`void`

***

### updateFrame()

> **updateFrame**(`dt`): `void`

Defined in: [core/Camera.ts:298](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Camera.ts#L298)

Run updaters on the camera frame (if it exists).
Called by Scene after the timeline update so camera updaters
see the latest positions set by animations.

#### Parameters

##### dt

`number`

#### Returns

`void`
