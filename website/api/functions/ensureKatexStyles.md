# Function: ensureKatexStyles()

> **ensureKatexStyles**(): `void`

Defined in: [mobjects/text/katex-styles.ts:16](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/text/katex-styles.ts#L16)

Ensure KaTeX styles are loaded in the document.
This is called automatically by MathTex on first use.

The stylesheet is loaded from a CDN for convenience.
In production, you may want to bundle the CSS directly.

## Returns

`void`
