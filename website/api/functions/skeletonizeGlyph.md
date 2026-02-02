# Function: skeletonizeGlyph()

> **skeletonizeGlyph**(`outlinePoints`, `options`): `number`[][]

Defined in: [utils/skeletonize.ts:40](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/skeletonize.ts#L40)

Extract the medial-axis (skeleton) of a glyph outline as cubic Bezier
control points compatible with VMobject.

## Parameters

### outlinePoints

`number`[][]

Cubic Bezier control points from GlyphVMobject:
  [anchor1, handle1, handle2, anchor2, ...]  where each point is [x, y, z].

### options

[`SkeletonizeOptions`](../interfaces/SkeletonizeOptions.md) = `{}`

Tuning parameters.

## Returns

`number`[][]

Array of cubic Bezier control points tracing the skeleton center-line,
  or an empty array if the glyph has no interior (e.g. a dot or very thin glyph).
