# Interface: ImageMobjectOptions

Defined in: [mobjects/image/index.ts:21](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L21)

Options for creating an ImageMobject

## Properties

### center?

> `optional` **center**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/image/index.ts:33](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L33)

Center position [x, y, z]. Default: [0, 0, 0]

***

### doubleSided?

> `optional` **doubleSided**: `boolean`

Defined in: [mobjects/image/index.ts:39](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L39)

Whether to render both sides. Default: false

***

### filters?

> `optional` **filters**: [`ImageFilterOptions`](ImageFilterOptions.md)

Defined in: [mobjects/image/index.ts:37](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L37)

Image filter options

***

### height?

> `optional` **height**: `number`

Defined in: [mobjects/image/index.ts:29](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L29)

Height of the image in scene units. Default: auto-calculated from aspect ratio

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [mobjects/image/index.ts:35](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L35)

Opacity from 0 to 1. Default: 1

***

### pixelData?

> `optional` **pixelData**: `number`[][]

Defined in: [mobjects/image/index.ts:25](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L25)

2D grayscale pixel array (values 0-255). Each inner array is a row. Either source or pixelData is required.

***

### scaleToFit?

> `optional` **scaleToFit**: `boolean`

Defined in: [mobjects/image/index.ts:31](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L31)

If both width and height specified, whether to scale to fit within bounds preserving aspect ratio. Default: true

***

### source?

> `optional` **source**: `string`

Defined in: [mobjects/image/index.ts:23](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L23)

Image source: URL or base64 data URI. Either source or pixelData is required.

***

### width?

> `optional` **width**: `number`

Defined in: [mobjects/image/index.ts:27](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/image/index.ts#L27)

Width of the image in scene units. Default: auto-calculated from aspect ratio
