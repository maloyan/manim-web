# Function: preloadMathJax()

> **preloadMathJax**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathJaxRenderer.ts:153](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/text/MathJaxRenderer.ts#L153)

Pre-load MathJax so the first render is fast.
Call this early (e.g. on page load) if you know LaTeX will be used.

## Returns

`Promise`\<`void`\>
