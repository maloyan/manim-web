# Interface: SkeletonizeOptions

Defined in: [utils/skeletonize.ts:21](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/skeletonize.ts#L21)

Glyph Skeletonization — Medial Axis Extraction via Zhang-Suen Thinning

Converts a glyph's cubic Bezier outline into center-line paths that
represent the natural pen strokes of the character. The algorithm:

1. Rasterizes the glyph outline to a binary grid (filled / empty)
2. Applies the Zhang-Suen thinning algorithm to extract a 1-pixel skeleton
3. Traces skeleton pixels into ordered path chains
4. Smooths the paths using Catmull-Rom interpolation
5. Fits cubic Bezier curves to the smooth paths

The output format matches VMobject's control point convention:
  [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]

## Properties

### gridResolution?

> `optional` **gridResolution**: `number`

Defined in: [utils/skeletonize.ts:23](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/skeletonize.ts#L23)

Grid resolution (pixels along the longest glyph dimension). Default: 100

***

### minChainLength?

> `optional` **minChainLength**: `number`

Defined in: [utils/skeletonize.ts:27](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/skeletonize.ts#L27)

Minimum chain length in pixels to keep. Default: 3

***

### smoothSubdivisions?

> `optional` **smoothSubdivisions**: `number`

Defined in: [utils/skeletonize.ts:25](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/skeletonize.ts#L25)

Smoothing subdivisions per traced segment (Catmull-Rom). Default: 4
