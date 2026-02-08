# Interface: CutoutOptions

Defined in: [mobjects/geometry/PolygonExtensions.ts:786](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L786)

Options for creating a Cutout

## Properties

### color?

> `optional` **color**: `string`

Defined in: [mobjects/geometry/PolygonExtensions.ts:792](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L792)

Stroke color as CSS color string. Default: inherits from outer shape

***

### fillOpacity?

> `optional` **fillOpacity**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:794](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L794)

Fill opacity from 0 to 1. Default: inherits from outer shape

***

### innerShape

> **innerShape**: [`VMobject`](../classes/VMobject.md)

Defined in: [mobjects/geometry/PolygonExtensions.ts:790](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L790)

The inner shape (the hole, must be a VMobject). Required.

***

### outerShape

> **outerShape**: [`VMobject`](../classes/VMobject.md)

Defined in: [mobjects/geometry/PolygonExtensions.ts:788](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L788)

The outer shape (must be a VMobject). Required.

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/geometry/PolygonExtensions.ts:796](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/geometry/PolygonExtensions.ts#L796)

Stroke width in pixels. Default: inherits from outer shape
