# Interface: ZoomedSceneOptions

Defined in: [core/SceneExtensions.ts:729](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L729)

Options for configuring a ZoomedScene.

## Extends

- [`SceneOptions`](SceneOptions.md)

## Properties

### autoRender?

> `optional` **autoRender**: `boolean`

Defined in: [core/Scene.ts:32](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L32)

Enable auto-render on add/remove. Defaults to true.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`autoRender`](SceneOptions.md#autorender)

***

### backgroundColor?

> `optional` **backgroundColor**: `string`

Defined in: [core/Scene.ts:22](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L22)

Background color as CSS color string. Defaults to Manim's dark gray (#1C1C1C).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`backgroundColor`](SceneOptions.md#backgroundcolor)

***

### cameraFrameColor?

> `optional` **cameraFrameColor**: `string`

Defined in: [core/SceneExtensions.ts:741](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L741)

Color of the camera frame border. Defaults to '#FFFF00'.

***

### cameraFrameHeight?

> `optional` **cameraFrameHeight**: `number`

Defined in: [core/SceneExtensions.ts:733](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L733)

Height of the zoom camera frame in world units. Defaults to 3.

***

### cameraFrameStrokeWidth?

> `optional` **cameraFrameStrokeWidth**: `number`

Defined in: [core/SceneExtensions.ts:745](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L745)

Stroke width of camera frame. Defaults to 3.

***

### cameraFrameWidth?

> `optional` **cameraFrameWidth**: `number`

Defined in: [core/SceneExtensions.ts:731](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L731)

Width of the zoom camera frame in world units. Defaults to 3.

***

### displayCorner?

> `optional` **displayCorner**: \[`number`, `number`, `number`\]

Defined in: [core/SceneExtensions.ts:751](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L751)

Corner direction for zoomed display [x, y, z]. Defaults to UP+RIGHT [1,1,0].

***

### displayCornerBuff?

> `optional` **displayCornerBuff**: `number`

Defined in: [core/SceneExtensions.ts:753](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L753)

Buffer from corner edges. Defaults to 0.5.

***

### displayFrameColor?

> `optional` **displayFrameColor**: `string`

Defined in: [core/SceneExtensions.ts:743](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L743)

Color of the display frame border. Defaults to '#FFFF00'.

***

### displayFrameStrokeWidth?

> `optional` **displayFrameStrokeWidth**: `number`

Defined in: [core/SceneExtensions.ts:747](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L747)

Stroke width of display frame. Defaults to 3.

***

### displayHeight?

> `optional` **displayHeight**: `number`

Defined in: [core/SceneExtensions.ts:739](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L739)

Height of the zoomed display in world units. Defaults to 3.

***

### displayWidth?

> `optional` **displayWidth**: `number`

Defined in: [core/SceneExtensions.ts:737](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L737)

Width of the zoomed display in world units. Defaults to 3.

***

### frameHeight?

> `optional` **frameHeight**: `number`

Defined in: [core/Scene.ts:26](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L26)

Frame height in world units. Defaults to 8 (Manim standard).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frameHeight`](SceneOptions.md#frameheight)

***

### frameWidth?

> `optional` **frameWidth**: `number`

Defined in: [core/Scene.ts:24](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L24)

Frame width in world units. Defaults to 14 (Manim standard).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frameWidth`](SceneOptions.md#framewidth)

***

### frustumCulling?

> `optional` **frustumCulling**: `boolean`

Defined in: [core/Scene.ts:30](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L30)

Enable frustum culling optimization. Defaults to true.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frustumCulling`](SceneOptions.md#frustumculling)

***

### height?

> `optional` **height**: `number`

Defined in: [core/Scene.ts:20](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L20)

Canvas height in pixels. Defaults to container height.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`height`](SceneOptions.md#height)

***

### renderTargetSize?

> `optional` **renderTargetSize**: `number`

Defined in: [core/SceneExtensions.ts:749](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L749)

Size of render target in pixels. Defaults to 512.

***

### targetFps?

> `optional` **targetFps**: `number`

Defined in: [core/Scene.ts:28](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L28)

Target frame rate in fps. Defaults to 60.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`targetFps`](SceneOptions.md#targetfps)

***

### width?

> `optional` **width**: `number`

Defined in: [core/Scene.ts:18](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L18)

Canvas width in pixels. Defaults to container width.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`width`](SceneOptions.md#width)

***

### zoomFactor?

> `optional` **zoomFactor**: `number`

Defined in: [core/SceneExtensions.ts:735](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/SceneExtensions.ts#L735)

Default zoom factor (frame.width / display.width). Defaults to 0.3.
