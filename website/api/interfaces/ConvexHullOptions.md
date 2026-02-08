# Interface: ConvexHullOptions

Defined in: [mobjects/geometry/PolygonExtensions.ts:902](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L902)

Options for creating a ConvexHull

## Properties

### color?

> `optional` **color**: `string`

Defined in: [mobjects/geometry/PolygonExtensions.ts:906](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L906)

Stroke color as CSS color string. Default: Manim's blue (#58C4DD)

***

### fillOpacity?

> `optional` **fillOpacity**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:908](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L908)

Fill opacity from 0 to 1. Default: 0

***

### points

> **points**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)[]

Defined in: [mobjects/geometry/PolygonExtensions.ts:904](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L904)

Array of points to compute convex hull from. Required.

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:910](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L910)

Stroke width in pixels. Default: 4 (Manim's default)
