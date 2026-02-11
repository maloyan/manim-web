# Interface: ZoomedSceneOptions

Defined in: [core/SceneExtensions.ts:523](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L523)

Options for configuring a ZoomedScene.

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

### cameraFrameColor?

> `optional` **cameraFrameColor**: `string`

Defined in: [core/SceneExtensions.ts:535](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L535)

Color of the camera frame border. Defaults to '#FFFF00'.

***

### cameraFrameHeight?

> `optional` **cameraFrameHeight**: `number`

Defined in: [core/SceneExtensions.ts:527](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L527)

Height of the zoom camera frame in world units. Defaults to 3.

***

### cameraFrameStrokeWidth?

> `optional` **cameraFrameStrokeWidth**: `number`

Defined in: [core/SceneExtensions.ts:539](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L539)

Stroke width of camera frame. Defaults to 3.

***

### cameraFrameWidth?

> `optional` **cameraFrameWidth**: `number`

Defined in: [core/SceneExtensions.ts:525](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L525)

Width of the zoom camera frame in world units. Defaults to 3.

***

### displayCorner?

> `optional` **displayCorner**: \[`number`, `number`, `number`\]

Defined in: [core/SceneExtensions.ts:545](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L545)

Corner direction for zoomed display [x, y, z]. Defaults to UP+RIGHT [1,1,0].

***

### displayCornerBuff?

> `optional` **displayCornerBuff**: `number`

Defined in: [core/SceneExtensions.ts:547](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L547)

Buffer from corner edges. Defaults to 0.5.

***

### displayFrameColor?

> `optional` **displayFrameColor**: `string`

Defined in: [core/SceneExtensions.ts:537](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L537)

Color of the display frame border. Defaults to '#FFFF00'.

***

### displayFrameStrokeWidth?

> `optional` **displayFrameStrokeWidth**: `number`

Defined in: [core/SceneExtensions.ts:541](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L541)

Stroke width of display frame. Defaults to 3.

***

### displayHeight?

> `optional` **displayHeight**: `number`

Defined in: [core/SceneExtensions.ts:533](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L533)

Height of the zoomed display in world units. Defaults to 3.

***

### displayWidth?

> `optional` **displayWidth**: `number`

Defined in: [core/SceneExtensions.ts:531](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L531)

Width of the zoomed display in world units. Defaults to 3.

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

### renderTargetSize?

> `optional` **renderTargetSize**: `number`

Defined in: [core/SceneExtensions.ts:543](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L543)

Size of render target in pixels. Defaults to 512.

***

### targetFps?

> `optional` **targetFps**: `number`

Defined in: [core/Scene.ts:28](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L28)

Target frame rate in fps. Defaults to 60.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`targetFps`](SceneOptions.md#targetfps)

***

### width?

> `optional` **width**: `number`

Defined in: [core/Scene.ts:18](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L18)

Canvas width in pixels. Defaults to container width.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`width`](SceneOptions.md#width)

***

### zoomFactor?

> `optional` **zoomFactor**: `number`

Defined in: [core/SceneExtensions.ts:529](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L529)

Default zoom factor (frame.width / display.width). Defaults to 0.3.
