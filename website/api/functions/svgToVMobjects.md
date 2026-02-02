# Function: svgToVMobjects()

> **svgToVMobjects**(`svgElement`, `options`): [`VGroup`](../classes/VGroup.md)

Defined in: [mobjects/text/svgPathParser.ts:407](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/svgPathParser.ts#L407)

Walk an SVG element tree (as produced by MathJax) and convert every
`<path>` element into a VMobject.  Returns a VGroup containing one
VMobject child per glyph / path element.

Handles MathJax SVG specifics:
- `<defs>` blocks with glyph definitions referenced via `<use>`
- Nested `<g>` transforms
- `viewBox` → coordinate mapping

## Parameters

### svgElement

`Element` | `SVGElement`

### options

[`SVGToVMobjectOptions`](../interfaces/SVGToVMobjectOptions.md) = `{}`

## Returns

[`VGroup`](../classes/VGroup.md)
