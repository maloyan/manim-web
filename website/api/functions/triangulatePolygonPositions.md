# Function: triangulatePolygonPositions()

> **triangulatePolygonPositions**(`vertices`, `holes?`, `z?`): `Float32Array`

Defined in: [utils/triangulate.ts:82](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/triangulate.ts#L82)

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
