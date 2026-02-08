# Interface: GlyphVMobjectOptions

Defined in: [mobjects/text/GlyphVMobject.ts:16](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L16)

## Properties

### color?

> `optional` **color**: `string`

Defined in: [mobjects/text/GlyphVMobject.ts:28](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L28)

Stroke color

***

### font

> **font**: `Font`

Defined in: [mobjects/text/GlyphVMobject.ts:20](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L20)

The font this glyph belongs to (needed for unitsPerEm)

***

### fontSize

> **fontSize**: `number`

Defined in: [mobjects/text/GlyphVMobject.ts:22](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L22)

Font size in pixels

***

### glyph

> **glyph**: `Glyph`

Defined in: [mobjects/text/GlyphVMobject.ts:18](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L18)

The opentype.js Glyph object

***

### skeletonOptions?

> `optional` **skeletonOptions**: [`SkeletonizeOptions`](SkeletonizeOptions.md)

Defined in: [mobjects/text/GlyphVMobject.ts:38](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L38)

Options forwarded to the skeletonization algorithm.

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/text/GlyphVMobject.ts:30](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L30)

Stroke width for outline drawing

***

### useSkeletonStroke?

> `optional` **useSkeletonStroke**: `boolean`

Defined in: [mobjects/text/GlyphVMobject.ts:36](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L36)

When true, compute the skeleton (medial axis) of the glyph outline
so the Write animation can draw along the center-line rather than
the perimeter. Default: false.

***

### xOffset?

> `optional` **xOffset**: `number`

Defined in: [mobjects/text/GlyphVMobject.ts:24](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L24)

X offset in pixels (for character positioning)

***

### yOffset?

> `optional` **yOffset**: `number`

Defined in: [mobjects/text/GlyphVMobject.ts:26](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/GlyphVMobject.ts#L26)

Y offset in pixels
