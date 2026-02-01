# Function: katexCanRender()

> **katexCanRender**(`texString`, `displayMode`): `boolean`

Defined in: [mobjects/text/MathJaxRenderer.ts:279](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/text/MathJaxRenderer.ts#L279)

Quick check: can KaTeX render this LaTeX string without throwing?
Used by the 'auto' renderer mode to decide whether to fall back to MathJax.

## Parameters

### texString

`string`

### displayMode

`boolean` = `true`

## Returns

`boolean`
