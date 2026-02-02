# Function: katexCanRender()

> **katexCanRender**(`texString`, `displayMode`): `boolean`

Defined in: [mobjects/text/MathJaxRenderer.ts:279](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathJaxRenderer.ts#L279)

Quick check: can KaTeX render this LaTeX string without throwing?
Used by the 'auto' renderer mode to decide whether to fall back to MathJax.

## Parameters

### texString

`string`

### displayMode

`boolean` = `true`

## Returns

`boolean`
