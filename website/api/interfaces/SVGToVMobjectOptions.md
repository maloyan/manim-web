# Interface: SVGToVMobjectOptions

Defined in: [mobjects/text/svgPathParser.ts:31](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/svgPathParser.ts#L31)

## Properties

### color?

> `optional` **color**: `string`

Defined in: [mobjects/text/svgPathParser.ts:33](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/svgPathParser.ts#L33)

Stroke / fill color for the resulting VMobjects.

***

### fillOpacity?

> `optional` **fillOpacity**: `number`

Defined in: [mobjects/text/svgPathParser.ts:37](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/svgPathParser.ts#L37)

Fill opacity. Default: 0 (stroke only).

***

### flipY?

> `optional` **flipY**: `boolean`

Defined in: [mobjects/text/svgPathParser.ts:44](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/svgPathParser.ts#L44)

If true, flip the Y axis so SVG screen-space (Y-down) maps
to manim world-space (Y-up). Default: true.

***

### scale?

> `optional` **scale**: `number`

Defined in: [mobjects/text/svgPathParser.ts:39](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/svgPathParser.ts#L39)

Uniform scale factor applied to every point. Default: 1

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/text/svgPathParser.ts:35](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/svgPathParser.ts#L35)

Stroke width. Default: DEFAULT_STROKE_WIDTH (4).
