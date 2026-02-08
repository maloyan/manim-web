# Interface: ZoomedSceneOptions

Defined in: [core/SceneExtensions.ts:402](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/SceneExtensions.ts#L402)

Options for configuring a ZoomedScene.

## Extends

- [`SceneOptions`](SceneOptions.md)

## Properties

### autoRender?

> `optional` **autoRender**: `boolean`

Defined in: [core/Scene.ts:32](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L32)

Enable auto-render on add/remove. Defaults to true.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`autoRender`](SceneOptions.md#autorender)

***

### backgroundColor?

> `optional` **backgroundColor**: `string`

Defined in: [core/Scene.ts:22](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L22)

Background color as CSS color string. Defaults to Manim's dark gray (#1C1C1C).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`backgroundColor`](SceneOptions.md#backgroundcolor)

***

### cameraFrameColor?

> `optional` **cameraFrameColor**: `string`

Defined in: [core/SceneExtensions.ts:410](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/SceneExtensions.ts#L410)

Color of the camera frame border. Defaults to '#FFFF00'.

***

### cameraFrameHeight?

> `optional` **cameraFrameHeight**: `number`

Defined in: [core/SceneExtensions.ts:406](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/SceneExtensions.ts#L406)

Height of the zoom camera frame in world units. Defaults to 3.

***

### cameraFrameStrokeWidth?

> `optional` **cameraFrameStrokeWidth**: `number`

Defined in: [core/SceneExtensions.ts:414](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/SceneExtensions.ts#L414)

Stroke width of camera frame. Defaults to 3.

***

### cameraFrameWidth?

> `optional` **cameraFrameWidth**: `number`

Defined in: [core/SceneExtensions.ts:404](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/SceneExtensions.ts#L404)

Width of the zoom camera frame in world units. Defaults to 3.

***

### displayFrameColor?

> `optional` **displayFrameColor**: `string`

Defined in: [core/SceneExtensions.ts:412](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/SceneExtensions.ts#L412)

Color of the display frame border. Defaults to '#FFFF00'.

***

### displayFrameStrokeWidth?

> `optional` **displayFrameStrokeWidth**: `number`

Defined in: [core/SceneExtensions.ts:416](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/SceneExtensions.ts#L416)

Stroke width of display frame. Defaults to 3.

***

### frameHeight?

> `optional` **frameHeight**: `number`

Defined in: [core/Scene.ts:26](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L26)

Frame height in world units. Defaults to 8 (Manim standard).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frameHeight`](SceneOptions.md#frameheight)

***

### frameWidth?

> `optional` **frameWidth**: `number`

Defined in: [core/Scene.ts:24](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L24)

Frame width in world units. Defaults to 14 (Manim standard).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frameWidth`](SceneOptions.md#framewidth)

***

### frustumCulling?

> `optional` **frustumCulling**: `boolean`

Defined in: [core/Scene.ts:30](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L30)

Enable frustum culling optimization. Defaults to true.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frustumCulling`](SceneOptions.md#frustumculling)

***

### height?

> `optional` **height**: `number`

Defined in: [core/Scene.ts:20](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L20)

Canvas height in pixels. Defaults to container height.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`height`](SceneOptions.md#height)

***

### renderTargetSize?

> `optional` **renderTargetSize**: `number`

Defined in: [core/SceneExtensions.ts:418](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/SceneExtensions.ts#L418)

Size of render target in pixels. Defaults to 512.

***

### targetFps?

> `optional` **targetFps**: `number`

Defined in: [core/Scene.ts:28](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L28)

Target frame rate in fps. Defaults to 60.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`targetFps`](SceneOptions.md#targetfps)

***

### width?

> `optional` **width**: `number`

Defined in: [core/Scene.ts:18](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L18)

Canvas width in pixels. Defaults to container width.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`width`](SceneOptions.md#width)

***

### zoomFactor?

> `optional` **zoomFactor**: `number`

Defined in: [core/SceneExtensions.ts:408](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/SceneExtensions.ts#L408)

Default zoom factor (frame.width / display.width). Defaults to 0.3.
