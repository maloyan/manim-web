# Function: ensureKatexStyles()

> **ensureKatexStyles**(): `void`

Defined in: [mobjects/text/katex-styles.ts:16](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/katex-styles.ts#L16)

Ensure KaTeX styles are loaded in the document.
This is called automatically by MathTex on first use.

The stylesheet is loaded from a CDN for convenience.
In production, you may want to bundle the CSS directly.

## Returns

`void`
