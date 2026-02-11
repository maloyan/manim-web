# Interface: ArcPolygonOptions

Defined in: [mobjects/geometry/ArcShapes.ts:935](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/ArcShapes.ts#L935)

Options for creating an ArcPolygon

## Properties

### arcConfigs?

> `optional` **arcConfigs**: [`ArcConfig`](ArcConfig.md)[]

Defined in: [mobjects/geometry/ArcShapes.ts:939](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/ArcShapes.ts#L939)

Arc configurations for each edge. If not provided, straight lines are used.

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/geometry/ArcShapes.ts:941](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/ArcShapes.ts#L941)

Stroke color as CSS color string. Default: Manim's blue (#58C4DD)

***

### fillOpacity?

> `optional` **fillOpacity**: `number`

Defined in: [mobjects/geometry/ArcShapes.ts:943](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/ArcShapes.ts#L943)

Fill opacity from 0 to 1. Default: 0

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/geometry/ArcShapes.ts:945](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/ArcShapes.ts#L945)

Stroke width in pixels. Default: 4 (Manim's default)

***

### vertices

> **vertices**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)[]

Defined in: [mobjects/geometry/ArcShapes.ts:937](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/ArcShapes.ts#L937)

Array of vertices defining the polygon. Required.
