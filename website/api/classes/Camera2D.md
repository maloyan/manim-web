# Class: Camera2D

Defined in: [core/Camera.ts:186](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L186)

2D camera for manimweb scenes.
Wraps Three.js OrthographicCamera with Manim-style frame dimensions.

## Constructors

### Constructor

> **new Camera2D**(`options`): `Camera2D`

Defined in: [core/Camera.ts:196](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L196)

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

Defined in: [core/Camera.ts:289](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L289)

Lazy-created Camera2DFrame for Manim-style camera.frame API.
The frame is a VMobject whose position and scale drive the camera,
enabling animations like Restore, MoveToTarget, and updaters.

##### Returns

[`Camera2DFrame`](Camera2DFrame.md)

***

### frameHeight

#### Get Signature

> **get** **frameHeight**(): `number`

Defined in: [core/Camera.ts:237](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L237)

Get the frame height in world units.

##### Returns

`number`

#### Set Signature

> **set** **frameHeight**(`height`): `void`

Defined in: [core/Camera.ts:244](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L244)

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

Defined in: [core/Camera.ts:222](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L222)

Get the frame width in world units.

##### Returns

`number`

#### Set Signature

> **set** **frameWidth**(`width`): `void`

Defined in: [core/Camera.ts:229](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L229)

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

Defined in: [core/Camera.ts:252](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L252)

Get the camera position.

##### Returns

`Vector3`

## Methods

### getCamera()

> **getCamera**(): `OrthographicCamera`

Defined in: [core/Camera.ts:269](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L269)

Get the underlying Three.js OrthographicCamera.

#### Returns

`OrthographicCamera`

The OrthographicCamera instance

***

### moveTo()

> **moveTo**(`point`): `void`

Defined in: [core/Camera.ts:260](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L260)

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

Defined in: [core/Camera.ts:278](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L278)

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

Defined in: [core/Camera.ts:301](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Camera.ts#L301)

Run updaters on the camera frame (if it exists).
Called by Scene after the timeline update so camera updaters
see the latest positions set by animations.

#### Parameters

##### dt

`number`

#### Returns

`void`
