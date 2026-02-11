# Function: parseSVGPathData()

> **parseSVGPathData**(`d`): `Vec2`[][]

Defined in: [mobjects/text/svgPathParser.ts:82](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/text/svgPathParser.ts#L82)

Parse an SVG path `d` attribute into arrays of cubic Bezier control points.
Each sub-path (started by M/m or interrupted by Z/z) produces a separate array.

Returns an array of sub-paths, where each sub-path is an array of Vec2 points
laid out as: [anchor, handle1, handle2, anchor, handle3, handle4, anchor, ...].

## Parameters

### d

`string`

## Returns

`Vec2`[][]
