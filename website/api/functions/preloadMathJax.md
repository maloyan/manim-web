# Function: preloadMathJax()

> **preloadMathJax**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathJaxRenderer.ts:153](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathJaxRenderer.ts#L153)

Pre-load MathJax so the first render is fast.
Call this early (e.g. on page load) if you know LaTeX will be used.

## Returns

`Promise`\<`void`\>
