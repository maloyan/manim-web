# Interface: TextGlyphGroupOptions

Defined in: [mobjects/text/TextGlyphGroup.ts:18](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/TextGlyphGroup.ts#L18)

## Properties

### color?

> `optional` **color**: `string`

Defined in: [mobjects/text/TextGlyphGroup.ts:26](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/TextGlyphGroup.ts#L26)

Stroke color (default: '#ffffff')

***

### fontSize?

> `optional` **fontSize**: `number`

Defined in: [mobjects/text/TextGlyphGroup.ts:24](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/TextGlyphGroup.ts#L24)

Font size in pixels (default: 48)

***

### fontUrl

> **fontUrl**: `string`

Defined in: [mobjects/text/TextGlyphGroup.ts:22](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/TextGlyphGroup.ts#L22)

URL to the font file (OTF/TTF)

***

### skeletonOptions?

> `optional` **skeletonOptions**: [`SkeletonizeOptions`](SkeletonizeOptions.md)

Defined in: [mobjects/text/TextGlyphGroup.ts:35](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/TextGlyphGroup.ts#L35)

Options forwarded to the skeletonization algorithm.

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/text/TextGlyphGroup.ts:28](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/TextGlyphGroup.ts#L28)

Stroke width for glyph outlines (default: 2)

***

### text

> **text**: `string`

Defined in: [mobjects/text/TextGlyphGroup.ts:20](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/TextGlyphGroup.ts#L20)

The text string to render

***

### useSkeletonStroke?

> `optional` **useSkeletonStroke**: `boolean`

Defined in: [mobjects/text/TextGlyphGroup.ts:33](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/TextGlyphGroup.ts#L33)

When true, each GlyphVMobject computes its skeleton (medial axis)
so the Write animation can draw along the center-line. Default: false.
