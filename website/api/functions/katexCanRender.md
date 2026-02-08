# Function: katexCanRender()

> **katexCanRender**(`texString`, `displayMode`): `boolean`

Defined in: [mobjects/text/MathJaxRenderer.ts:279](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathJaxRenderer.ts#L279)

Quick check: can KaTeX render this LaTeX string without throwing?
Used by the 'auto' renderer mode to decide whether to fall back to MathJax.

## Parameters

### texString

`string`

### displayMode

`boolean` = `true`

## Returns

`boolean`
