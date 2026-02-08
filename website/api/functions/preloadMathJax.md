# Function: preloadMathJax()

> **preloadMathJax**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathJaxRenderer.ts:153](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/text/MathJaxRenderer.ts#L153)

Pre-load MathJax so the first render is fast.
Call this early (e.g. on page load) if you know LaTeX will be used.

## Returns

`Promise`\<`void`\>
