# Function: ensureKatexStyles()

> **ensureKatexStyles**(): `void`

Defined in: [mobjects/text/katex-styles.ts:16](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/katex-styles.ts#L16)

Ensure KaTeX styles are loaded in the document.
This is called automatically by MathTex on first use.

The stylesheet is loaded from a CDN for convenience.
In production, you may want to bundle the CSS directly.

## Returns

`void`
