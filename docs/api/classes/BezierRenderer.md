# Class: BezierRenderer

Defined in: [rendering/BezierRenderer.ts:86](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L86)

## Constructors

### Constructor

> **new BezierRenderer**(`options`): `BezierRenderer`

Defined in: [rendering/BezierRenderer.ts:90](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L90)

#### Parameters

##### options

[`BezierRendererOptions`](../interfaces/BezierRendererOptions.md) = `{}`

#### Returns

`BezierRenderer`

## Accessors

### material

#### Get Signature

> **get** **material**(): `ShaderMaterial`

Defined in: [rendering/BezierRenderer.ts:107](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L107)

Access the underlying ShaderMaterial (e.g. to update uniforms).

##### Returns

`ShaderMaterial`

## Methods

### buildMesh()

> **buildMesh**(`points`, `strokeWidth`, `color`, `opacity`, `strokeWidthEnd?`): `Mesh`

Defined in: [rendering/BezierRenderer.ts:259](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L259)

Convenience: build a mesh directly from VMobject-style data.

#### Parameters

##### points

`number`[][]

Cubic Bezier control points (from VMobject.getVisiblePoints3D())

##### strokeWidth

`number`

Stroke width

##### color

`string` = `'#ffffff'`

CSS color string

##### opacity

`number` = `1`

Opacity 0..1

##### strokeWidthEnd?

`number`

End stroke width for tapering (optional)

#### Returns

`Mesh`

THREE.Mesh

***

### buildMeshFromSegments()

> **buildMeshFromSegments**(`segments`): `Mesh`

Defined in: [rendering/BezierRenderer.ts:192](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L192)

Build an InstancedMesh for the given Bezier segments.

#### Parameters

##### segments

[`BezierSegment`](../interfaces/BezierSegment.md)[]

Array of BezierSegment

#### Returns

`Mesh`

THREE.Mesh using InstancedBufferGeometry

***

### dispose()

> **dispose**(): `void`

Defined in: [rendering/BezierRenderer.ts:361](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L361)

Dispose the shared material. Call when the renderer is no longer needed.

#### Returns

`void`

***

### updateMesh()

> **updateMesh**(`mesh`, `points`, `strokeWidth`, `color`, `opacity`, `strokeWidthEnd?`): `Mesh`

Defined in: [rendering/BezierRenderer.ts:344](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L344)

Convenience: update from VMobject-style data.

#### Parameters

##### mesh

`Mesh`

##### points

`number`[][]

##### strokeWidth

`number`

##### color

`string` = `'#ffffff'`

##### opacity

`number` = `1`

##### strokeWidthEnd?

`number`

#### Returns

`Mesh`

***

### updateMeshFromSegments()

> **updateMeshFromSegments**(`mesh`, `segments`): `Mesh`

Defined in: [rendering/BezierRenderer.ts:280](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L280)

Update an existing mesh's instance data without reallocating geometry
(when segment count is the same) or rebuild if count differs.

#### Parameters

##### mesh

`Mesh`

Previously built mesh

##### segments

[`BezierSegment`](../interfaces/BezierSegment.md)[]

New segment data

#### Returns

`Mesh`

The (possibly new) mesh

***

### updateResolution()

> **updateResolution**(`width`, `height`, `pixelRatio?`): `void`

Defined in: [rendering/BezierRenderer.ts:114](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L114)

Update renderer resolution. Call on window/canvas resize.

#### Parameters

##### width

`number`

##### height

`number`

##### pixelRatio?

`number`

#### Returns

`void`

***

### extractSegments()

> `static` **extractSegments**(`points`, `strokeWidth`, `strokeWidthEnd?`, `color?`, `opacity?`): [`BezierSegment`](../interfaces/BezierSegment.md)[]

Defined in: [rendering/BezierRenderer.ts:137](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/rendering/BezierRenderer.ts#L137)

Extract cubic Bezier segments from a VMobject-like object.

VMobject stores points as:
  [anchor0, handle0, handle1, anchor1, handle2, handle3, anchor2, ...]
Each group of 4 consecutive points (stepping by 3) is one cubic segment.

#### Parameters

##### points

`number`[][]

The VMobject's 3D points array

##### strokeWidth

`number`

Uniform stroke width (or start width)

##### strokeWidthEnd?

`number`

End stroke width for variable width. Defaults to strokeWidth.

##### color?

`string` = `'#ffffff'`

CSS color string

##### opacity?

`number` = `1`

Overall opacity 0..1

#### Returns

[`BezierSegment`](../interfaces/BezierSegment.md)[]

Array of BezierSegment
