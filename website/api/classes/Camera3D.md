# Class: Camera3D

Defined in: [core/Camera.ts:23](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L23)

3D camera for manimweb scenes.
Wraps Three.js PerspectiveCamera with orbit controls support.

## Constructors

### Constructor

> **new Camera3D**(`aspectRatio`, `options?`): `Camera3D`

Defined in: [core/Camera.ts:34](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L34)

Create a new 3D camera.

#### Parameters

##### aspectRatio

`number` = `...`

Width / height ratio. Defaults to 16/9.

##### options?

[`Camera3DOptions`](../interfaces/Camera3DOptions.md)

Camera configuration options

#### Returns

`Camera3D`

## Accessors

### fov

#### Get Signature

> **get** **fov**(): `number`

Defined in: [core/Camera.ts:75](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L75)

Get the field of view.

##### Returns

`number`

***

### lookAtTarget

#### Get Signature

> **get** **lookAtTarget**(): `Vector3`

Defined in: [core/Camera.ts:68](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L68)

Get the look-at target.

##### Returns

`Vector3`

***

### position

#### Get Signature

> **get** **position**(): `Vector3`

Defined in: [core/Camera.ts:61](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L61)

Get the camera position.

##### Returns

`Vector3`

## Methods

### getCamera()

> **getCamera**(): `PerspectiveCamera`

Defined in: [core/Camera.ts:54](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L54)

Get the underlying Three.js PerspectiveCamera.

#### Returns

`PerspectiveCamera`

The PerspectiveCamera instance

***

### getOrbitAngles()

> **getOrbitAngles**(): `object`

Defined in: [core/Camera.ts:148](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L148)

Get spherical coordinates relative to the look-at point.

#### Returns

`object`

Object with phi (polar), theta (azimuthal), and distance

##### distance

> **distance**: `number`

##### phi

> **phi**: `number`

##### theta

> **theta**: `number`

***

### moveTo()

> **moveTo**(`position`): `this`

Defined in: [core/Camera.ts:84](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L84)

Move the camera to a specific position.

#### Parameters

##### position

\[`number`, `number`, `number`\]

Target position [x, y, z]

#### Returns

`this`

this for chaining

***

### orbit()

> **orbit**(`phi`, `theta`, `distance?`): `this`

Defined in: [core/Camera.ts:132](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L132)

Orbit the camera around the look-at point using spherical coordinates.

#### Parameters

##### phi

`number`

Polar angle from Y axis (0 = top, PI = bottom)

##### theta

`number`

Azimuthal angle in XZ plane

##### distance?

`number`

Optional distance from look-at point

#### Returns

`this`

this for chaining

***

### setAspectRatio()

> **setAspectRatio**(`ratio`): `this`

Defined in: [core/Camera.ts:119](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L119)

Update the aspect ratio.

#### Parameters

##### ratio

`number`

Width / height ratio

#### Returns

`this`

this for chaining

***

### setFov()

> **setFov**(`fov`): `this`

Defined in: [core/Camera.ts:107](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L107)

Set the field of view.

#### Parameters

##### fov

`number`

Field of view in degrees

#### Returns

`this`

this for chaining

***

### setLookAt()

> **setLookAt**(`target`): `this`

Defined in: [core/Camera.ts:96](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L96)

Set the look-at target.

#### Parameters

##### target

\[`number`, `number`, `number`\]

Target point [x, y, z]

#### Returns

`this`

this for chaining
