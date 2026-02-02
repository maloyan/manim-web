# Interface: TexturedSurfaceOptions

Defined in: [mobjects/three-d/TexturedSurface.ts:9](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L9)

Options for creating a TexturedSurface

## Properties

### darkTextureUrl?

> `optional` **darkTextureUrl**: `string`

Defined in: [mobjects/three-d/TexturedSurface.ts:15](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L15)

Optional URL of a secondary (dark/night) texture for day/night blending

***

### doubleSided?

> `optional` **doubleSided**: `boolean`

Defined in: [mobjects/three-d/TexturedSurface.ts:25](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L25)

Whether to render both sides. Default: true

***

### lightDirection?

> `optional` **lightDirection**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/TexturedSurface.ts:17](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L17)

Light direction vector for day/night blending. Default: [1, 0, 0] (from +X)

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [mobjects/three-d/TexturedSurface.ts:19](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L19)

Opacity from 0 to 1. Default: 1

***

### surface

> **surface**: [`Surface3D`](../classes/Surface3D.md)

Defined in: [mobjects/three-d/TexturedSurface.ts:11](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L11)

The parametric surface to apply the texture to

***

### textureOffset?

> `optional` **textureOffset**: \[`number`, `number`\]

Defined in: [mobjects/three-d/TexturedSurface.ts:23](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L23)

Texture offset in [u, v]. Default: [0, 0]

***

### textureRepeat?

> `optional` **textureRepeat**: \[`number`, `number`\]

Defined in: [mobjects/three-d/TexturedSurface.ts:21](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L21)

Texture repeat in [u, v]. Default: [1, 1]

***

### textureUrl

> **textureUrl**: `string`

Defined in: [mobjects/three-d/TexturedSurface.ts:13](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L13)

URL of the primary texture image
