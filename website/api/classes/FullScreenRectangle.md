# Class: FullScreenRectangle

Defined in: [mobjects/frame/index.ts:151](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/frame/index.ts#L151)

FullScreenRectangle - A rectangle that covers the entire camera frame

Creates a rectangle sized to match the camera frame dimensions.
Perfect for backgrounds, overlays, and scene-wide effects.

## Example

```typescript
// Create a black background
const bg = new FullScreenRectangle();

// Create a semi-transparent blue overlay
const overlay = new FullScreenRectangle({
  color: '#0000ff',
  fillOpacity: 0.3,
});

// Create a custom-sized full screen for a different camera setup
const customBg = new FullScreenRectangle({
  frameWidth: 16,
  frameHeight: 9,
});
```

## Extends

- [`Rectangle`](Rectangle.md)

## Extended by

- [`FullScreenFadeRectangle`](FullScreenFadeRectangle.md)

## Constructors

### Constructor

> **new FullScreenRectangle**(`options`): `FullScreenRectangle`

Defined in: [mobjects/frame/index.ts:155](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/frame/index.ts#L155)

#### Parameters

##### options

[`FullScreenRectangleOptions`](../interfaces/FullScreenRectangleOptions.md) = `{}`

#### Returns

`FullScreenRectangle`

#### Overrides

[`Rectangle`](Rectangle.md).[`constructor`](Rectangle.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:123](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L123)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Rectangle`](Rectangle.md).[`__savedMobjectState`](Rectangle.md#__savedmobjectstate)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:100](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L100)

Dirty flag indicating transforms need sync

#### Inherited from

[`Rectangle`](Rectangle.md).[`_dirty`](Rectangle.md#_dirty)

***

### \_disableChildZLayering

> `protected` **\_disableChildZLayering**: `boolean` = `false`

Defined in: [core/Mobject.ts:91](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L91)

When true, children skip the 2D z-layering offset in _syncToThree.
 Set this on 3D container objects (e.g. ThreeDAxes) where z-offsets
 would shift objects away from their intended 3D positions.

#### Inherited from

[`Rectangle`](Rectangle.md).[`_disableChildZLayering`](Rectangle.md#_disablechildzlayering)

***

### \_fillMaterial

> `protected` **\_fillMaterial**: `MeshBasicMaterial` = `null`

Defined in: [core/VMobject.ts:47](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L47)

Three.js fill material

#### Inherited from

[`Rectangle`](Rectangle.md).[`_fillMaterial`](Rectangle.md#_fillmaterial)

***

### \_geometryDirty

> `protected` **\_geometryDirty**: `boolean` = `true`

Defined in: [core/VMobject.ts:50](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L50)

Whether geometry needs rebuild (separate from material dirty)

#### Inherited from

[`Rectangle`](Rectangle.md).[`_geometryDirty`](Rectangle.md#_geometrydirty)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Rectangle`](Rectangle.md).[`_opacity`](Rectangle.md#_opacity)

***

### \_points3D

> `protected` **\_points3D**: `number`[][] = `[]`

Defined in: [core/VMobject.ts:38](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L38)

Array of cubic Bezier control points in 3D.
Each point is [x, y, z].
Stored as: [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]

#### Inherited from

[`Rectangle`](Rectangle.md).[`_points3D`](Rectangle.md#_points3d)

***

### \_strokeMaterial

> `protected` **\_strokeMaterial**: `LineMaterial` = `null`

Defined in: [core/VMobject.ts:44](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L44)

Three.js stroke material (Line2 LineMaterial for thick strokes)

#### Inherited from

[`Rectangle`](Rectangle.md).[`_strokeMaterial`](Rectangle.md#_strokematerial)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:94](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L94)

Style properties for backward compatibility

#### Inherited from

[`Rectangle`](Rectangle.md).[`_style`](Rectangle.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:97](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L97)

Three.js backing object

#### Inherited from

[`Rectangle`](Rectangle.md).[`_threeObject`](Rectangle.md#_threeobject)

***

### \_visiblePointCount

> `protected` **\_visiblePointCount**: `number` = `null`

Defined in: [core/VMobject.ts:41](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L41)

Number of points visible (for Create animation)

#### Inherited from

[`Rectangle`](Rectangle.md).[`_visiblePointCount`](Rectangle.md#_visiblepointcount)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Rectangle`](Rectangle.md).[`children`](Rectangle.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`Rectangle`](Rectangle.md).[`fillOpacity`](Rectangle.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Rectangle`](Rectangle.md).[`id`](Rectangle.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Rectangle`](Rectangle.md).[`parent`](Rectangle.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Rectangle`](Rectangle.md).[`position`](Rectangle.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Rectangle`](Rectangle.md).[`rotation`](Rectangle.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:109](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L109)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Rectangle`](Rectangle.md).[`savedState`](Rectangle.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Rectangle`](Rectangle.md).[`scaleVector`](Rectangle.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Rectangle`](Rectangle.md).[`strokeWidth`](Rectangle.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:116](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L116)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Rectangle`](Rectangle.md).[`targetCopy`](Rectangle.md#targetcopy)

***

### useStrokeMesh

> **useStrokeMesh**: `boolean` = `false`

Defined in: [core/VMobject.ts:100](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L100)

When true, render stroke as a mesh ring with miter-joined corners instead
of Line2 for closed paths.  Falls back to Line2 for open/partial paths
(e.g. during Create/Uncreate animations).

#### Inherited from

[`Rectangle`](Rectangle.md).[`useStrokeMesh`](Rectangle.md#usestrokemesh)

***

### \_frameWidth

> `static` **\_frameWidth**: `number` = `14`

Defined in: [core/VMobject.ts:67](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L67)

Camera frame width in world units (set by Scene, for stroke width conversion)

#### Inherited from

[`Rectangle`](Rectangle.md).[`_frameWidth`](Rectangle.md#_framewidth)

***

### \_rendererHeight

> `static` **\_rendererHeight**: `number` = `450`

Defined in: [core/VMobject.ts:64](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L64)

#### Inherited from

[`Rectangle`](Rectangle.md).[`_rendererHeight`](Rectangle.md#_rendererheight)

***

### \_rendererWidth

> `static` **\_rendererWidth**: `number` = `800`

Defined in: [core/VMobject.ts:63](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L63)

Renderer resolution for LineMaterial (set by Scene)

#### Inherited from

[`Rectangle`](Rectangle.md).[`_rendererWidth`](Rectangle.md#_rendererwidth)

***

### useShaderCurves

> `static` **useShaderCurves**: `boolean` = `false`

Defined in: [core/VMobject.ts:84](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L84)

When true, VMobjects use GPU Bezier SDF shaders for stroke rendering
instead of the default Line2/LineMaterial approach. This produces
ManimGL-quality anti-aliased curves with variable stroke width and
round caps. Default: false (opt-in).

#### Inherited from

[`Rectangle`](Rectangle.md).[`useShaderCurves`](Rectangle.md#useshadercurves)

## Accessors

### color

#### Get Signature

> **get** **color**(): `string`

Defined in: [core/Mobject.ts:67](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L67)

##### Returns

`string`

#### Set Signature

> **set** **color**(`value`): `void`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L71)

##### Parameters

###### value

`string`

##### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`color`](Rectangle.md#color)

***

### fillColor

#### Get Signature

> **get** **fillColor**(): `string`

Defined in: [core/Mobject.ts:490](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L490)

Get the fill color

##### Returns

`string`

#### Set Signature

> **set** **fillColor**(`color`): `void`

Defined in: [core/Mobject.ts:497](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L497)

Set the fill color

##### Parameters

###### color

`string`

##### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`fillColor`](Rectangle.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:958](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L958)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Rectangle`](Rectangle.md).[`isDirty`](Rectangle.md#isdirty)

***

### numPoints

#### Get Signature

> **get** **numPoints**(): `number`

Defined in: [core/VMobject.ts:200](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L200)

Get the number of points

##### Returns

`number`

#### Inherited from

[`Rectangle`](Rectangle.md).[`numPoints`](Rectangle.md#numpoints)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/Mobject.ts:150](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L150)

Get the overall opacity of the mobject

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/Mobject.ts:157](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L157)

Set the overall opacity of the mobject

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`opacity`](Rectangle.md#opacity)

***

### points

#### Get Signature

> **get** **points**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:150](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L150)

Get all points as 2D Point objects (derived from _points3D)

##### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`Rectangle`](Rectangle.md).[`points`](Rectangle.md#points)

***

### shaderCurves

#### Get Signature

> **get** **shaderCurves**(): `boolean`

Defined in: [core/VMobject.ts:133](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L133)

Check whether this instance should use shader-based Bezier curve rendering.
Returns the per-instance override if set, otherwise the class-level default.

##### Returns

`boolean`

#### Set Signature

> **set** **shaderCurves**(`value`): `void`

Defined in: [core/VMobject.ts:141](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L141)

Enable or disable shader-based Bezier curve rendering for this instance.
Pass `null` to revert to the class-level VMobject.useShaderCurves default.

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`shaderCurves`](Rectangle.md#shadercurves)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:165](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L165)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Rectangle`](Rectangle.md).[`style`](Rectangle.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:197](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L197)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Rectangle`](Rectangle.md).[`submobjects`](Rectangle.md#submobjects)

***

### visiblePointCount

#### Get Signature

> **get** **visiblePointCount**(): `number`

Defined in: [core/VMobject.ts:207](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L207)

Get the number of visible points (for Create animation)

##### Returns

`number`

#### Set Signature

> **set** **visiblePointCount**(`count`): `void`

Defined in: [core/VMobject.ts:214](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L214)

Set the number of visible points (for Create animation)

##### Parameters

###### count

`number`

##### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`visiblePointCount`](Rectangle.md#visiblepointcount)

## Methods

### \_buildEarcutFillGeometry()

> `protected` **\_buildEarcutFillGeometry**(`points3D`): `BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>

Defined in: [core/VMobject.ts:528](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L528)

Build a THREE.BufferGeometry for the filled region using earcut triangulation.

Earcut handles concave polygons, self-intersecting paths, and holes far
more robustly than Three.js' built-in ShapeGeometry triangulator, which
is a simple ear-clipping implementation that struggles with complex SVG
outlines.

If earcut returns zero triangles (completely degenerate input) we fall
back to THREE.ShapeGeometry so existing simple shapes still render.

#### Parameters

##### points3D

`number`[][]

The visible Bezier control points

#### Returns

`BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>

A BufferGeometry ready for use as a fill mesh, or null if the
         polygon is too degenerate even for fallback.

#### Inherited from

[`Rectangle`](Rectangle.md).[`_buildEarcutFillGeometry`](Rectangle.md#_buildearcutfillgeometry)

***

### \_createCopy()

> `protected` **\_createCopy**(): `FullScreenRectangle`

Defined in: [mobjects/frame/index.ts:214](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/frame/index.ts#L214)

Create a copy of this FullScreenRectangle

#### Returns

`FullScreenRectangle`

#### Overrides

[`Rectangle`](Rectangle.md).[`_createCopy`](Rectangle.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [core/VMobject.ts:697](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L697)

Create the Three.js backing object for this VMobject.
Creates both stroke (using Line2 for thick, smooth strokes) and fill meshes.

#### Returns

`Object3D`

#### Inherited from

[`Rectangle`](Rectangle.md).[`_createThreeObject`](Rectangle.md#_createthreeobject)

***

### \_getBoundingBox()

> `protected` **\_getBoundingBox**(): `object`

Defined in: [core/Mobject.ts:770](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L770)

Get bounding box dimensions
Uses object pooling to avoid allocations in hot paths (performance optimization).

#### Returns

`object`

Object with width, height, and depth

##### depth

> **depth**: `number`

##### height

> **height**: `number`

##### width

> **width**: `number`

#### Inherited from

[`Rectangle`](Rectangle.md).[`_getBoundingBox`](Rectangle.md#_getboundingbox)

***

### \_getEdgeInDirection()

> `protected` **\_getEdgeInDirection**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:753](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L753)

Get the edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to get edge in

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Rectangle`](Rectangle.md).[`_getEdgeInDirection`](Rectangle.md#_getedgeindirection)

***

### \_interpolatePointList3D()

> `protected` **\_interpolatePointList3D**(`points`, `targetCount`): `number`[][]

Defined in: [core/VMobject.ts:405](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L405)

Interpolate a 3D point list to have a specific number of points.

#### Parameters

##### points

`number`[][]

##### targetCount

`number`

#### Returns

`number`[][]

#### Inherited from

[`Rectangle`](Rectangle.md).[`_interpolatePointList3D`](Rectangle.md#_interpolatepointlist3d)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:938](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L938)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`_markDirty`](Rectangle.md#_markdirty)

***

### \_markDirtyUpward()

> **\_markDirtyUpward**(): `void`

Defined in: [core/Mobject.ts:947](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L947)

Mark this mobject and all ancestors as needing sync.
Use when a deep child's geometry changes and the parent tree must re-traverse.
Short-circuits if this node is already dirty (ancestors must be dirty too).

#### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`_markDirtyUpward`](Rectangle.md#_markdirtyupward)

***

### \_pointsToCurvePath()

> `protected` **\_pointsToCurvePath**(): `CurvePath`\<`Vector3`\>

Defined in: [core/VMobject.ts:482](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L482)

Convert points to a THREE.CurvePath for stroke rendering

#### Returns

`CurvePath`\<`Vector3`\>

#### Inherited from

[`Rectangle`](Rectangle.md).[`_pointsToCurvePath`](Rectangle.md#_pointstocurvepath)

***

### \_pointsToShape()

> `protected` **\_pointsToShape**(): `Shape`

Defined in: [core/VMobject.ts:440](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L440)

Convert Bezier control points to a Three.js Shape for filled rendering.

#### Returns

`Shape`

THREE.Shape representing the path

#### Inherited from

[`Rectangle`](Rectangle.md).[`_pointsToShape`](Rectangle.md#_pointstoshape)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [core/VMobject.ts:1276](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L1276)

Sync material properties to Three.js

#### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`_syncMaterialToThree`](Rectangle.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:891](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L891)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`_syncToThree`](Rectangle.md#_synctothree)

***

### \_updateGeometry()

> `protected` **\_updateGeometry**(`group`): `void`

Defined in: [core/VMobject.ts:731](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L731)

Update the geometry within the Three.js group.
Reuses existing Line2 / Mesh objects when possible to avoid expensive
dispose-and-recreate cycles during per-frame animation updates.

When `shaderCurves` is enabled, stroke rendering uses GPU Bezier SDF
shaders via BezierRenderer instead of the Line2 polyline approach.

#### Parameters

##### group

`Group`

#### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`_updateGeometry`](Rectangle.md#_updategeometry)

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:509](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L509)

Add a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to add

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`add`](Rectangle.md#add)

***

### addPoints()

> **addPoints**(...`points`): `this`

Defined in: [core/VMobject.ts:239](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L239)

Add points to this VMobject using 2D Point objects

#### Parameters

##### points

...[`Point`](../interfaces/Point.md)[]

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`addPoints`](Rectangle.md#addpoints)

***

### addPointsAsCorners()

> **addPointsAsCorners**(`corners`): `this`

Defined in: [core/VMobject.ts:294](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L294)

Add straight line segments from the last point to each corner.
Each corner creates a new cubic Bezier segment with linear handles.
Matches Manim's add_points_as_corners.

#### Parameters

##### corners

`number`[][]

Array of [x, y, z] corner points to connect to

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`addPointsAsCorners`](Rectangle.md#addpointsascorners)

***

### addUpdater()

> **addUpdater**(`updater`, `callOnAdd`): `this`

Defined in: [core/Mobject.ts:1006](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1006)

Add an updater function that runs every frame

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

Function called with (mobject, dt) each frame

##### callOnAdd

`boolean` = `false`

Whether to call immediately, default false

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`addUpdater`](Rectangle.md#addupdater)

***

### alignPoints()

> **alignPoints**(`target`): `void`

Defined in: [core/VMobject.ts:385](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L385)

Align points between this VMobject and a target so they have the same count.
This is necessary for smooth morphing animations.

#### Parameters

##### target

[`VMobject`](VMobject.md)

The target VMobject to align with

#### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`alignPoints`](Rectangle.md#alignpoints)

***

### alignTo()

> **alignTo**(`target`, `direction`): `this`

Defined in: [core/Mobject.ts:720](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L720)

Align this mobject with another along an edge

#### Parameters

##### target

The mobject or point to align with

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

The direction/edge to align (e.g., LEFT aligns left edges)

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`alignTo`](Rectangle.md#alignto)

***

### applyFunction()

> **applyFunction**(`fn`): `this`

Defined in: [core/Mobject.ts:1073](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1073)

Apply a point-wise function to every VMobject descendant's control points.
Uses duck-type check for getPoints/setPoints to avoid circular imports.

#### Parameters

##### fn

(`point`) => `number`[]

Function mapping [x, y, z] to [x', y', z']

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`applyFunction`](Rectangle.md#applyfunction)

***

### applyToFamily()

> **applyToFamily**(`func`): `this`

Defined in: [core/Mobject.ts:981](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L981)

Apply a function to this mobject and all descendants

#### Parameters

##### func

(`mobject`) => `void`

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`applyToFamily`](Rectangle.md#applytofamily)

***

### become()

> **become**(`other`): `this`

Defined in: [core/Mobject.ts:580](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L580)

Replace this mobject's visual properties with those of another mobject.
Preserves identity (updaters, scene membership) but copies appearance.

#### Parameters

##### other

[`Mobject`](Mobject.md)

The mobject to copy appearance from

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`become`](Rectangle.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:850](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L850)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`center`](Rectangle.md#center)

***

### clearPoints()

> **clearPoints**(): `this`

Defined in: [core/VMobject.ts:328](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L328)

Clear all points

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`clearPoints`](Rectangle.md#clearpoints)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:1031](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1031)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`clearUpdaters`](Rectangle.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:553](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L553)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`Rectangle`](Rectangle.md).[`copy`](Rectangle.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/VMobject.ts:1380](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L1380)

Clean up Three.js resources

#### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`dispose`](Rectangle.md#dispose)

***

### flip()

> **flip**(`axis`): `this`

Defined in: [core/Mobject.ts:381](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L381)

Flip the mobject along an axis (mirror reflection).

#### Parameters

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis to flip across, defaults to RIGHT ([1,0,0]) for horizontal flip

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`flip`](Rectangle.md#flip)

***

### generateTarget()

> **generateTarget**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:1150](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1150)

Create a copy of this mobject as a target for MoveToTarget animation.
Modify the returned copy, then play `new MoveToTarget(this)` to
smoothly interpolate from the current state to the target.

#### Returns

[`Mobject`](Mobject.md)

The target copy for modification

#### Example

```ts
mob.generateTarget();
mob.targetCopy!.shift([2, 0, 0]);
mob.targetCopy!.setColor('red');
await scene.play(new MoveToTarget(mob));
```

#### Inherited from

[`Rectangle`](Rectangle.md).[`generateTarget`](Rectangle.md#generatetarget)

***

### getArea()

> **getArea**(): `number`

Defined in: [mobjects/geometry/Rectangle.ts:169](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L169)

Get the area of the rectangle

#### Returns

`number`

#### Inherited from

[`Rectangle`](Rectangle.md).[`getArea`](Rectangle.md#getarea)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Rectangle.ts:210](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L210)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Rectangle`](Rectangle.md).[`getBottom`](Rectangle.md#getbottom)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [core/Mobject.ts:657](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L657)

Get the bounding box of this mobject in world coordinates.

#### Returns

`object`

Object with min and max Vector3Tuple

##### max

> **max**: `object`

###### max.x

> **x**: `number`

###### max.y

> **y**: `number`

###### max.z

> **z**: `number`

##### min

> **min**: `object`

###### min.x

> **x**: `number`

###### min.y

> **y**: `number`

###### min.z

> **z**: `number`

#### Inherited from

[`Rectangle`](Rectangle.md).[`getBounds`](Rectangle.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/VMobject.ts:1353](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L1353)

Get the center of this VMobject based on its points.
Uses bounding box center (matching Python Manim's get_center behavior)
rather than point centroid, which is inaccurate for Bezier control points.

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Rectangle`](Rectangle.md).[`getCenter`](Rectangle.md#getcenter)

***

### getCorner()

> **getCorner**(`corner`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Rectangle.ts:183](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L183)

Get a specific corner of the rectangle

#### Parameters

##### corner

`"topLeft"` | `"topRight"` | `"bottomRight"` | `"bottomLeft"`

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Rectangle`](Rectangle.md).[`getCorner`](Rectangle.md#getcorner)

***

### getEdge()

> **getEdge**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:783](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L783)

Get a specific edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to the edge point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Rectangle`](Rectangle.md).[`getEdge`](Rectangle.md#getedge)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:992](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L992)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Rectangle`](Rectangle.md).[`getFamily`](Rectangle.md#getfamily)

***

### getFrameHeight()

> **getFrameHeight**(): `number`

Defined in: [mobjects/frame/index.ts:196](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/frame/index.ts#L196)

Get the frame height

#### Returns

`number`

***

### getFrameWidth()

> **getFrameWidth**(): `number`

Defined in: [mobjects/frame/index.ts:189](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/frame/index.ts#L189)

Get the frame width

#### Returns

`number`

***

### getHeight()

> **getHeight**(): `number`

Defined in: [mobjects/geometry/Rectangle.ts:137](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L137)

Get the height of the rectangle

#### Returns

`number`

#### Inherited from

[`Rectangle`](Rectangle.md).[`getHeight`](Rectangle.md#getheight)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Rectangle.ts:217](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L217)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Rectangle`](Rectangle.md).[`getLeft`](Rectangle.md#getleft)

***

### getPerimeter()

> **getPerimeter**(): `number`

Defined in: [mobjects/geometry/Rectangle.ts:176](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L176)

Get the perimeter of the rectangle

#### Returns

`number`

#### Inherited from

[`Rectangle`](Rectangle.md).[`getPerimeter`](Rectangle.md#getperimeter)

***

### getPoints()

> **getPoints**(): `number`[][]

Defined in: [core/VMobject.ts:193](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L193)

Get all points defining this VMobject as 3D arrays

#### Returns

`number`[][]

Copy of the points array

#### Inherited from

[`Rectangle`](Rectangle.md).[`getPoints`](Rectangle.md#getpoints)

***

### getRectCenter()

> **getRectCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Rectangle.ts:153](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L153)

Get the center of the rectangle

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Rectangle`](Rectangle.md).[`getRectCenter`](Rectangle.md#getrectcenter)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Rectangle.ts:224](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L224)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Rectangle`](Rectangle.md).[`getRight`](Rectangle.md#getright)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:965](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L965)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Rectangle`](Rectangle.md).[`getThreeObject`](Rectangle.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Rectangle.ts:203](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L203)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Rectangle`](Rectangle.md).[`getTop`](Rectangle.md#gettop)

***

### getUnitVector()

> **getUnitVector**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/VMobject.ts:1329](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L1329)

Get the unit vector from the first to the last point of this VMobject,
accounting for the object's current rotation transform.

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Rectangle`](Rectangle.md).[`getUnitVector`](Rectangle.md#getunitvector)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1048](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1048)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Rectangle`](Rectangle.md).[`getUpdaters`](Rectangle.md#getupdaters)

***

### getVisiblePoints()

> **getVisiblePoints**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:223](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L223)

Get points that should be visible (for rendering) as 2D Points

#### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`Rectangle`](Rectangle.md).[`getVisiblePoints`](Rectangle.md#getvisiblepoints)

***

### getVisiblePoints3D()

> **getVisiblePoints3D**(): `number`[][]

Defined in: [core/VMobject.ts:231](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L231)

Get points that should be visible (for rendering) as 3D arrays

#### Returns

`number`[][]

#### Inherited from

[`Rectangle`](Rectangle.md).[`getVisiblePoints3D`](Rectangle.md#getvisiblepoints3d)

***

### getWidth()

> **getWidth**(): `number`

Defined in: [mobjects/geometry/Rectangle.ts:121](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L121)

Get the width of the rectangle

#### Returns

`number`

#### Inherited from

[`Rectangle`](Rectangle.md).[`getWidth`](Rectangle.md#getwidth)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:1040](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1040)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Rectangle`](Rectangle.md).[`hasUpdaters`](Rectangle.md#hasupdaters)

***

### interpolate()

> **interpolate**(`target`, `alpha`): `this`

Defined in: [core/VMobject.ts:342](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L342)

Interpolate this VMobject towards a target VMobject

#### Parameters

##### target

[`VMobject`](VMobject.md)

The target VMobject to interpolate towards

##### alpha

`number`

Progress from 0 (this) to 1 (target)

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`interpolate`](Rectangle.md#interpolate)

***

### matchCamera()

> **matchCamera**(`frameWidth`, `frameHeight`): `this`

Defined in: [mobjects/frame/index.ts:203](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/frame/index.ts#L203)

Update to match new camera frame dimensions

#### Parameters

##### frameWidth

`number`

##### frameHeight

`number`

#### Returns

`this`

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:220](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L220)

Move the mobject to an absolute position, or align with another Mobject.

#### Parameters

##### target

Target position [x, y, z] or Mobject to align with

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### alignedEdge?

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Optional edge direction to align (e.g., UL aligns upper-left edges)

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`moveTo`](Rectangle.md#moveto)

***

### moveToAligned()

> **moveToAligned**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:740](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L740)

Move this mobject to align its center with a point or mobject center

#### Parameters

##### target

Target mobject or point to align with

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### alignedEdge?

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Optional edge to align instead of centers

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`moveToAligned`](Rectangle.md#movetoaligned)

***

### nextTo()

> **nextTo**(`target`, `direction`, `buff`): `this`

Defined in: [core/Mobject.ts:684](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L684)

Position this mobject next to another mobject

#### Parameters

##### target

The mobject to position next to

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `RIGHT`

Direction from target (e.g., RIGHT, UP)

##### buff

`number` = `0.25`

Buffer distance between mobjects, default 0.25

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`nextTo`](Rectangle.md#nextto)

***

### prepareForNonlinearTransform()

> **prepareForNonlinearTransform**(`numPieces`): `this`

Defined in: [core/Mobject.ts:1096](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1096)

Subdivide every VMobject descendant's cubic Bezier curves so that non-linear
transforms produce smooth results. Each cubic segment is split into n sub-segments
via de Casteljau evaluation.

#### Parameters

##### numPieces

`number` = `50`

Number of sub-segments per original cubic segment (default 50)

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`prepareForNonlinearTransform`](Rectangle.md#preparefornonlineartransform)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:534](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L534)

Remove a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`remove`](Rectangle.md#remove)

***

### removeUpdater()

> **removeUpdater**(`updater`): `this`

Defined in: [core/Mobject.ts:1019](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1019)

Remove an updater function

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

The updater function to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`removeUpdater`](Rectangle.md#removeupdater)

***

### replace()

> **replace**(`target`, `stretch`): `this`

Defined in: [core/Mobject.ts:612](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L612)

Scale and reposition this mobject to match another mobject's bounding box.
Matches Manim Python's replace() behavior.

#### Parameters

##### target

[`Mobject`](Mobject.md)

The mobject whose bounding box to match

##### stretch

`boolean` = `false`

If true, stretch per-axis to match exactly; if false (default), uniform scale to match width

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`replace`](Rectangle.md#replace)

***

### restoreState()

> **restoreState**(): `boolean`

Defined in: [core/Mobject.ts:1196](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1196)

Restore this mobject to its previously saved state (from saveState).
Uses the deep copy stored on `this.savedState` to restore all properties.

#### Returns

`boolean`

true if state was restored, false if no saved state exists

#### Inherited from

[`Rectangle`](Rectangle.md).[`restoreState`](Rectangle.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axisOrOptions?`): `this`

Defined in: [core/Mobject.ts:250](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L250)

Rotate the mobject around an axis
Uses object pooling to avoid allocations in hot paths (performance optimization).

#### Parameters

##### angle

`number`

Rotation angle in radians

##### axisOrOptions?

Axis of rotation [x, y, z] (defaults to Z axis), or options object

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) | \{ `aboutPoint?`: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md); `axis?`: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md); \}

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`rotate`](Rectangle.md#rotate)

***

### rotateAboutOrigin()

> **rotateAboutOrigin**(`angle`, `axis`): `this`

Defined in: [core/Mobject.ts:372](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L372)

Rotate the mobject about the coordinate origin [0, 0, 0].

#### Parameters

##### angle

`number`

Rotation angle in radians

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis of rotation (defaults to Z axis [0, 0, 1])

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`rotateAboutOrigin`](Rectangle.md#rotateaboutorigin)

***

### saveState()

> **saveState**(): `this`

Defined in: [core/Mobject.ts:1171](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1171)

Save the current state of this mobject so it can be restored later.
Stores a deep copy on `this.savedState` (for Restore animation
compatibility) and a serializable snapshot on `this.__savedMobjectState`
(for restoreState).

#### Returns

`this`

this for chaining

#### Example

```ts
mob.saveState();
mob.shift([2, 0, 0]);
mob.setColor('red');
mob.restoreState(); // back to original position and color
```

#### Inherited from

[`Rectangle`](Rectangle.md).[`saveState`](Rectangle.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Mobject.ts:395](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L395)

Scale the mobject uniformly or non-uniformly

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`scale`](Rectangle.md#scale)

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/Mobject.ts:415](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L415)

Set the mobject's color
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### color

`string`

CSS color string

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`setColor`](Rectangle.md#setcolor)

***

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/Mobject.ts:477](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L477)

Set the fill color and/or opacity (Manim Python parity: set_fill)

#### Parameters

##### color?

`string`

CSS color string (optional)

##### opacity?

`number`

Fill opacity 0-1 (optional)

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`setFill`](Rectangle.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:461](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L461)

Set the fill opacity
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### opacity

`number`

Fill opacity (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`setFillOpacity`](Rectangle.md#setfillopacity)

***

### setHeight()

> **setHeight**(`value`): `this`

Defined in: [mobjects/geometry/Rectangle.ts:144](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L144)

Set the height of the rectangle

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`setHeight`](Rectangle.md#setheight)

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:429](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L429)

Set the mobject's overall opacity
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### opacity

`number`

Opacity value (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`setOpacity`](Rectangle.md#setopacity)

***

### setPoints()

> **setPoints**(`points`): `this`

Defined in: [core/VMobject.ts:160](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L160)

Set the points defining this VMobject.
Accepts either Point[] ({x, y} objects) or number[][] ([x, y, z] arrays).

#### Parameters

##### points

Array of points in either format

`number`[][] | [`Point`](../interfaces/Point.md)[]

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`setPoints`](Rectangle.md#setpoints)

***

### setPoints3D()

> **setPoints3D**(`points`): `this`

Defined in: [core/VMobject.ts:185](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L185)

Set the points defining this VMobject using 3D arrays (alias for setPoints with number[][])

#### Parameters

##### points

`number`[][]

Array of [x, y, z] control points for cubic Bezier curves

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`setPoints3D`](Rectangle.md#setpoints3d)

***

### setPointsAsCorners()

> **setPointsAsCorners**(`corners`): `this`

Defined in: [core/VMobject.ts:253](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L253)

Set the points to form straight line segments between corner points.
Each pair of consecutive corners becomes a cubic Bezier with linear handles.
Matches Manim's set_points_as_corners.

#### Parameters

##### corners

`number`[][]

Array of [x, y, z] corner points

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`setPointsAsCorners`](Rectangle.md#setpointsascorners)

***

### setRectCenter()

> **setRectCenter**(`value`): `this`

Defined in: [mobjects/geometry/Rectangle.ts:160](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L160)

Set the center of the rectangle

#### Parameters

##### value

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`setRectCenter`](Rectangle.md#setrectcenter)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Mobject.ts:445](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L445)

Set the stroke width for outlines
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### width

`number`

Stroke width in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`setStrokeWidth`](Rectangle.md#setstrokewidth)

***

### setStyle()

> **setStyle**(`style`): `this`

Defined in: [core/Mobject.ts:172](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L172)

Set style properties

#### Parameters

##### style

`Partial`\<[`MobjectStyle`](../interfaces/MobjectStyle.md)\>

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`setStyle`](Rectangle.md#setstyle)

***

### setWidth()

> **setWidth**(`value`): `this`

Defined in: [mobjects/geometry/Rectangle.ts:128](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Rectangle.ts#L128)

Set the width of the rectangle

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`setWidth`](Rectangle.md#setwidth)

***

### setX()

> **setX**(`x`): `this`

Defined in: [core/Mobject.ts:823](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L823)

Set the x-coordinate of this mobject's center, preserving y and z.
Matches Manim Python's set_x() behavior.

#### Parameters

##### x

`number`

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`setX`](Rectangle.md#setx)

***

### setY()

> **setY**(`y`): `this`

Defined in: [core/Mobject.ts:832](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L832)

Set the y-coordinate of this mobject's center, preserving x and z.
Matches Manim Python's set_y() behavior.

#### Parameters

##### y

`number`

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`setY`](Rectangle.md#sety)

***

### setZ()

> **setZ**(`z`): `this`

Defined in: [core/Mobject.ts:841](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L841)

Set the z-coordinate of this mobject's center, preserving x and y.
Matches Manim Python's set_z() behavior.

#### Parameters

##### z

`number`

#### Returns

`this`

#### Inherited from

[`Rectangle`](Rectangle.md).[`setZ`](Rectangle.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Mobject.ts:206](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L206)

Translate the mobject by a delta

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`shift`](Rectangle.md#shift)

***

### toCorner()

> **toCorner**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:884](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L884)

Move to a corner of the frame

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `UR`

Corner direction (e.g., UR for upper right)

##### buff

`number` = `0.5`

Buffer from edges

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`toCorner`](Rectangle.md#tocorner)

***

### toEdge()

> **toEdge**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:860](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L860)

Move to the edge of the frame

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to move towards

##### buff

`number` = `0.5`

Buffer from edge

#### Returns

`this`

this for chaining

#### Inherited from

[`Rectangle`](Rectangle.md).[`toEdge`](Rectangle.md#toedge)

***

### update()

> **update**(`dt`): `void`

Defined in: [core/Mobject.ts:1057](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1057)

Run all updaters with given dt
Called by Scene during render loop

#### Parameters

##### dt

`number`

Delta time in seconds since last frame

#### Returns

`void`

#### Inherited from

[`Rectangle`](Rectangle.md).[`update`](Rectangle.md#update)

***

### \_toLinewidth()

> `static` **\_toLinewidth**(`strokeWidth`): `number`

Defined in: [core/VMobject.ts:74](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/VMobject.ts#L74)

Convert Manim-compatible strokeWidth to LineMaterial linewidth in pixels.
Python Manim uses cairo_line_width_multiple=0.01, so:
  linewidth_px = strokeWidth * 0.01 * (rendererWidth / frameWidth)

#### Parameters

##### strokeWidth

`number`

#### Returns

`number`

#### Inherited from

[`Rectangle`](Rectangle.md).[`_toLinewidth`](Rectangle.md#_tolinewidth)
