# Class: OrbitControls

Defined in: [interaction/OrbitControls.ts:40](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L40)

Wrapper for Three.js OrbitControls providing camera orbit interaction.
Allows users to rotate, zoom, and pan the camera around a target point.

## Constructors

### Constructor

> **new OrbitControls**(`camera`, `canvas`, `options?`): `OrbitControls`

Defined in: [interaction/OrbitControls.ts:50](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L50)

Create new OrbitControls.

#### Parameters

##### camera

`Camera`

The Three.js camera to control

##### canvas

`HTMLCanvasElement`

The HTML canvas element for mouse events

##### options?

[`OrbitControlsOptions`](../interfaces/OrbitControlsOptions.md)

Controls configuration options

#### Returns

`OrbitControls`

## Methods

### addEventListener()

> **addEventListener**(`event`, `callback`): `void`

Defined in: [interaction/OrbitControls.ts:217](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L217)

Add an event listener for control changes.

#### Parameters

##### event

Event type ('change', 'start', 'end')

`"start"` | `"end"` | `"change"`

##### callback

() => `void`

Callback function

#### Returns

`void`

***

### disable()

> **disable**(): `void`

Defined in: [interaction/OrbitControls.ts:106](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L106)

Disable the controls.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [interaction/OrbitControls.ts:239](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L239)

Dispose of the controls and clean up event listeners.

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [interaction/OrbitControls.ts:98](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L98)

Enable the controls.

#### Returns

`void`

***

### getControls()

> **getControls**(): `OrbitControls`

Defined in: [interaction/OrbitControls.ts:208](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L208)

Get the underlying Three.js OrbitControls.

#### Returns

`OrbitControls`

The ThreeOrbitControls instance

***

### getTarget()

> **getTarget**(): `Vector3`

Defined in: [interaction/OrbitControls.ts:131](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L131)

Get the current target point.

#### Returns

`Vector3`

The target position as a Vector3

***

### isEnabled()

> **isEnabled**(): `boolean`

Defined in: [interaction/OrbitControls.ts:115](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L115)

Check if controls are enabled.

#### Returns

`boolean`

true if controls are enabled

***

### removeEventListener()

> **removeEventListener**(`event`, `callback`): `void`

Defined in: [interaction/OrbitControls.ts:229](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L229)

Remove an event listener.

#### Parameters

##### event

Event type ('change', 'start', 'end')

`"start"` | `"end"` | `"change"`

##### callback

() => `void`

Callback function to remove

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [interaction/OrbitControls.ts:200](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L200)

Reset the camera to its default position and target.

#### Returns

`void`

***

### setAutoRotate()

> **setAutoRotate**(`enabled`): `void`

Defined in: [interaction/OrbitControls.ts:155](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L155)

Enable or disable auto-rotation.

#### Parameters

##### enabled

`boolean`

Whether auto-rotation should be enabled

#### Returns

`void`

***

### setAutoRotateSpeed()

> **setAutoRotateSpeed**(`speed`): `void`

Defined in: [interaction/OrbitControls.ts:163](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L163)

Set the auto-rotation speed.

#### Parameters

##### speed

`number`

Rotation speed in degrees per second

#### Returns

`void`

***

### setAzimuthLimits()

> **setAzimuthLimits**(`min`, `max`): `void`

Defined in: [interaction/OrbitControls.ts:192](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L192)

Set azimuth angle limits (horizontal rotation).

#### Parameters

##### min

`number`

Minimum angle in radians

##### max

`number`

Maximum angle in radians

#### Returns

`void`

***

### setDamping()

> **setDamping**(`enabled`): `void`

Defined in: [interaction/OrbitControls.ts:139](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L139)

Enable or disable damping (smooth motion).

#### Parameters

##### enabled

`boolean`

Whether damping should be enabled

#### Returns

`void`

***

### setDampingFactor()

> **setDampingFactor**(`factor`): `void`

Defined in: [interaction/OrbitControls.ts:147](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L147)

Set the damping factor.

#### Parameters

##### factor

`number`

Damping factor (0 = no damping, 1 = full damping)

#### Returns

`void`

***

### setPolarLimits()

> **setPolarLimits**(`min`, `max`): `void`

Defined in: [interaction/OrbitControls.ts:182](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L182)

Set polar angle limits (vertical rotation).

#### Parameters

##### min

`number`

Minimum angle in radians (0 = looking down)

##### max

`number`

Maximum angle in radians (PI = looking up)

#### Returns

`void`

***

### setTarget()

> **setTarget**(`target`): `void`

Defined in: [interaction/OrbitControls.ts:123](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L123)

Set the target point for the camera to orbit around.

#### Parameters

##### target

\[`number`, `number`, `number`\]

Target position [x, y, z]

#### Returns

`void`

***

### setZoomLimits()

> **setZoomLimits**(`min`, `max`): `void`

Defined in: [interaction/OrbitControls.ts:172](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L172)

Set zoom distance limits.

#### Parameters

##### min

`number`

Minimum zoom distance

##### max

`number`

Maximum zoom distance

#### Returns

`void`

***

### update()

> **update**(): `void`

Defined in: [interaction/OrbitControls.ts:89](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/OrbitControls.ts#L89)

Update the controls. Must be called in the animation loop when damping is enabled.

#### Returns

`void`
