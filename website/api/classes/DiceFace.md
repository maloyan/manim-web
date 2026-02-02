# Class: DiceFace

Defined in: [mobjects/probability/DiceFace.ts:102](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L102)

DiceFace - A square with dots arranged like a standard die face (1-6).

Creates a visual representation of a single die face with configurable
size, dot color, background color, and corner radius. The dots (pips)
follow the standard Western die layout.

## Example

```typescript
// Create a die face showing 5
const face = new DiceFace({ value: 5 });

// Create a smaller red die face showing 3
const redDie = new DiceFace({
  value: 3,
  size: 1,
  backgroundColor: '#CC0000',
  dotColor: WHITE,
});

// Show all six faces in a row
const dice = new VGroup();
for (let i = 1; i <= 6; i++) {
  dice.add(new DiceFace({ value: i }));
}
dice.arrange(RIGHT, 0.3);
```

## Extends

- [`VGroup`](VGroup.md)

## Constructors

### Constructor

> **new DiceFace**(`options`): `DiceFace`

Defined in: [mobjects/probability/DiceFace.ts:119](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L119)

#### Parameters

##### options

[`DiceFaceOptions`](../interfaces/DiceFaceOptions.md) = `{}`

#### Returns

`DiceFace`

#### Overrides

[`VGroup`](VGroup.md).[`constructor`](VGroup.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`VGroup`](VGroup.md).[`__savedMobjectState`](VGroup.md#__savedmobjectstate)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`VGroup`](VGroup.md).[`_dirty`](VGroup.md#_dirty)

***

### \_fillMaterial

> `protected` **\_fillMaterial**: `MeshBasicMaterial` = `null`

Defined in: [core/VMobject.ts:47](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L47)

Three.js fill material

#### Inherited from

[`VGroup`](VGroup.md).[`_fillMaterial`](VGroup.md#_fillmaterial)

***

### \_geometryDirty

> `protected` **\_geometryDirty**: `boolean` = `true`

Defined in: [core/VMobject.ts:50](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L50)

Whether geometry needs rebuild (separate from material dirty)

#### Inherited from

[`VGroup`](VGroup.md).[`_geometryDirty`](VGroup.md#_geometrydirty)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`VGroup`](VGroup.md).[`_opacity`](VGroup.md#_opacity)

***

### \_points3D

> `protected` **\_points3D**: `number`[][] = `[]`

Defined in: [core/VMobject.ts:38](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L38)

Array of cubic Bezier control points in 3D.
Each point is [x, y, z].
Stored as: [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]

#### Inherited from

[`VGroup`](VGroup.md).[`_points3D`](VGroup.md#_points3d)

***

### \_strokeMaterial

> `protected` **\_strokeMaterial**: `LineMaterial` = `null`

Defined in: [core/VMobject.ts:44](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L44)

Three.js stroke material (Line2 LineMaterial for thick strokes)

#### Inherited from

[`VGroup`](VGroup.md).[`_strokeMaterial`](VGroup.md#_strokematerial)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`VGroup`](VGroup.md).[`_style`](VGroup.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`VGroup`](VGroup.md).[`_threeObject`](VGroup.md#_threeobject)

***

### \_visiblePointCount

> `protected` **\_visiblePointCount**: `number` = `null`

Defined in: [core/VMobject.ts:41](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L41)

Number of points visible (for Create animation)

#### Inherited from

[`VGroup`](VGroup.md).[`_visiblePointCount`](VGroup.md#_visiblepointcount)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`VGroup`](VGroup.md).[`children`](VGroup.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`VGroup`](VGroup.md).[`fillOpacity`](VGroup.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`VGroup`](VGroup.md).[`id`](VGroup.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`VGroup`](VGroup.md).[`parent`](VGroup.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`VGroup`](VGroup.md).[`position`](VGroup.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`VGroup`](VGroup.md).[`rotation`](VGroup.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`VGroup`](VGroup.md).[`savedState`](VGroup.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`VGroup`](VGroup.md).[`scaleVector`](VGroup.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`VGroup`](VGroup.md).[`strokeWidth`](VGroup.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`VGroup`](VGroup.md).[`targetCopy`](VGroup.md#targetcopy)

***

### \_rendererHeight

> `static` **\_rendererHeight**: `number` = `450`

Defined in: [core/VMobject.ts:63](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L63)

#### Inherited from

[`VGroup`](VGroup.md).[`_rendererHeight`](VGroup.md#_rendererheight)

***

### \_rendererWidth

> `static` **\_rendererWidth**: `number` = `800`

Defined in: [core/VMobject.ts:62](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L62)

Renderer resolution for LineMaterial (set by Scene)

#### Inherited from

[`VGroup`](VGroup.md).[`_rendererWidth`](VGroup.md#_rendererwidth)

***

### useShaderCurves

> `static` **useShaderCurves**: `boolean` = `false`

Defined in: [core/VMobject.ts:71](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L71)

When true, VMobjects use GPU Bezier SDF shaders for stroke rendering
instead of the default Line2/LineMaterial approach. This produces
ManimGL-quality anti-aliased curves with variable stroke width and
round caps. Default: false (opt-in).

#### Inherited from

[`VGroup`](VGroup.md).[`useShaderCurves`](VGroup.md#useshadercurves)

## Accessors

### color

#### Get Signature

> **get** **color**(): `string`

Defined in: [core/Mobject.ts:67](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L67)

##### Returns

`string`

#### Set Signature

> **set** **color**(`value`): `void`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L71)

##### Parameters

###### value

`string`

##### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`color`](VGroup.md#color)

***

### fillColor

#### Get Signature

> **get** **fillColor**(): `string`

Defined in: [core/Mobject.ts:471](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L471)

Get the fill color

##### Returns

`string`

#### Set Signature

> **set** **fillColor**(`color`): `void`

Defined in: [core/Mobject.ts:478](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L478)

Set the fill color

##### Parameters

###### color

`string`

##### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`fillColor`](VGroup.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:902](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L902)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`VGroup`](VGroup.md).[`isDirty`](VGroup.md#isdirty)

***

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [core/VGroup.ts:485](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L485)

Get the number of vmobjects in this group.

##### Returns

`number`

#### Inherited from

[`VGroup`](VGroup.md).[`length`](VGroup.md#length)

***

### numPoints

#### Get Signature

> **get** **numPoints**(): `number`

Defined in: [core/VMobject.ts:174](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L174)

Get the number of points

##### Returns

`number`

#### Inherited from

[`VGroup`](VGroup.md).[`numPoints`](VGroup.md#numpoints)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/Mobject.ts:145](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L145)

Get the overall opacity of the mobject

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/Mobject.ts:152](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L152)

Set the overall opacity of the mobject

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`opacity`](VGroup.md#opacity)

***

### points

#### Get Signature

> **get** **points**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VGroup.ts:538](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L538)

Get all points from the VGroup as a flat array (override VMobject).
Returns combined points from all children.

##### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`VGroup`](VGroup.md).[`points`](VGroup.md#points)

***

### shaderCurves

#### Get Signature

> **get** **shaderCurves**(): `boolean`

Defined in: [core/VMobject.ts:107](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L107)

Check whether this instance should use shader-based Bezier curve rendering.
Returns the per-instance override if set, otherwise the class-level default.

##### Returns

`boolean`

#### Set Signature

> **set** **shaderCurves**(`value`): `void`

Defined in: [core/VMobject.ts:115](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L115)

Enable or disable shader-based Bezier curve rendering for this instance.
Pass `null` to revert to the class-level VMobject.useShaderCurves default.

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`shaderCurves`](VGroup.md#shadercurves)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`VGroup`](VGroup.md).[`style`](VGroup.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`VGroup`](VGroup.md).[`submobjects`](VGroup.md#submobjects)

***

### visiblePointCount

#### Get Signature

> **get** **visiblePointCount**(): `number`

Defined in: [core/VMobject.ts:181](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L181)

Get the number of visible points (for Create animation)

##### Returns

`number`

#### Set Signature

> **set** **visiblePointCount**(`count`): `void`

Defined in: [core/VMobject.ts:188](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L188)

Set the number of visible points (for Create animation)

##### Parameters

###### count

`number`

##### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`visiblePointCount`](VGroup.md#visiblepointcount)

## Methods

### \_buildEarcutFillGeometry()

> `protected` **\_buildEarcutFillGeometry**(`points3D`): `BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>

Defined in: [core/VMobject.ts:502](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L502)

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

[`VGroup`](VGroup.md).[`_buildEarcutFillGeometry`](VGroup.md#_buildearcutfillgeometry)

***

### \_createCopy()

> `protected` **\_createCopy**(): [`VMobject`](VMobject.md)

Defined in: [mobjects/probability/DiceFace.ts:288](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L288)

Create a copy of this DiceFace.

#### Returns

[`VMobject`](VMobject.md)

#### Overrides

[`VGroup`](VGroup.md).[`_createCopy`](VGroup.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [core/VGroup.ts:463](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L463)

Create the Three.js backing object for this VGroup.
A VGroup is simply a THREE.Group that contains children.

#### Returns

`Object3D`

#### Inherited from

[`VGroup`](VGroup.md).[`_createThreeObject`](VGroup.md#_createthreeobject)

***

### \_getBoundingBox()

> `protected` **\_getBoundingBox**(): `object`

Defined in: [core/Mobject.ts:716](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L716)

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

[`VGroup`](VGroup.md).[`_getBoundingBox`](VGroup.md#_getboundingbox)

***

### \_getEdgeInDirection()

> `protected` **\_getEdgeInDirection**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:699](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L699)

Get the edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to get edge in

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`_getEdgeInDirection`](VGroup.md#_getedgeindirection)

***

### \_interpolatePointList3D()

> `protected` **\_interpolatePointList3D**(`points`, `targetCount`): `number`[][]

Defined in: [core/VMobject.ts:379](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L379)

Interpolate a 3D point list to have a specific number of points.

#### Parameters

##### points

`number`[][]

##### targetCount

`number`

#### Returns

`number`[][]

#### Inherited from

[`VGroup`](VGroup.md).[`_interpolatePointList3D`](VGroup.md#_interpolatepointlist3d)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:882](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L882)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`_markDirty`](VGroup.md#_markdirty)

***

### \_markDirtyUpward()

> **\_markDirtyUpward**(): `void`

Defined in: [core/Mobject.ts:891](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L891)

Mark this mobject and all ancestors as needing sync.
Use when a deep child's geometry changes and the parent tree must re-traverse.
Short-circuits if this node is already dirty (ancestors must be dirty too).

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`_markDirtyUpward`](VGroup.md#_markdirtyupward)

***

### \_pointsToCurvePath()

> `protected` **\_pointsToCurvePath**(): `CurvePath`\<`Vector3`\>

Defined in: [core/VMobject.ts:456](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L456)

Convert points to a THREE.CurvePath for stroke rendering

#### Returns

`CurvePath`\<`Vector3`\>

#### Inherited from

[`VGroup`](VGroup.md).[`_pointsToCurvePath`](VGroup.md#_pointstocurvepath)

***

### \_pointsToShape()

> `protected` **\_pointsToShape**(): `Shape`

Defined in: [core/VMobject.ts:414](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L414)

Convert Bezier control points to a Three.js Shape for filled rendering.

#### Returns

`Shape`

THREE.Shape representing the path

#### Inherited from

[`VGroup`](VGroup.md).[`_pointsToShape`](VGroup.md#_pointstoshape)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [core/VMobject.ts:1014](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L1014)

Sync material properties to Three.js

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`_syncMaterialToThree`](VGroup.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:836](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L836)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`_syncToThree`](VGroup.md#_synctothree)

***

### \_updateGeometry()

> `protected` **\_updateGeometry**(`group`): `void`

Defined in: [core/VMobject.ts:705](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L705)

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

[`VGroup`](VGroup.md).[`_updateGeometry`](VGroup.md#_updategeometry)

***

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<[`VMobject`](VMobject.md)\>

Defined in: [core/VGroup.ts:501](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L501)

Iterate over all vmobjects in the group.

#### Returns

`Iterator`\<[`VMobject`](VMobject.md)\>

#### Inherited from

[`VGroup`](VGroup.md).[`[iterator]`](VGroup.md#iterator)

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/VGroup.ts:56](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L56)

Add mobjects to this group (override from Mobject).

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to add

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`add`](VGroup.md#add)

***

### addPoints()

> **addPoints**(...`points`): `this`

Defined in: [core/VMobject.ts:213](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L213)

Add points to this VMobject using 2D Point objects

#### Parameters

##### points

...[`Point`](../interfaces/Point.md)[]

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`addPoints`](VGroup.md#addpoints)

***

### addPointsAsCorners()

> **addPointsAsCorners**(`corners`): `this`

Defined in: [core/VMobject.ts:268](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L268)

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

[`VGroup`](VGroup.md).[`addPointsAsCorners`](VGroup.md#addpointsascorners)

***

### addUpdater()

> **addUpdater**(`updater`, `callOnAdd`): `this`

Defined in: [core/Mobject.ts:950](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L950)

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

[`VGroup`](VGroup.md).[`addUpdater`](VGroup.md#addupdater)

***

### addVMobjects()

> **addVMobjects**(...`vmobjects`): `this`

Defined in: [core/VGroup.ts:38](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L38)

Add VMobjects to this group.
Accepts VMobjects or arrays of VMobjects.

#### Parameters

##### vmobjects

...([`VMobject`](VMobject.md) \| [`VMobject`](VMobject.md)[])[]

VMobjects to add

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`addVMobjects`](VGroup.md#addvmobjects)

***

### alignPoints()

> **alignPoints**(`target`): `void`

Defined in: [core/VMobject.ts:359](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L359)

Align points between this VMobject and a target so they have the same count.
This is necessary for smooth morphing animations.

#### Parameters

##### target

[`VMobject`](VMobject.md)

The target VMobject to align with

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`alignPoints`](VGroup.md#alignpoints)

***

### alignTo()

> **alignTo**(`target`, `direction`): `this`

Defined in: [core/Mobject.ts:664](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L664)

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

[`VGroup`](VGroup.md).[`alignTo`](VGroup.md#alignto)

***

### applyFunction()

> **applyFunction**(`fn`): `this`

Defined in: [core/Mobject.ts:1017](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1017)

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

[`VGroup`](VGroup.md).[`applyFunction`](VGroup.md#applyfunction)

***

### applyToFamily()

> **applyToFamily**(`func`): `this`

Defined in: [core/Mobject.ts:925](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L925)

Apply a function to this mobject and all descendants

#### Parameters

##### func

(`mobject`) => `void`

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`applyToFamily`](VGroup.md#applytofamily)

***

### arrange()

> **arrange**(`direction`, `buff`, `center`): `this`

Defined in: [core/VGroup.ts:354](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L354)

Arrange children in a row or column with specified spacing.

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `RIGHT`

Direction to arrange (e.g., RIGHT for row, DOWN for column)

##### buff

`number` = `0.25`

Buffer/spacing between children, default 0.25

##### center

`boolean` = `true`

Whether to center the arrangement at the group's position, default true

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`arrange`](VGroup.md#arrange)

***

### arrangeInGrid()

> **arrangeInGrid**(`rows?`, `cols?`, `buffX?`, `buffY?`): `this`

Defined in: [core/VGroup.ts:387](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L387)

Arrange children in a grid layout.

#### Parameters

##### rows?

`number`

Number of rows (if not specified, auto-calculated)

##### cols?

`number`

Number of columns (if not specified, auto-calculated)

##### buffX?

`number` = `0.25`

Horizontal buffer between elements, default 0.25

##### buffY?

`number` = `0.25`

Vertical buffer between elements, default 0.25

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`arrangeInGrid`](VGroup.md#arrangeingrid)

***

### arrangeSubmobjects()

> **arrangeSubmobjects**(`rows?`, `cols?`, `buffX?`, `buffY?`): `this`

Defined in: [core/VGroup.ts:441](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L441)

Arrange children in a submobject grid (alias for arrangeInGrid).

#### Parameters

##### rows?

`number`

##### cols?

`number`

##### buffX?

`number`

##### buffY?

`number`

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`arrangeSubmobjects`](VGroup.md#arrangesubmobjects)

***

### become()

> **become**(`other`): `this`

Defined in: [core/Mobject.ts:561](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L561)

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

[`VGroup`](VGroup.md).[`become`](VGroup.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:797](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L797)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`center`](VGroup.md#center)

***

### clearPoints()

> **clearPoints**(): `this`

Defined in: [core/VMobject.ts:302](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L302)

Clear all points

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`clearPoints`](VGroup.md#clearpoints)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:975](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L975)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`clearUpdaters`](VGroup.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:534](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L534)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`VGroup`](VGroup.md).[`copy`](VGroup.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/VMobject.ts:1104](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L1104)

Clean up Three.js resources

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`dispose`](VGroup.md#dispose)

***

### filter()

> **filter**(`fn`): [`VGroup`](VGroup.md)

Defined in: [core/VGroup.ts:529](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L529)

Filter vmobjects in the group.

#### Parameters

##### fn

(`vmobject`, `index`) => `boolean`

Filter predicate

#### Returns

[`VGroup`](VGroup.md)

New VGroup with filtered vmobjects

#### Inherited from

[`VGroup`](VGroup.md).[`filter`](VGroup.md#filter)

***

### flip()

> **flip**(`axis`): `this`

Defined in: [core/Mobject.ts:364](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L364)

Flip the mobject along an axis (mirror reflection).

#### Parameters

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis to flip across, defaults to RIGHT ([1,0,0]) for horizontal flip

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`flip`](VGroup.md#flip)

***

### forEach()

> **forEach**(`fn`): `this`

Defined in: [core/VGroup.ts:510](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L510)

Apply a function to each vmobject in the group.

#### Parameters

##### fn

(`vmobject`, `index`) => `void`

Function to apply

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`forEach`](VGroup.md#foreach)

***

### generateTarget()

> **generateTarget**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:1085](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1085)

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

[`VGroup`](VGroup.md).[`generateTarget`](VGroup.md#generatetarget)

***

### get()

> **get**(`index`): [`VMobject`](VMobject.md)

Defined in: [core/VGroup.ts:494](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L494)

Get a vmobject by index.

#### Parameters

##### index

`number`

Index of the vmobject

#### Returns

[`VMobject`](VMobject.md)

The vmobject at the given index, or undefined

#### Inherited from

[`VGroup`](VGroup.md).[`get`](VGroup.md#get)

***

### getBackground()

> **getBackground**(): [`RoundedRectangle`](RoundedRectangle.md)

Defined in: [mobjects/probability/DiceFace.ts:228](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L228)

Get the background rectangle.

#### Returns

[`RoundedRectangle`](RoundedRectangle.md)

***

### getBackgroundColor()

> **getBackgroundColor**(): `string`

Defined in: [mobjects/probability/DiceFace.ts:269](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L269)

Get the background color.

#### Returns

`string`

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:746](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L746)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getBottom`](VGroup.md#getbottom)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [core/Mobject.ts:608](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L608)

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

[`VGroup`](VGroup.md).[`getBounds`](VGroup.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/VGroup.ts:137](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L137)

Get the center of the group (average of all children centers).

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getCenter`](VGroup.md#getcenter)

***

### getCombinedPoints()

> **getCombinedPoints**(): `number`[][]

Defined in: [core/VGroup.ts:449](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L449)

Get combined path points from all children.

#### Returns

`number`[][]

Combined array of points from all children

#### Inherited from

[`VGroup`](VGroup.md).[`getCombinedPoints`](VGroup.md#getcombinedpoints)

***

### getDotColor()

> **getDotColor**(): `string`

Defined in: [mobjects/probability/DiceFace.ts:249](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L249)

Get the dot color.

#### Returns

`string`

***

### getDots()

> **getDots**(): [`Dot`](Dot.md)[]

Defined in: [mobjects/probability/DiceFace.ts:235](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L235)

Get all the dot mobjects.

#### Returns

[`Dot`](Dot.md)[]

***

### getEdge()

> **getEdge**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:730](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L730)

Get a specific edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to the edge point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getEdge`](VGroup.md#getedge)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:936](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L936)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`VGroup`](VGroup.md).[`getFamily`](VGroup.md#getfamily)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:754](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L754)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getLeft`](VGroup.md#getleft)

***

### getPoints()

> **getPoints**(): `number`[][]

Defined in: [core/VGroup.ts:551](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L551)

Get all 3D points from the VGroup.

#### Returns

`number`[][]

#### Inherited from

[`VGroup`](VGroup.md).[`getPoints`](VGroup.md#getpoints)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:762](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L762)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getRight`](VGroup.md#getright)

***

### getSize()

> **getSize**(): `number`

Defined in: [mobjects/probability/DiceFace.ts:242](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L242)

Get the size (side length) of the die face.

#### Returns

`number`

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:909](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L909)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`VGroup`](VGroup.md).[`getThreeObject`](VGroup.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:738](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L738)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getTop`](VGroup.md#gettop)

***

### getUnitVector()

> **getUnitVector**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/VMobject.ts:1059](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L1059)

Get the unit vector from the first to the last point of this VMobject,
accounting for the object's current rotation transform.

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`VGroup`](VGroup.md).[`getUnitVector`](VGroup.md#getunitvector)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:992](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L992)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`VGroup`](VGroup.md).[`getUpdaters`](VGroup.md#getupdaters)

***

### getValue()

> **getValue**(): `number`

Defined in: [mobjects/probability/DiceFace.ts:199](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L199)

Get the face value (1-6).

#### Returns

`number`

***

### getVisiblePoints()

> **getVisiblePoints**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:197](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L197)

Get points that should be visible (for rendering) as 2D Points

#### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`VGroup`](VGroup.md).[`getVisiblePoints`](VGroup.md#getvisiblepoints)

***

### getVisiblePoints3D()

> **getVisiblePoints3D**(): `number`[][]

Defined in: [core/VMobject.ts:205](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L205)

Get points that should be visible (for rendering) as 3D arrays

#### Returns

`number`[][]

#### Inherited from

[`VGroup`](VGroup.md).[`getVisiblePoints3D`](VGroup.md#getvisiblepoints3d)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:984](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L984)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`VGroup`](VGroup.md).[`hasUpdaters`](VGroup.md#hasupdaters)

***

### interpolate()

> **interpolate**(`target`, `alpha`): `this`

Defined in: [core/VMobject.ts:316](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L316)

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

[`VGroup`](VGroup.md).[`interpolate`](VGroup.md#interpolate)

***

### map()

> **map**\<`T`\>(`fn`): `T`[]

Defined in: [core/VGroup.ts:520](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L520)

Map over all vmobjects in the group.

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`vmobject`, `index`) => `T`

Mapping function

#### Returns

`T`[]

Array of mapped values

#### Inherited from

[`VGroup`](VGroup.md).[`map`](VGroup.md#map)

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/VGroup.ts:179](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L179)

Move the group center to the given point, or align with another Mobject.

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

[`VGroup`](VGroup.md).[`moveTo`](VGroup.md#moveto)

***

### moveToAligned()

> **moveToAligned**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:686](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L686)

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

[`VGroup`](VGroup.md).[`moveToAligned`](VGroup.md#movetoaligned)

***

### nextTo()

> **nextTo**(`target`, `direction`, `buff`): `this`

Defined in: [core/Mobject.ts:632](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L632)

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

[`VGroup`](VGroup.md).[`nextTo`](VGroup.md#nextto)

***

### prepareForNonlinearTransform()

> **prepareForNonlinearTransform**(`numPieces`): `this`

Defined in: [core/Mobject.ts:1037](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1037)

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

[`VGroup`](VGroup.md).[`prepareForNonlinearTransform`](VGroup.md#preparefornonlineartransform)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/VGroup.ts:117](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L117)

Remove mobjects from this group (override from Mobject).

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`remove`](VGroup.md#remove)

***

### removeUpdater()

> **removeUpdater**(`updater`): `this`

Defined in: [core/Mobject.ts:963](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L963)

Remove an updater function

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

The updater function to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`removeUpdater`](VGroup.md#removeupdater)

***

### removeVMobjects()

> **removeVMobjects**(...`vmobjects`): `this`

Defined in: [core/VGroup.ts:96](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L96)

Remove VMobjects from this group.

#### Parameters

##### vmobjects

...[`VMobject`](VMobject.md)[]

VMobjects to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`removeVMobjects`](VGroup.md#removevmobjects)

***

### restoreState()

> **restoreState**(): `boolean`

Defined in: [core/Mobject.ts:1131](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1131)

Restore this mobject to its previously saved state (from saveState).
Uses the deep copy stored on `this.savedState` to restore all properties.

#### Returns

`boolean`

true if state was restored, false if no saved state exists

#### Inherited from

[`VGroup`](VGroup.md).[`restoreState`](VGroup.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axis`): `this`

Defined in: [core/VGroup.ts:209](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L209)

Rotate all children around an axis.

#### Parameters

##### angle

`number`

Rotation angle in radians

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis of rotation [x, y, z], defaults to Z axis

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`rotate`](VGroup.md#rotate)

***

### rotateAboutOrigin()

> **rotateAboutOrigin**(`angle`, `axis`): `this`

Defined in: [core/Mobject.ts:355](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L355)

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

[`VGroup`](VGroup.md).[`rotateAboutOrigin`](VGroup.md#rotateaboutorigin)

***

### saveState()

> **saveState**(): `this`

Defined in: [core/Mobject.ts:1106](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1106)

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

[`VGroup`](VGroup.md).[`saveState`](VGroup.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/VGroup.ts:229](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L229)

Scale all children about the group's center.
Each child's size is scaled, and their positions are repositioned
relative to the group center — matching Manim Python behavior.
Does not change the group's own scaleVector.

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`scale`](VGroup.md#scale)

***

### setBackgroundColor()

> **setBackgroundColor**(`color`): `this`

Defined in: [mobjects/probability/DiceFace.ts:278](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L278)

Set the background color.

#### Parameters

##### color

`string`

CSS color string

#### Returns

`this`

this for chaining

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/VGroup.ts:255](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L255)

Set the color of all children.

#### Parameters

##### color

`string`

CSS color string

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`setColor`](VGroup.md#setcolor)

***

### setDotColor()

> **setDotColor**(`color`): `this`

Defined in: [mobjects/probability/DiceFace.ts:258](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L258)

Set the dot color for all pips.

#### Parameters

##### color

`string`

CSS color string

#### Returns

`this`

this for chaining

***

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/VGroup.ts:309](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L309)

Set the fill color of all children.

#### Parameters

##### color?

`string`

CSS color string

##### opacity?

`number`

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`setFill`](VGroup.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/VGroup.ts:294](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L294)

Set the fill opacity of all children.

#### Parameters

##### opacity

`number`

Fill opacity (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`setFillOpacity`](VGroup.md#setfillopacity)

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [core/VGroup.ts:268](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L268)

Set the opacity of all children.

#### Parameters

##### opacity

`number`

Opacity value (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`setOpacity`](VGroup.md#setopacity)

***

### setPoints()

> **setPoints**(`points`): `this`

Defined in: [core/VMobject.ts:134](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L134)

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

[`VGroup`](VGroup.md).[`setPoints`](VGroup.md#setpoints)

***

### setPoints3D()

> **setPoints3D**(`points`): `this`

Defined in: [core/VMobject.ts:159](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L159)

Set the points defining this VMobject using 3D arrays (alias for setPoints with number[][])

#### Parameters

##### points

`number`[][]

Array of [x, y, z] control points for cubic Bezier curves

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`setPoints3D`](VGroup.md#setpoints3d)

***

### setPointsAsCorners()

> **setPointsAsCorners**(`corners`): `this`

Defined in: [core/VMobject.ts:227](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L227)

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

[`VGroup`](VGroup.md).[`setPointsAsCorners`](VGroup.md#setpointsascorners)

***

### setStroke()

> **setStroke**(`color?`, `width?`, `opacity?`): `this`

Defined in: [core/VGroup.ts:330](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L330)

Set the stroke of all children.

#### Parameters

##### color?

`string`

CSS color string

##### width?

`number`

Stroke width in pixels

##### opacity?

`number`

Stroke opacity (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`setStroke`](VGroup.md#setstroke)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/VGroup.ts:281](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L281)

Set the stroke width of all children.

#### Parameters

##### width

`number`

Stroke width in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`setStrokeWidth`](VGroup.md#setstrokewidth)

***

### setStyle()

> **setStyle**(`style`): `this`

Defined in: [core/Mobject.ts:167](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L167)

Set style properties

#### Parameters

##### style

`Partial`\<[`MobjectStyle`](../interfaces/MobjectStyle.md)\>

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`setStyle`](VGroup.md#setstyle)

***

### setValue()

> **setValue**(`value`): `this`

Defined in: [mobjects/probability/DiceFace.ts:208](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L208)

Set the face value, recreating the dots.

#### Parameters

##### value

`number`

New face value (1-6)

#### Returns

`this`

this for chaining

***

### setX()

> **setX**(`x`): `this`

Defined in: [core/Mobject.ts:770](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L770)

Set the x-coordinate of this mobject's center, preserving y and z.
Matches Manim Python's set_x() behavior.

#### Parameters

##### x

`number`

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`setX`](VGroup.md#setx)

***

### setY()

> **setY**(`y`): `this`

Defined in: [core/Mobject.ts:779](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L779)

Set the y-coordinate of this mobject's center, preserving x and z.
Matches Manim Python's set_y() behavior.

#### Parameters

##### y

`number`

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`setY`](VGroup.md#sety)

***

### setZ()

> **setZ**(`z`): `this`

Defined in: [core/Mobject.ts:788](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L788)

Set the z-coordinate of this mobject's center, preserving x and y.
Matches Manim Python's set_z() behavior.

#### Parameters

##### z

`number`

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`setZ`](VGroup.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/VGroup.ts:165](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VGroup.ts#L165)

Shift all children by the given delta.
Only shifts children's internal positions, not the group's own position,
to avoid double-counting in THREE.js hierarchy.

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`shift`](VGroup.md#shift)

***

### toCorner()

> **toCorner**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:829](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L829)

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

[`VGroup`](VGroup.md).[`toCorner`](VGroup.md#tocorner)

***

### toEdge()

> **toEdge**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:807](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L807)

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

[`VGroup`](VGroup.md).[`toEdge`](VGroup.md#toedge)

***

### update()

> **update**(`dt`): `void`

Defined in: [core/Mobject.ts:1001](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1001)

Run all updaters with given dt
Called by Scene during render loop

#### Parameters

##### dt

`number`

Delta time in seconds since last frame

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`update`](VGroup.md#update)
