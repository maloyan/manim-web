# Interface: MathJaxRenderOptions

Defined in: [mobjects/text/MathJaxRenderer.ts:22](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MathJaxRenderer.ts#L22)

## Properties

### color?

> `optional` **color**: `string`

Defined in: [mobjects/text/MathJaxRenderer.ts:30](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MathJaxRenderer.ts#L30)

Color applied to the output (CSS color string). Default: '#ffffff'

***

### displayMode?

> `optional` **displayMode**: `boolean`

Defined in: [mobjects/text/MathJaxRenderer.ts:24](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MathJaxRenderer.ts#L24)

Display mode (block) vs inline mode. Default: true

***

### fontScale?

> `optional` **fontScale**: `number`

Defined in: [mobjects/text/MathJaxRenderer.ts:32](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MathJaxRenderer.ts#L32)

Font scale relative to surrounding text (em). Default: 1

***

### macros?

> `optional` **macros**: `Record`\<`string`, `string`\>

Defined in: [mobjects/text/MathJaxRenderer.ts:28](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MathJaxRenderer.ts#L28)

Custom macros as { name: expansion }.

***

### preamble?

> `optional` **preamble**: `string`

Defined in: [mobjects/text/MathJaxRenderer.ts:26](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MathJaxRenderer.ts#L26)

Custom LaTeX preamble (e.g. '\\usepackage{amsmath}'). Merged with defaults.
