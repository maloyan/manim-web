# ManimCE Parity

This document records the public API coverage of manim-web against ManimCE
0.22.0. Update it when you add or remove a public symbol.

## Headline numbers

| Metric | Count |
| --- | --- |
| Total ManimCE public symbols | 685 |
| EXISTS (ported) | 403 |
| MISSING (feasible, not yet ported) | 25 |
| INFEASIBLE (out of scope for the browser port) | 257 |
| **Feasible coverage** = EXISTS / (EXISTS + MISSING) | **403 / 428 = 94.2%** |

## Methodology

The matcher compares the public symbols that manim-web re-exports from
`src/index.ts` and `src/constants/colors.ts` against the full set of ManimCE
0.22.0 `__all__` names (`scratchpad/manimce_all.json`). A ManimCE name counts
as EXISTS when a manim-web export matches it after case-folding and underscore
removal. For example ManimCE `compass_directions` matches manim-web
`compassDirections`, and a renamed class counts through its `as` alias, so
`export { Surface3D as Surface }` satisfies ManimCE `Surface`.

A symbol is INFEASIBLE when its whole module is out of scope for a browser
port (the CLI, the config system, the Cairo and OpenGL renderers, file and
sound writers, caching, hashing, and other host-side helpers) or when the
symbol itself needs a renderer or a Python runtime. INFEASIBLE symbols are
excluded from the coverage ratio.

The remaining feasible-missing symbols are the 25 listed below.

## Remaining feasible-missing symbols

### Heavy dependencies

These need a large subsystem that manim-web does not have.

- `Typst`, `MathTypst` (`mobject/text/typst_mobject.py`) - need a Typst
  compiler.
- `register_font` (`mobject/text/text_mobject.py`) - needs host font
  registration; the browser loads fonts through CSS instead.
- `ManimColor`, `ManimColorDType`, `ParsableManimColor`,
  `RandomColorGenerator`, `get_shaded_rgb`, `HSV`, `RGBA`
  (`utils/color/core.py`) - need the full ManimColor value type. manim-web uses
  plain CSS color strings, so this is a color-model rewrite.

### Base-class refactors

These need a shared base class or a metaclass that manim-web does not yet model.

- `CoordinateSystem` (`mobject/graphing/coordinate_systems.py`) - the base class
  behind `Axes` and `NumberPlane`.
- `LogBase`, `LinearBase` (`mobject/graphing/scale.py`) - the axis scale types.
- `override_animate` (`mobject/mobject.py`) - the `@override_animate` decorator
  hook on the animation builder.
- `SpecialThreeDScene` (`scene/three_d_scene.py`) - a Scene subclass with 3D
  defaults.

### Internal 3D helpers

`mobject/three_d/three_d_utils.py` module-private helpers that only the OpenGL
3D mobjects call. manim-web renders 3D through Three.js, so these have no
caller.

- `get_3d_vmob_gradient_start_and_end_points`
- `get_3d_vmob_start_corner_index`
- `get_3d_vmob_end_corner_index`
- `get_3d_vmob_start_corner`
- `get_3d_vmob_end_corner`
- `get_3d_vmob_unit_normal`
- `get_3d_vmob_start_corner_unit_normal`
- `get_3d_vmob_end_corner_unit_normal`

### Other

- `ArcPolygonFromArcs` (`mobject/geometry/arc.py`) - needs the VMobject point
  methods `append_points` and `insert_n_curves`, which manim-web does not
  expose yet. Port those first.
- `assert_is_mobject_method`
  (`animation/updaters/mobject_update_utils.py`) - an internal assertion helper
  for updater decorators.
