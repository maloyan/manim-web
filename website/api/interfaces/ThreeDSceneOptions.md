# Interface: ThreeDSceneOptions

Defined in: [core/SceneExtensions.ts:21](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L21)

Options for configuring a ThreeDScene.

## Extends

- [`SceneOptions`](SceneOptions.md)

## Properties

### autoRender?

> `optional` **autoRender**: `boolean`

Defined in: [core/Scene.ts:32](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L32)

Enable auto-render on add/remove. Defaults to true.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`autoRender`](SceneOptions.md#autorender)

***

### backgroundColor?

> `optional` **backgroundColor**: `string`

Defined in: [core/Scene.ts:22](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L22)

Background color as CSS color string. Defaults to Manim's dark gray (#1C1C1C).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`backgroundColor`](SceneOptions.md#backgroundcolor)

***

### distance?

> `optional` **distance**: `number`

Defined in: [core/SceneExtensions.ts:29](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L29)

Initial camera distance from origin. Defaults to 15.

***

### enableOrbitControls?

> `optional` **enableOrbitControls**: `boolean`

Defined in: [core/SceneExtensions.ts:31](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L31)

Enable orbit controls for user interaction. Defaults to true.

***

### fov?

> `optional` **fov**: `number`

Defined in: [core/SceneExtensions.ts:23](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L23)

Camera field of view in degrees. Defaults to 45.

***

### frameHeight?

> `optional` **frameHeight**: `number`

Defined in: [core/Scene.ts:26](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L26)

Frame height in world units. Defaults to 8 (Manim standard).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frameHeight`](SceneOptions.md#frameheight)

***

### frameWidth?

> `optional` **frameWidth**: `number`

Defined in: [core/Scene.ts:24](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L24)

Frame width in world units. Defaults to 14 (Manim standard).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frameWidth`](SceneOptions.md#framewidth)

***

### frustumCulling?

> `optional` **frustumCulling**: `boolean`

Defined in: [core/Scene.ts:30](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L30)

Enable frustum culling optimization. Defaults to true.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frustumCulling`](SceneOptions.md#frustumculling)

***

### height?

> `optional` **height**: `number`

Defined in: [core/Scene.ts:20](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L20)

Canvas height in pixels. Defaults to container height.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`height`](SceneOptions.md#height)

***

### orbitControlsOptions?

> `optional` **orbitControlsOptions**: [`OrbitControlsOptions`](OrbitControlsOptions.md)

Defined in: [core/SceneExtensions.ts:33](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L33)

Orbit controls configuration options.

***

### phi?

> `optional` **phi**: `number`

Defined in: [core/SceneExtensions.ts:25](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L25)

Initial camera phi angle (polar, from Y axis). Defaults to PI/4.

***

### setupLighting?

> `optional` **setupLighting**: `boolean`

Defined in: [core/SceneExtensions.ts:35](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L35)

Whether to set up default lighting. Defaults to true.

***

### targetFps?

> `optional` **targetFps**: `number`

Defined in: [core/Scene.ts:28](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L28)

Target frame rate in fps. Defaults to 60.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`targetFps`](SceneOptions.md#targetfps)

***

### theta?

> `optional` **theta**: `number`

Defined in: [core/SceneExtensions.ts:27](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L27)

Initial camera theta angle (azimuthal, in XZ plane). Defaults to -PI/4.

***

### width?

> `optional` **width**: `number`

Defined in: [core/Scene.ts:18](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L18)

Canvas width in pixels. Defaults to container width.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`width`](SceneOptions.md#width)
