# Function: skeletonizeGlyph()

> **skeletonizeGlyph**(`outlinePoints`, `options`): `number`[][]

Defined in: [utils/skeletonize.ts:40](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/utils/skeletonize.ts#L40)

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
