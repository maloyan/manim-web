# Function: renderLatexToSVG()

> **renderLatexToSVG**(`texString`, `options`): `Promise`\<[`MathJaxRenderResult`](../interfaces/MathJaxRenderResult.md)\>

Defined in: [mobjects/text/MathJaxRenderer.ts:165](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathJaxRenderer.ts#L165)

Render a LaTeX string to SVG using MathJax and convert the result
into VMobject paths suitable for manim-js animation.

## Parameters

### texString

`string`

The raw LaTeX to render (without delimiters).

### options

[`MathJaxRenderOptions`](../interfaces/MathJaxRenderOptions.md) = `{}`

Rendering options.

## Returns

`Promise`\<[`MathJaxRenderResult`](../interfaces/MathJaxRenderResult.md)\>

A MathJaxRenderResult containing the SVG element and VMobject group.
