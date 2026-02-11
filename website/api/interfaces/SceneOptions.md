# Interface: SceneOptions

Defined in: [core/Scene.ts:16](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L16)

Options for configuring a Scene.

## Extended by

- [`InteractiveSceneOptions`](InteractiveSceneOptions.md)
- [`ThreeDSceneOptions`](ThreeDSceneOptions.md)
- [`ZoomedSceneOptions`](ZoomedSceneOptions.md)

## Properties

### autoRender?

> `optional` **autoRender**: `boolean`

Defined in: [core/Scene.ts:32](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L32)

Enable auto-render on add/remove. Defaults to true.

***

### backgroundColor?

> `optional` **backgroundColor**: `string`

Defined in: [core/Scene.ts:22](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L22)

Background color as CSS color string. Defaults to Manim's dark gray (#1C1C1C).

***

### frameHeight?

> `optional` **frameHeight**: `number`

Defined in: [core/Scene.ts:26](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L26)

Frame height in world units. Defaults to 8 (Manim standard).

***

### frameWidth?

> `optional` **frameWidth**: `number`

Defined in: [core/Scene.ts:24](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L24)

Frame width in world units. Defaults to 14 (Manim standard).

***

### frustumCulling?

> `optional` **frustumCulling**: `boolean`

Defined in: [core/Scene.ts:30](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L30)

Enable frustum culling optimization. Defaults to true.

***

### height?

> `optional` **height**: `number`

Defined in: [core/Scene.ts:20](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L20)

Canvas height in pixels. Defaults to container height.

***

### targetFps?

> `optional` **targetFps**: `number`

Defined in: [core/Scene.ts:28](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L28)

Target frame rate in fps. Defaults to 60.

***

### width?

> `optional` **width**: `number`

Defined in: [core/Scene.ts:18](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L18)

Canvas width in pixels. Defaults to container width.
