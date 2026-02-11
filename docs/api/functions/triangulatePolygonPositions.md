# Function: triangulatePolygonPositions()

> **triangulatePolygonPositions**(`vertices`, `holes?`, `z?`): `Float32Array`

Defined in: [utils/triangulate.ts:82](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/utils/triangulate.ts#L82)

Triangulate a polygon and return a flat Float32Array of triangle positions
suitable for use as a Three.js BufferGeometry position attribute.

## Parameters

### vertices

`number`[][]

Outer ring [x, y] pairs

### holes?

`number`[][]

Optional hole rings

### z?

`number` = `0`

Z coordinate to assign to every output vertex (default 0)

## Returns

`Float32Array`

Float32Array of xyz triplets (length = numTriangles * 9), or an
         empty Float32Array for degenerate input.
