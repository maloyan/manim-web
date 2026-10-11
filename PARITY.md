# ManimCE Parity

This document records the public API coverage of manim-web against ManimCE
0.22.0. Update it when you add or remove a public symbol.

## Headline numbers

| Metric                                              | Count                  |
| --------------------------------------------------- | ---------------------- |
| Total ManimCE public symbols                        | 685                    |
| EXISTS (ported)                                     | 429                    |
| MISSING (feasible, not yet ported)                  | 0                      |
| INFEASIBLE (out of scope for the browser port)      | 256                    |
| **Feasible coverage** = EXISTS / (EXISTS + MISSING) | **429 / 429 = 100.0%** |

Every feasible ManimCE public symbol is ported. The 256 INFEASIBLE symbols are
the CLI, the config system, the Cairo and OpenGL renderers, file and sound
writers, caching, hashing, and other host-side helpers that a browser port
cannot run.

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

None. Every feasible ManimCE 0.22.0 public symbol has a manim-web export.

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
- `Typst`, `MathTypst` (`mobject/text/typst_mobject.py`) - ported through a
  lazy-loaded WASM build of the Typst compiler (`@myriaddreamin/typst.ts`). The
  compiler loads on first render through a dynamic `import()`, so the base
  bundle and the Docs build stay light. Compile is async (CE's SVG import is
  sync), so the mobject exposes a ready promise.
