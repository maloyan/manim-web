# Function: triangulatePolygon()

> **triangulatePolygon**(`vertices`, `holes?`): `number`[]

Defined in: [utils/triangulate.ts:34](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/utils/triangulate.ts#L34)

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
