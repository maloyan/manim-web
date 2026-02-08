# Interface: RegularPolygramOptions

Defined in: [mobjects/geometry/PolygonExtensions.ts:490](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L490)

Options for creating a RegularPolygram

## Properties

### center?

> `optional` **center**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/PolygonExtensions.ts:514](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L514)

Center position. Default: [0, 0, 0]

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/geometry/PolygonExtensions.ts:508](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L508)

Stroke color as CSS color string. Default: Manim's blue (#58C4DD)

***

### density?

> `optional` **density**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:504](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L504)

Density (vertex step count), i.e. how many vertices to skip when
drawing each edge. Default: 2

The Schlafli symbol {numVertices/density} describes the polygram.
For example {5/2} is a pentagram, {7/3} is a heptagram.

When gcd(numVertices, density) > 1 the polygram decomposes into
multiple congruent regular polygon components. For instance {6/2}
simplifies to 2{3} -- two overlapping equilateral triangles.

***

### fillOpacity?

> `optional` **fillOpacity**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:510](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L510)

Fill opacity from 0 to 1. Default: 0

***

### numVertices?

> `optional` **numVertices**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:492](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L492)

Number of vertices on the circumscribed circle. Default: 5

***

### radius?

> `optional` **radius**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:506](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L506)

Radius from center to vertices. Default: 1

***

### startAngle?

> `optional` **startAngle**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:516](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L516)

Start angle in radians. Default: PI/2 (first vertex up)

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:512](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L512)

Stroke width in pixels. Default: 4 (Manim's default)
