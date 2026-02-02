# Function: katexCanRender()

> **katexCanRender**(`texString`, `displayMode`): `boolean`

Defined in: [mobjects/text/MathJaxRenderer.ts:279](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MathJaxRenderer.ts#L279)

Quick check: can KaTeX render this LaTeX string without throwing?
Used by the 'auto' renderer mode to decide whether to fall back to MathJax.

## Parameters

### texString

`string`

### displayMode

`boolean` = `true`

## Returns

`boolean`
