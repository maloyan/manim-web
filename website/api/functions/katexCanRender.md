# Function: katexCanRender()

> **katexCanRender**(`texString`, `displayMode`): `boolean`

Defined in: [mobjects/text/MathJaxRenderer.ts:279](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathJaxRenderer.ts#L279)

Quick check: can KaTeX render this LaTeX string without throwing?
Used by the 'auto' renderer mode to decide whether to fall back to MathJax.

## Parameters

### texString

`string`

### displayMode

`boolean` = `true`

## Returns

`boolean`
