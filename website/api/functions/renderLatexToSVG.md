# Function: renderLatexToSVG()

> **renderLatexToSVG**(`texString`, `options`): `Promise`\<[`MathJaxRenderResult`](../interfaces/MathJaxRenderResult.md)\>

Defined in: [mobjects/text/MathJaxRenderer.ts:165](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathJaxRenderer.ts#L165)

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
