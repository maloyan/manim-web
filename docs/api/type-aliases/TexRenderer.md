# Type Alias: TexRenderer

> **TexRenderer** = `"katex"` \| `"mathjax"` \| `"auto"`

Defined in: [mobjects/text/MathTex.ts:28](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/text/MathTex.ts#L28)

Which renderer to use for LaTeX.
- 'katex'  : KaTeX only (fast, but limited LaTeX subset)
- 'mathjax': MathJax SVG only (slower, full LaTeX support)
- 'auto'   : Try KaTeX first; if it throws, fall back to MathJax
