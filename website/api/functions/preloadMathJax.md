# Function: preloadMathJax()

> **preloadMathJax**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathJaxRenderer.ts:153](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathJaxRenderer.ts#L153)

Pre-load MathJax so the first render is fast.
Call this early (e.g. on page load) if you know LaTeX will be used.

## Returns

`Promise`\<`void`\>
