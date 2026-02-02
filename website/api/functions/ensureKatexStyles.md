# Function: ensureKatexStyles()

> **ensureKatexStyles**(): `void`

Defined in: [mobjects/text/katex-styles.ts:16](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/katex-styles.ts#L16)

Ensure KaTeX styles are loaded in the document.
This is called automatically by MathTex on first use.

The stylesheet is loaded from a CDN for convenience.
In production, you may want to bundle the CSS directly.

## Returns

`void`
