# Interface: MathTexOptions

Defined in: [mobjects/text/MathTex.ts:33](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathTex.ts#L33)

Options for creating a MathTex object

## Properties

### \_padding?

> `optional` **\_padding**: `number`

Defined in: [mobjects/text/MathTex.ts:47](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathTex.ts#L47)

Internal: padding in pixels around the rendered content. Default: 10

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/text/MathTex.ts:39](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathTex.ts#L39)

Color as CSS color string. Default: '#ffffff'

***

### displayMode?

> `optional` **displayMode**: `boolean`

Defined in: [mobjects/text/MathTex.ts:43](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathTex.ts#L43)

Use display mode (block) vs inline mode. Default: true

***

### fontSize?

> `optional` **fontSize**: `number`

Defined in: [mobjects/text/MathTex.ts:41](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathTex.ts#L41)

Base font size in pixels. Default: 48

***

### latex

> **latex**: `string` \| `string`[]

Defined in: [mobjects/text/MathTex.ts:37](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathTex.ts#L37)

LaTeX string or array of strings for multi-part expressions.
 When an array is provided, each string becomes a separate sub-mobject
 accessible via getPart(index), matching Python Manim's behavior.

***

### position?

> `optional` **position**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/text/MathTex.ts:45](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathTex.ts#L45)

Position in 3D space. Default: [0, 0, 0]

***

### renderer?

> `optional` **renderer**: [`TexRenderer`](../type-aliases/TexRenderer.md)

Defined in: [mobjects/text/MathTex.ts:54](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathTex.ts#L54)

Which renderer to use.
- 'katex'  : KaTeX only (fast)
- 'mathjax': MathJax SVG only (full LaTeX support)
- 'auto'   : KaTeX first, MathJax fallback (default)
