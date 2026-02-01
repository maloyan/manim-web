# Class: Camera2D

Defined in: [core/Camera.ts:178](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L178)

2D camera for manimweb scenes.
Wraps Three.js OrthographicCamera with Manim-style frame dimensions.

## Constructors

### Constructor

> **new Camera2D**(`options`): `Camera2D`

Defined in: [core/Camera.ts:187](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L187)

Create a new 2D camera.

#### Parameters

##### options

[`CameraOptions`](../interfaces/CameraOptions.md) = `{}`

Camera configuration options

#### Returns

`Camera2D`

## Accessors

### frameHeight

#### Get Signature

> **get** **frameHeight**(): `number`

Defined in: [core/Camera.ts:232](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L232)

Get the frame height in world units.

##### Returns

`number`

#### Set Signature

> **set** **frameHeight**(`height`): `void`

Defined in: [core/Camera.ts:239](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L239)

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

Defined in: [core/Camera.ts:217](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L217)

Get the frame width in world units.

##### Returns

`number`

#### Set Signature

> **set** **frameWidth**(`width`): `void`

Defined in: [core/Camera.ts:224](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L224)

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

Defined in: [core/Camera.ts:247](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L247)

Get the camera position.

##### Returns

`Vector3`

## Methods

### getCamera()

> **getCamera**(): `OrthographicCamera`

Defined in: [core/Camera.ts:264](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L264)

Get the underlying Three.js OrthographicCamera.

#### Returns

`OrthographicCamera`

The OrthographicCamera instance

***

### moveTo()

> **moveTo**(`point`): `void`

Defined in: [core/Camera.ts:255](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L255)

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

Defined in: [core/Camera.ts:273](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L273)

Update the frame dimensions to match an aspect ratio.
Useful for responsive layouts.

#### Parameters

##### aspectRatio

`number`

Width / height ratio

#### Returns

`void`
