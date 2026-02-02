# Function: svgToVMobjects()

> **svgToVMobjects**(`svgElement`, `options`): [`VGroup`](../classes/VGroup.md)

Defined in: [mobjects/text/svgPathParser.ts:407](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/svgPathParser.ts#L407)

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
