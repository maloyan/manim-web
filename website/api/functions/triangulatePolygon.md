# Function: triangulatePolygon()

> **triangulatePolygon**(`vertices`, `holes?`): `number`[]

Defined in: [utils/triangulate.ts:34](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/utils/triangulate.ts#L34)

Triangulate a 2D polygon, optionally with holes.

## Parameters

### vertices

`number`[][]

Outer ring as an array of [x, y] pairs (or [x, y, z] --
                  only the first two components are used).

### holes?

`number`[][]

Optional array of hole rings.  Each hole is an array of
                  [x, y] (or [x, y, z]) pairs wound in the opposite
                  direction of the outer ring.

## Returns

`number`[]

Flat array of triangle vertex indices into the combined vertex
         list (outer ring vertices followed by all hole vertices in order).
         Length is always a multiple of 3.  Returns [] for degenerate input.
