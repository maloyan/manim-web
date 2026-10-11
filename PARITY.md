# ManimCE Parity

This document records the public API coverage of manim-web against ManimCE
0.22.0. Update it when you add or remove a public symbol.

## Headline numbers

| Metric                                              | Count                 |
| --------------------------------------------------- | --------------------- |
| Total ManimCE public symbols                        | 685                   |
| EXISTS (ported)                                     | 427                   |
| MISSING (feasible, not yet ported)                  | 2                     |
| INFEASIBLE (out of scope for the browser port)      | 256                   |
| **Feasible coverage** = EXISTS / (EXISTS + MISSING) | **427 / 429 = 99.5%** |

Every feasible ManimCE symbol is ported except the two Typst symbols below. If
the Typst typesetter counts as INFEASIBLE (it needs a bundled WASM engine, like
the native renderers), feasible coverage is 100%.

## Methodology

The matcher compares the public symbols that manim-web re-exports from
`src/index.ts` and `src/constants/colors.ts` against the full set of ManimCE
0.22.0 `__all__` names (685 symbols, parsed from a fresh clone). A ManimCE name
counts as EXISTS when a manim-web export matches it after case-folding and
underscore removal. For example ManimCE `compass_directions` matches manim-web
`compassDirections`, and a renamed class counts through its `as` alias, so
`export { Surface3D as Surface }` satisfies ManimCE `Surface`.

A symbol is INFEASIBLE when its whole module is out of scope for a browser port
(the CLI, the config system, the Cairo and OpenGL renderers, file and sound
writers, caching, hashing, and other host-side helpers), or when the symbol
itself needs a native renderer or a Python runtime. INFEASIBLE symbols are
excluded from the coverage ratio.

## Remaining feasible-missing symbols

- `Typst`, `MathTypst` (`mobject/text/typst_mobject.py`) - a Typst mobject needs
  a Typst typesetting engine. In the browser that means bundling a multi-megabyte
  WASM build of the Typst compiler. This is out of scope for the lightweight
  port, the same way the Cairo and OpenGL renderers are. A future opt-in package
  could add it. LaTeX math already works through `MathTex` / `MathTexImage`.

## Notes on adapted ports

A few symbols are ported with a documented adaptation rather than a line-for-line
copy, because the browser port differs from the Python/OpenGL original:

- `ManimColor`, `HSV`, `RGBA`, `RandomColorGenerator`, `getShadedRgb`,
  `ParsableManimColor`, `ManimColorDType` (`utils/color/core.py`) - ported as a
  class layer in `src/utils/ManimColor.ts`. `ManimColor.toHex()` stays
  interoperable with the repo's CSS-string color model. `RandomColorGenerator`
  is deterministic per seed but uses `mulberry32`, not CPython's Mersenne
  Twister, so it does not reproduce CE's exact sequence.
- `CoordinateSystem` (`mobject/graphing/coordinate_systems.py`) - ported as a TS
  interface that `Axes` implements (and `NumberPlane` inherits), rather than a
  new base class, to avoid refactoring the `Axes extends Group` hierarchy.
- `LinearBase`, `LogBase` (`mobject/graphing/scale.py`) - standalone scale
  strategy classes matching CE's `_ScaleBase` surface.
- `overrideAnimate` (`mobject/mobject.py`) - a registration function, not a
  Python method decorator, since the repo's `.animate` proxy uses no TS
  decorators.
- `registerFont` (`mobject/text/text_mobject.py`) - uses the browser CSS Font
  Loading API (`FontFace` + `document.fonts`), and no-ops safely in Node / SSR.
- `get3dVmob*` (`mobject/three_d/three_d_utils.py`) - ported as pure functions
  over the shared-anchor cubic point chain.
