# Type Alias: TexRenderer

> **TexRenderer** = `"katex"` \| `"mathjax"` \| `"auto"`

Defined in: [mobjects/text/MathTex.ts:28](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MathTex.ts#L28)

Which renderer to use for LaTeX.
- 'katex'  : KaTeX only (fast, but limited LaTeX subset)
- 'mathjax': MathJax SVG only (slower, full LaTeX support)
- 'auto'   : Try KaTeX first; if it throws, fall back to MathJax
