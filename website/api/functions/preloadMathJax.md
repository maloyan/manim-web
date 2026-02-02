# Function: preloadMathJax()

> **preloadMathJax**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathJaxRenderer.ts:153](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MathJaxRenderer.ts#L153)

Pre-load MathJax so the first render is fast.
Call this early (e.g. on page load) if you know LaTeX will be used.

## Returns

`Promise`\<`void`\>
