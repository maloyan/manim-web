# Class: Lighting

Defined in: [core/Lighting.ts:73](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L73)

Lighting system for 3D manimweb scenes.
Manages multiple lights attached to a Three.js scene.

## Constructors

### Constructor

> **new Lighting**(`threeScene`): `Lighting`

Defined in: [core/Lighting.ts:81](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L81)

Create a new lighting system.

#### Parameters

##### threeScene

`Scene`

The Three.js scene to add lights to

#### Returns

`Lighting`

## Methods

### addAmbient()

> **addAmbient**(`options?`): `AmbientLight`

Defined in: [core/Lighting.ts:91](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L91)

Add an ambient light to the scene.
Ambient lights illuminate all objects equally from all directions.

#### Parameters

##### options?

[`AmbientLightOptions`](../interfaces/AmbientLightOptions.md)

Light configuration options

#### Returns

`AmbientLight`

The created AmbientLight

***

### addDirectional()

> **addDirectional**(`options?`): `DirectionalLight`

Defined in: [core/Lighting.ts:107](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L107)

Add a directional light to the scene.
Directional lights emit parallel rays, like sunlight.

#### Parameters

##### options?

[`DirectionalLightOptions`](../interfaces/DirectionalLightOptions.md)

Light configuration options

#### Returns

`DirectionalLight`

The created DirectionalLight

***

### addPoint()

> **addPoint**(`options?`): `PointLight`

Defined in: [core/Lighting.ts:127](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L127)

Add a point light to the scene.
Point lights emit in all directions from a single point.

#### Parameters

##### options?

[`PointLightOptions`](../interfaces/PointLightOptions.md)

Light configuration options

#### Returns

`PointLight`

The created PointLight

***

### addSpot()

> **addSpot**(`options?`): `SpotLight`

Defined in: [core/Lighting.ts:149](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L149)

Add a spot light to the scene.
Spot lights emit in a cone from a single point.

#### Parameters

##### options?

[`SpotLightOptions`](../interfaces/SpotLightOptions.md)

Light configuration options

#### Returns

`SpotLight`

The created SpotLight

***

### dispose()

> **dispose**(): `void`

Defined in: [core/Lighting.ts:215](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L215)

Dispose of all lights and clean up resources.

#### Returns

`void`

***

### getLights()

> **getLights**(): `Light`\<`LightShadow`\<`Camera`\>\>[]

Defined in: [core/Lighting.ts:186](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L186)

Get all lights in the system.

#### Returns

`Light`\<`LightShadow`\<`Camera`\>\>[]

Array of all lights

***

### remove()

> **remove**(`light`): `void`

Defined in: [core/Lighting.ts:194](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L194)

Remove a specific light from the scene.

#### Parameters

##### light

`Light`

The light to remove

#### Returns

`void`

***

### removeAll()

> **removeAll**(): `void`

Defined in: [core/Lighting.ts:205](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L205)

Remove all lights from the scene.

#### Returns

`void`

***

### setupDefault()

> **setupDefault**(): `void`

Defined in: [core/Lighting.ts:176](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L176)

Set up default 3-point lighting.
Creates ambient light plus two directional lights for balanced illumination.

#### Returns

`void`
