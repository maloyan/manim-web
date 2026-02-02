# Interface: ScreenRectangleOptions

Defined in: [mobjects/frame/index.ts:24](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/frame/index.ts#L24)

Options for creating a ScreenRectangle

## Extends

- `Omit`\<[`RectangleOptions`](RectangleOptions.md), `"width"`\>

## Properties

### aspectRatio?

> `optional` **aspectRatio**: `number`

Defined in: [mobjects/frame/index.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/frame/index.ts#L28)

Aspect ratio (width/height). Default: 16/9

***

### center?

> `optional` **center**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Rectangle.ts:20](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/geometry/Rectangle.ts#L20)

Center position. Default: [0, 0, 0]

#### Inherited from

[`RectangleOptions`](RectangleOptions.md).[`center`](RectangleOptions.md#center)

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/geometry/Rectangle.ts:14](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/geometry/Rectangle.ts#L14)

Stroke color as CSS color string. Default: Manim's blue (#58C4DD)

#### Inherited from

[`RectangleOptions`](RectangleOptions.md).[`color`](RectangleOptions.md#color)

***

### fillOpacity?

> `optional` **fillOpacity**: `number`

Defined in: [mobjects/geometry/Rectangle.ts:16](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/geometry/Rectangle.ts#L16)

Fill opacity from 0 to 1. Default: 0

#### Inherited from

[`RectangleOptions`](RectangleOptions.md).[`fillOpacity`](RectangleOptions.md#fillopacity)

***

### height?

> `optional` **height**: `number`

Defined in: [mobjects/frame/index.ts:26](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/frame/index.ts#L26)

Height of the rectangle. Default: 4

#### Overrides

[`RectangleOptions`](RectangleOptions.md).[`height`](RectangleOptions.md#height)

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/geometry/Rectangle.ts:18](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/geometry/Rectangle.ts#L18)

Stroke width in pixels. Default: 4 (Manim's default)

#### Inherited from

[`RectangleOptions`](RectangleOptions.md).[`strokeWidth`](RectangleOptions.md#strokewidth)
