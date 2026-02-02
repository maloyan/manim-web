# Interface: TexturedSphereOptions

Defined in: [mobjects/three-d/TexturedSurface.ts:31](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L31)

Options for the texturedSphere convenience factory

## Properties

### center?

> `optional` **center**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/TexturedSurface.ts:39](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L39)

Center position [x, y, z]. Default: [0, 0, 0]

***

### darkTextureUrl?

> `optional` **darkTextureUrl**: `string`

Defined in: [mobjects/three-d/TexturedSurface.ts:35](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L35)

Optional URL of a secondary (dark/night) texture

***

### lightDirection?

> `optional` **lightDirection**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/TexturedSurface.ts:45](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L45)

Light direction for day/night blending. Default: [1, 0, 0]

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [mobjects/three-d/TexturedSurface.ts:43](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L43)

Opacity from 0 to 1. Default: 1

***

### radius?

> `optional` **radius**: `number`

Defined in: [mobjects/three-d/TexturedSurface.ts:37](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L37)

Radius of the sphere. Default: 1

***

### resolution?

> `optional` **resolution**: `number`

Defined in: [mobjects/three-d/TexturedSurface.ts:41](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L41)

Number of segments in each direction. Default: 64

***

### textureOffset?

> `optional` **textureOffset**: \[`number`, `number`\]

Defined in: [mobjects/three-d/TexturedSurface.ts:49](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L49)

Texture offset in [u, v]. Default: [0, 0]

***

### textureRepeat?

> `optional` **textureRepeat**: \[`number`, `number`\]

Defined in: [mobjects/three-d/TexturedSurface.ts:47](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L47)

Texture repeat in [u, v]. Default: [1, 1]

***

### textureUrl

> **textureUrl**: `string`

Defined in: [mobjects/three-d/TexturedSurface.ts:33](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L33)

URL of the primary texture image
