# Interface: RendererOptions

Defined in: [core/Renderer.ts:6](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L6)

Options for configuring the Renderer.

## Properties

### alpha?

> `optional` **alpha**: `boolean`

Defined in: [core/Renderer.ts:20](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L20)

Enable alpha channel. Defaults to false.

***

### antialias?

> `optional` **antialias**: `boolean`

Defined in: [core/Renderer.ts:14](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L14)

Enable antialiasing. Defaults to true.

***

### backgroundColor?

> `optional` **backgroundColor**: `string`

Defined in: [core/Renderer.ts:12](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L12)

Background color as CSS color string. Defaults to '#000000'.

***

### canvas?

> `optional` **canvas**: `HTMLCanvasElement`

Defined in: [core/Renderer.ts:24](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L24)

Existing canvas element to reuse. If not provided, a new canvas is created.

***

### height?

> `optional` **height**: `number`

Defined in: [core/Renderer.ts:10](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L10)

Canvas height in pixels. Defaults to container height.

***

### pixelRatio?

> `optional` **pixelRatio**: `number`

Defined in: [core/Renderer.ts:16](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L16)

Device pixel ratio. Defaults to window.devicePixelRatio (capped at 2x for performance).

***

### powerPreference?

> `optional` **powerPreference**: `"default"` \| `"high-performance"` \| `"low-power"`

Defined in: [core/Renderer.ts:18](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L18)

GPU power preference. Defaults to 'high-performance'.

***

### preserveDrawingBuffer?

> `optional` **preserveDrawingBuffer**: `boolean`

Defined in: [core/Renderer.ts:22](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L22)

Preserve drawing buffer for export. Defaults to true for video/image export support.

***

### width?

> `optional` **width**: `number`

Defined in: [core/Renderer.ts:8](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L8)

Canvas width in pixels. Defaults to container width.
