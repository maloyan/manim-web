# Function: createBezierShaderMaterial()

> **createBezierShaderMaterial**(`options`): `ShaderMaterial`

Defined in: [rendering/BezierShaderMaterial.ts:282](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/rendering/BezierShaderMaterial.ts#L282)

Create a Three.js ShaderMaterial configured for Bezier curve SDF rendering.

The material expects instanced geometry where each instance carries:
  aP0, aP1, aP2, aP3  - cubic Bezier control points (vec3)
  aWidthStart, aWidthEnd - stroke width at t=0 and t=1 (float)
  aColor                 - RGBA color (vec4)

And per-vertex:
  aQuadUV - quad corner coordinate (vec2)

## Parameters

### options

[`BezierShaderMaterialOptions`](../interfaces/BezierShaderMaterialOptions.md) = `{}`

Material configuration

## Returns

`ShaderMaterial`

Configured ShaderMaterial
