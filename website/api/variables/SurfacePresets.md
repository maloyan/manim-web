# Variable: SurfacePresets

> `const` **SurfacePresets**: `object`

Defined in: [mobjects/three-d/ParametricSurface.ts:79](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/ParametricSurface.ts#L79)

Helper function to create common parametric surfaces

## Type Declaration

### helicoid()

> **helicoid**(`radius`, `pitch`, `options`): [`ParametricSurface`](../classes/ParametricSurface.md)

Create a helicoid surface

#### Parameters

##### radius

`number` = `1`

##### pitch

`number` = `0.5`

##### options

`Partial`\<`Omit`\<[`Surface3DOptions`](../interfaces/Surface3DOptions.md), `"func"`\>\> = `{}`

#### Returns

[`ParametricSurface`](../classes/ParametricSurface.md)

### mobiusStrip()

> **mobiusStrip**(`radius`, `width`, `options`): [`ParametricSurface`](../classes/ParametricSurface.md)

Create a mobius strip surface

#### Parameters

##### radius

`number` = `1`

##### width

`number` = `0.5`

##### options

`Partial`\<`Omit`\<[`Surface3DOptions`](../interfaces/Surface3DOptions.md), `"func"`\>\> = `{}`

#### Returns

[`ParametricSurface`](../classes/ParametricSurface.md)

### paraboloid()

> **paraboloid**(`scale`, `options`): [`ParametricSurface`](../classes/ParametricSurface.md)

Create a paraboloid surface

#### Parameters

##### scale

`number` = `1`

##### options

`Partial`\<`Omit`\<[`Surface3DOptions`](../interfaces/Surface3DOptions.md), `"func"`\>\> = `{}`

#### Returns

[`ParametricSurface`](../classes/ParametricSurface.md)

### saddle()

> **saddle**(`scale`, `options`): [`ParametricSurface`](../classes/ParametricSurface.md)

Create a saddle surface (hyperbolic paraboloid)

#### Parameters

##### scale

`number` = `1`

##### options

`Partial`\<`Omit`\<[`Surface3DOptions`](../interfaces/Surface3DOptions.md), `"func"`\>\> = `{}`

#### Returns

[`ParametricSurface`](../classes/ParametricSurface.md)

### sphere()

> **sphere**(`radius`, `options`): [`ParametricSurface`](../classes/ParametricSurface.md)

Create a sphere surface

#### Parameters

##### radius

`number` = `1`

##### options

`Partial`\<`Omit`\<[`Surface3DOptions`](../interfaces/Surface3DOptions.md), `"func"`\>\> = `{}`

#### Returns

[`ParametricSurface`](../classes/ParametricSurface.md)

### torus()

> **torus**(`majorRadius`, `minorRadius`, `options`): [`ParametricSurface`](../classes/ParametricSurface.md)

Create a torus surface

#### Parameters

##### majorRadius

`number` = `1`

##### minorRadius

`number` = `0.3`

##### options

`Partial`\<`Omit`\<[`Surface3DOptions`](../interfaces/Surface3DOptions.md), `"func"`\>\> = `{}`

#### Returns

[`ParametricSurface`](../classes/ParametricSurface.md)
