# Function: texturedSphere()

> **texturedSphere**(`options`): [`TexturedSurface`](../classes/TexturedSurface.md)

Defined in: [mobjects/three-d/TexturedSurface.ts:563](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/three-d/TexturedSurface.ts#L563)

Create a textured sphere -- a common use case for Earth, Moon, etc.

This builds a ParametricSurface sphere internally and wraps it with a
TexturedSurface, returning the ready-to-use mobject.

## Parameters

### options

[`TexturedSphereOptions`](../interfaces/TexturedSphereOptions.md)

## Returns

[`TexturedSurface`](../classes/TexturedSurface.md)

## Example

```typescript
const earth = texturedSphere({
  textureUrl: '/textures/earth_day.jpg',
  darkTextureUrl: '/textures/earth_night.jpg',
  radius: 2,
  lightDirection: [1, 0.5, 0],
});
scene.add(earth);
```
