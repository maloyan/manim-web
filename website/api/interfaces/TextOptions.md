# Interface: TextOptions

Defined in: [mobjects/text/Text.ts:10](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L10)

Options for creating a Text mobject

## Extended by

- [`ParagraphOptions`](ParagraphOptions.md)
- [`MarkupTextOptions`](MarkupTextOptions.md)

## Properties

### color?

> `optional` **color**: `string`

Defined in: [mobjects/text/Text.ts:22](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L22)

Text color as CSS color string. Default: '#ffffff'

***

### fillOpacity?

> `optional` **fillOpacity**: `number`

Defined in: [mobjects/text/Text.ts:24](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L24)

Fill opacity from 0 to 1. Default: 1

***

### fontFamily?

> `optional` **fontFamily**: `string`

Defined in: [mobjects/text/Text.ts:16](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L16)

Font family. Default: 'CMU Serif, Georgia, Times New Roman, serif' (Manim-like)

***

### fontSize?

> `optional` **fontSize**: `number`

Defined in: [mobjects/text/Text.ts:14](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L14)

Font size in pixels. Default: 48

***

### fontStyle?

> `optional` **fontStyle**: `string`

Defined in: [mobjects/text/Text.ts:20](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L20)

Font style ('normal' | 'italic'). Default: 'normal'

***

### fontUrl?

> `optional` **fontUrl**: `string`

Defined in: [mobjects/text/Text.ts:34](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L34)

URL to a font file (OTF/TTF) for glyph vector extraction. When provided, loadGlyphs() can extract glyph outlines for stroke-draw animation.

***

### fontWeight?

> `optional` **fontWeight**: `string` \| `number`

Defined in: [mobjects/text/Text.ts:18](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L18)

Font weight. Default: 'normal'

***

### letterSpacing?

> `optional` **letterSpacing**: `number`

Defined in: [mobjects/text/Text.ts:30](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L30)

Letter spacing in pixels. Default: 0

***

### lineHeight?

> `optional` **lineHeight**: `number`

Defined in: [mobjects/text/Text.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L28)

Line height multiplier. Default: 1.2

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/text/Text.ts:26](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L26)

Stroke width for outlined text. Default: 0

***

### text

> **text**: `string`

Defined in: [mobjects/text/Text.ts:12](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L12)

The text content to display

***

### textAlign?

> `optional` **textAlign**: `"center"` \| `"left"` \| `"right"`

Defined in: [mobjects/text/Text.ts:32](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/Text.ts#L32)

Text alignment. Default: 'center'
