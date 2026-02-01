# Class: SampleSpace

Defined in: [mobjects/probability/SampleSpace.ts:116](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L116)

SampleSpace - A rectangle that can be divided into colored sub-rectangles
representing probability events.

This mobject is used for probability visualizations. It starts as a single
rectangle and can be divided vertically or horizontally into partitions
proportional to given probabilities. Partitions can be further subdivided
to show conditional probabilities, and annotated with braces and labels.

Follows the Python manim SampleSpace pattern.

## Example

```typescript
// Create a sample space
const sampleSpace = new SampleSpace();

// Divide into 30% blue and 70% green
sampleSpace.divideVertically([0.3, 0.7], { colors: [BLUE, GREEN] });

// Add a title
sampleSpace.addTitle("Sample Space");

// Get a specific partition
const first = sampleSpace.getDivision(0);
```

## Extends

- [`VGroup`](VGroup.md)

## Constructors

### Constructor

> **new SampleSpace**(`options`): `SampleSpace`

Defined in: [mobjects/probability/SampleSpace.ts:141](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L141)

#### Parameters

##### options

[`SampleSpaceOptions`](../interfaces/SampleSpaceOptions.md) = `{}`

#### Returns

`SampleSpace`

#### Overrides

[`VGroup`](VGroup.md).[`constructor`](VGroup.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:112](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L112)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`VGroup`](VGroup.md).[`__savedMobjectState`](VGroup.md#__savedmobjectstate)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L89)

Dirty flag indicating transforms need sync

#### Inherited from

[`VGroup`](VGroup.md).[`_dirty`](VGroup.md#_dirty)

***

### \_fillMaterial

> `protected` **\_fillMaterial**: `MeshBasicMaterial` = `null`

Defined in: [core/VMobject.ts:80](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L80)

Three.js fill material

#### Inherited from

[`VGroup`](VGroup.md).[`_fillMaterial`](VGroup.md#_fillmaterial)

***

### \_geometryDirty

> `protected` **\_geometryDirty**: `boolean` = `true`

Defined in: [core/VMobject.ts:83](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L83)

Whether geometry needs rebuild (separate from material dirty)

#### Inherited from

[`VGroup`](VGroup.md).[`_geometryDirty`](VGroup.md#_geometrydirty)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:68](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L68)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`VGroup`](VGroup.md).[`_opacity`](VGroup.md#_opacity)

***

### \_parent

> `protected` **\_parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L83)

Parent alias for backward compatibility

#### Inherited from

[`VGroup`](VGroup.md).[`_parent`](VGroup.md#_parent)

***

### \_points2D

> `protected` **\_points2D**: [`Point`](../interfaces/Point.md)[] = `[]`

Defined in: [core/VMobject.ts:64](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L64)

Array of 2D points for backward compatibility.
Each point is {x, y}.

#### Inherited from

[`VGroup`](VGroup.md).[`_points2D`](VGroup.md#_points2d)

***

### \_points3D

> `protected` **\_points3D**: `number`[][] = `[]`

Defined in: [core/VMobject.ts:71](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L71)

Array of cubic Bezier control points in 3D.
Each point is [x, y, z].
Stored as: [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]

#### Inherited from

[`VGroup`](VGroup.md).[`_points3D`](VGroup.md#_points3d)

***

### \_strokeMaterial

> `protected` **\_strokeMaterial**: `LineMaterial` = `null`

Defined in: [core/VMobject.ts:77](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L77)

Three.js stroke material (Line2 LineMaterial for thick strokes)

#### Inherited from

[`VGroup`](VGroup.md).[`_strokeMaterial`](VGroup.md#_strokematerial)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:77](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L77)

Style properties for backward compatibility

#### Inherited from

[`VGroup`](VGroup.md).[`_style`](VGroup.md#_style)

***

### \_submobjects

> `protected` **\_submobjects**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L80)

Submobjects alias for backward compatibility

#### Inherited from

[`VGroup`](VGroup.md).[`_submobjects`](VGroup.md#_submobjects)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L86)

Three.js backing object

#### Inherited from

[`VGroup`](VGroup.md).[`_threeObject`](VGroup.md#_threeobject)

***

### \_visiblePointCount

> `protected` **\_visiblePointCount**: `number` = `null`

Defined in: [core/VMobject.ts:74](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L74)

Number of points visible (for Create animation)

#### Inherited from

[`VGroup`](VGroup.md).[`_visiblePointCount`](VGroup.md#_visiblepointcount)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`VGroup`](VGroup.md).[`children`](VGroup.md#children)

***

### color

> **color**: `string` = `'#ffffff'`

Defined in: [core/Mobject.ts:65](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L65)

Color as CSS color string

#### Inherited from

[`VGroup`](VGroup.md).[`color`](VGroup.md#color)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:74](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L74)

Fill opacity (0-1)

#### Inherited from

[`VGroup`](VGroup.md).[`fillOpacity`](VGroup.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`VGroup`](VGroup.md).[`id`](VGroup.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`VGroup`](VGroup.md).[`parent`](VGroup.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`VGroup`](VGroup.md).[`position`](VGroup.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`VGroup`](VGroup.md).[`rotation`](VGroup.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:98](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L98)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`VGroup`](VGroup.md).[`savedState`](VGroup.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`VGroup`](VGroup.md).[`scaleVector`](VGroup.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L71)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`VGroup`](VGroup.md).[`strokeWidth`](VGroup.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:105](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L105)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`VGroup`](VGroup.md).[`targetCopy`](VGroup.md#targetcopy)

***

### \_rendererHeight

> `static` **\_rendererHeight**: `number` = `450`

Defined in: [core/VMobject.ts:93](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L93)

#### Inherited from

[`VGroup`](VGroup.md).[`_rendererHeight`](VGroup.md#_rendererheight)

***

### \_rendererWidth

> `static` **\_rendererWidth**: `number` = `800`

Defined in: [core/VMobject.ts:92](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L92)

Renderer resolution for LineMaterial (set by Scene)

#### Inherited from

[`VGroup`](VGroup.md).[`_rendererWidth`](VGroup.md#_rendererwidth)

***

### useShaderCurves

> `static` **useShaderCurves**: `boolean` = `false`

Defined in: [core/VMobject.ts:101](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L101)

When true, VMobjects use GPU Bezier SDF shaders for stroke rendering
instead of the default Line2/LineMaterial approach. This produces
ManimGL-quality anti-aliased curves with variable stroke width and
round caps. Default: false (opt-in).

#### Inherited from

[`VGroup`](VGroup.md).[`useShaderCurves`](VGroup.md#useshadercurves)

## Accessors

### fillColor

#### Get Signature

> **get** **fillColor**(): `string`

Defined in: [core/Mobject.ts:476](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L476)

Get the fill color

##### Returns

`string`

#### Set Signature

> **set** **fillColor**(`color`): `void`

Defined in: [core/Mobject.ts:483](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L483)

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

Defined in: [core/Mobject.ts:916](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L916)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`VGroup`](VGroup.md).[`isDirty`](VGroup.md#isdirty)

***

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [core/VGroup.ts:492](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L492)

Get the number of vmobjects in this group.

##### Returns

`number`

#### Inherited from

[`VGroup`](VGroup.md).[`length`](VGroup.md#length)

***

### numHorizontalPartitions

#### Get Signature

> **get** **numHorizontalPartitions**(): `number`

Defined in: [mobjects/probability/SampleSpace.ts:640](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L640)

Get the number of horizontal partitions.

##### Returns

`number`

***

### numPoints

#### Get Signature

> **get** **numPoints**(): `number`

Defined in: [core/VMobject.ts:207](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L207)

Get the number of points

##### Returns

`number`

#### Inherited from

[`VGroup`](VGroup.md).[`numPoints`](VGroup.md#numpoints)

***

### numVerticalPartitions

#### Get Signature

> **get** **numVerticalPartitions**(): `number`

Defined in: [mobjects/probability/SampleSpace.ts:633](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L633)

Get the number of vertical partitions.

##### Returns

`number`

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/Mobject.ts:139](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L139)

Get the overall opacity of the mobject

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/Mobject.ts:146](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L146)

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

Defined in: [core/VGroup.ts:545](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L545)

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

Defined in: [core/VMobject.ts:137](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L137)

Check whether this instance should use shader-based Bezier curve rendering.
Returns the per-instance override if set, otherwise the class-level default.

##### Returns

`boolean`

#### Set Signature

> **set** **shaderCurves**(`value`): `void`

Defined in: [core/VMobject.ts:145](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L145)

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

Defined in: [core/Mobject.ts:154](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L154)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`VGroup`](VGroup.md).[`style`](VGroup.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:186](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L186)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`VGroup`](VGroup.md).[`submobjects`](VGroup.md#submobjects)

***

### visiblePointCount

#### Get Signature

> **get** **visiblePointCount**(): `number`

Defined in: [core/VMobject.ts:214](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L214)

Get the number of visible points (for Create animation)

##### Returns

`number`

#### Set Signature

> **set** **visiblePointCount**(`count`): `void`

Defined in: [core/VMobject.ts:221](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L221)

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

Defined in: [core/VMobject.ts:583](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L583)

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

Defined in: [mobjects/probability/SampleSpace.ts:687](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L687)

Create a copy of this SampleSpace.

#### Returns

[`VMobject`](VMobject.md)

#### Overrides

[`VGroup`](VGroup.md).[`_createCopy`](VGroup.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [core/VGroup.ts:463](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L463)

Create the Three.js backing object for this VGroup.
A VGroup is simply a THREE.Group that contains children.

#### Returns

`Object3D`

#### Inherited from

[`VGroup`](VGroup.md).[`_createThreeObject`](VGroup.md#_createthreeobject)

***

### \_getBoundingBox()

> `protected` **\_getBoundingBox**(): `object`

Defined in: [core/Mobject.ts:730](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L730)

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

Defined in: [core/Mobject.ts:713](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L713)

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

### \_interpolatePointList2D()

> `protected` **\_interpolatePointList2D**(`points`, `targetCount`): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:426](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L426)

Interpolate a 2D point list to have a specific number of points.

#### Parameters

##### points

[`Point`](../interfaces/Point.md)[]

##### targetCount

`number`

#### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`VGroup`](VGroup.md).[`_interpolatePointList2D`](VGroup.md#_interpolatepointlist2d)

***

### \_interpolatePointList3D()

> `protected` **\_interpolatePointList3D**(`points`, `targetCount`): `number`[][]

Defined in: [core/VMobject.ts:460](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L460)

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

Defined in: [core/Mobject.ts:896](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L896)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`_markDirty`](VGroup.md#_markdirty)

***

### \_markDirtyUpward()

> **\_markDirtyUpward**(): `void`

Defined in: [core/Mobject.ts:905](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L905)

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

Defined in: [core/VMobject.ts:537](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L537)

Convert points to a THREE.CurvePath for stroke rendering

#### Returns

`CurvePath`\<`Vector3`\>

#### Inherited from

[`VGroup`](VGroup.md).[`_pointsToCurvePath`](VGroup.md#_pointstocurvepath)

***

### \_pointsToShape()

> `protected` **\_pointsToShape**(): `Shape`

Defined in: [core/VMobject.ts:495](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L495)

Convert Bezier control points to a Three.js Shape for filled rendering.

#### Returns

`Shape`

THREE.Shape representing the path

#### Inherited from

[`VGroup`](VGroup.md).[`_pointsToShape`](VGroup.md#_pointstoshape)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [core/VMobject.ts:1014](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L1014)

Sync material properties to Three.js

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`_syncMaterialToThree`](VGroup.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:850](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L850)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`_syncToThree`](VGroup.md#_synctothree)

***

### \_updateGeometry()

> `protected` **\_updateGeometry**(`group`): `void`

Defined in: [core/VMobject.ts:769](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L769)

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

Defined in: [core/VGroup.ts:508](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L508)

Iterate over all vmobjects in the group.

#### Returns

`Iterator`\<[`VMobject`](VMobject.md)\>

#### Inherited from

[`VGroup`](VGroup.md).[`[iterator]`](VGroup.md#iterator)

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/VGroup.ts:56](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L56)

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

### addBracesAndLabels()

> **addBracesAndLabels**(`labels`, `options`): `this`

Defined in: [mobjects/probability/SampleSpace.ts:556](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L556)

Add brace annotations along the vertical partitions with labels.

Places a brace under each vertical partition, with an optional label
below the brace indicating the probability.

#### Parameters

##### labels

`string`[]

Text labels for each partition brace

##### options

[`BraceAnnotationOptions`](../interfaces/BraceAnnotationOptions.md) = `{}`

Styling for braces and labels

#### Returns

`this`

this for chaining

#### Example

```typescript
sampleSpace.divideVertically([0.3, 0.7], { colors: [BLUE, GREEN] });
sampleSpace.addBracesAndLabels(["0.3", "0.7"]);
```

***

### addPoints()

> **addPoints**(...`points`): `this`

Defined in: [core/VMobject.ts:246](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L246)

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

Defined in: [core/VMobject.ts:302](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L302)

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

### addTitle()

> **addTitle**(`text`, `options`): [`Text`](Text.md)

Defined in: [mobjects/probability/SampleSpace.ts:514](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L514)

Add a title label above the sample space.

#### Parameters

##### text

`string`

Title text

##### options

Font size and color overrides

###### buff?

`number`

###### color?

`string`

###### fontSize?

`number`

#### Returns

[`Text`](Text.md)

The created Text mobject

***

### addUpdater()

> **addUpdater**(`updater`, `callOnAdd`): `this`

Defined in: [core/Mobject.ts:964](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L964)

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

Defined in: [core/VGroup.ts:38](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L38)

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

Defined in: [core/VMobject.ts:404](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L404)

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

Defined in: [core/Mobject.ts:678](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L678)

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

Defined in: [core/Mobject.ts:1031](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1031)

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

Defined in: [core/Mobject.ts:939](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L939)

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

Defined in: [core/VGroup.ts:354](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L354)

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

Defined in: [core/VGroup.ts:387](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L387)

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

Defined in: [core/VGroup.ts:441](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L441)

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

Defined in: [core/Mobject.ts:574](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L574)

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

Defined in: [core/Mobject.ts:811](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L811)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`center`](VGroup.md#center)

***

### clearPoints()

> **clearPoints**(): `this`

Defined in: [core/VMobject.ts:341](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L341)

Clear all points

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`clearPoints`](VGroup.md#clearpoints)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:989](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L989)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`clearUpdaters`](VGroup.md#clearupdaters)

***

### copy()

> **copy**(): [`VMobject`](VMobject.md)

Defined in: [core/VGroup.ts:485](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L485)

Copy this VGroup.

#### Returns

[`VMobject`](VMobject.md)

#### Inherited from

[`VGroup`](VGroup.md).[`copy`](VGroup.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/VMobject.ts:1113](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L1113)

Clean up Three.js resources

#### Returns

`void`

#### Inherited from

[`VGroup`](VGroup.md).[`dispose`](VGroup.md#dispose)

***

### divideHorizontally()

> **divideHorizontally**(`proportions`, `options`): `this`

Defined in: [mobjects/probability/SampleSpace.ts:278](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L278)

Divide the sample space into horizontal strips (rows) based on proportions.

The proportions should sum to 1.0. Each strip's height is proportional
to its value.

#### Parameters

##### proportions

`number`[]

Array of proportions (must sum to ~1.0)

##### options

[`DivideOptions`](../interfaces/DivideOptions.md) = `{}`

Colors, labels, and styling for the partitions

#### Returns

`this`

this for chaining

#### Example

```typescript
sampleSpace.divideHorizontally([0.5, 0.5], {
  colors: [BLUE, RED],
  labels: ["Top Half", "Bottom Half"],
});
```

***

### divideVertically()

> **divideVertically**(`proportions`, `options`): `this`

Defined in: [mobjects/probability/SampleSpace.ts:198](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L198)

Divide the sample space into vertical strips (columns) based on proportions.

The proportions should sum to 1.0. Each strip's width is proportional
to its value.

#### Parameters

##### proportions

`number`[]

Array of proportions (must sum to ~1.0)

##### options

[`DivideOptions`](../interfaces/DivideOptions.md) = `{}`

Colors, labels, and styling for the partitions

#### Returns

`this`

this for chaining

#### Example

```typescript
sampleSpace.divideVertically([0.3, 0.7], {
  colors: [BLUE, GREEN],
  labels: ["P(A) = 0.3", "P(B) = 0.7"],
});
```

***

### filter()

> **filter**(`fn`): [`VGroup`](VGroup.md)

Defined in: [core/VGroup.ts:536](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L536)

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

Defined in: [core/Mobject.ts:367](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L367)

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

Defined in: [core/VGroup.ts:517](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L517)

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

Defined in: [core/Mobject.ts:1099](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1099)

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

Defined in: [core/VGroup.ts:501](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L501)

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

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:760](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L760)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getBottom`](VGroup.md#getbottom)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [core/Mobject.ts:622](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L622)

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

Defined in: [core/VGroup.ts:137](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L137)

Get the center of the group (average of all children centers).

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getCenter`](VGroup.md#getcenter)

***

### getCombinedPoints()

> **getCombinedPoints**(): `number`[][]

Defined in: [core/VGroup.ts:449](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L449)

Get combined path points from all children.

#### Returns

`number`[][]

Combined array of points from all children

#### Inherited from

[`VGroup`](VGroup.md).[`getCombinedPoints`](VGroup.md#getcombinedpoints)

***

### getDivision()

> **getDivision**(`index`): [`Partition`](../interfaces/Partition.md)

Defined in: [mobjects/probability/SampleSpace.ts:440](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L440)

Get a specific vertical partition (division) by index.

#### Parameters

##### index

`number`

The partition index (0-based)

#### Returns

[`Partition`](../interfaces/Partition.md)

The partition object with its rectangle, proportion, and optional label

***

### getDivisionRectangle()

> **getDivisionRectangle**(`index`): [`Rectangle`](Rectangle.md)

Defined in: [mobjects/probability/SampleSpace.ts:504](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L504)

Get the rectangle mobject for a specific division.

#### Parameters

##### index

`number`

The partition index (0-based)

#### Returns

[`Rectangle`](Rectangle.md)

The Rectangle VMobject

***

### getEdge()

> **getEdge**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:744](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L744)

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

Defined in: [core/Mobject.ts:950](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L950)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`VGroup`](VGroup.md).[`getFamily`](VGroup.md#getfamily)

***

### getHorizontalDivision()

> **getHorizontalDivision**(`index`): [`Partition`](../interfaces/Partition.md)

Defined in: [mobjects/probability/SampleSpace.ts:455](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L455)

Get a specific horizontal partition by index.

#### Parameters

##### index

`number`

The partition index (0-based)

#### Returns

[`Partition`](../interfaces/Partition.md)

The partition object

***

### getHorizontalPartitions()

> **getHorizontalPartitions**(): [`Partition`](../interfaces/Partition.md)[]

Defined in: [mobjects/probability/SampleSpace.ts:495](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L495)

Get all horizontal partitions.

#### Returns

[`Partition`](../interfaces/Partition.md)[]

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:768](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L768)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getLeft`](VGroup.md#getleft)

***

### getOutline()

> **getOutline**(): [`Rectangle`](Rectangle.md)

Defined in: [mobjects/probability/SampleSpace.ts:176](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L176)

Get the outline rectangle.

#### Returns

[`Rectangle`](Rectangle.md)

***

### getPoints()

> **getPoints**(): `number`[][]

Defined in: [core/VGroup.ts:558](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L558)

Get all 3D points from the VGroup.

#### Returns

`number`[][]

#### Inherited from

[`VGroup`](VGroup.md).[`getPoints`](VGroup.md#getpoints)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:776](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L776)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getRight`](VGroup.md#getright)

***

### getSampleSpaceCenter()

> **getSampleSpaceCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/probability/SampleSpace.ts:626](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L626)

Get the center of the sample space.

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

***

### getSampleSpaceHeight()

> **getSampleSpaceHeight**(): `number`

Defined in: [mobjects/probability/SampleSpace.ts:619](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L619)

Get the height of the sample space.

#### Returns

`number`

***

### getSampleSpaceWidth()

> **getSampleSpaceWidth**(): `number`

Defined in: [mobjects/probability/SampleSpace.ts:612](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L612)

Get the width of the sample space.

#### Returns

`number`

***

### getSubdivision()

> **getSubdivision**(`partitionIndex`, `subIndex`): [`Partition`](../interfaces/Partition.md)

Defined in: [mobjects/probability/SampleSpace.ts:471](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L471)

Get a subdivision of a vertical partition.

#### Parameters

##### partitionIndex

`number`

Index of the parent vertical partition

##### subIndex

`number`

Index within the subdivision

#### Returns

[`Partition`](../interfaces/Partition.md)

The sub-partition object

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:923](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L923)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`VGroup`](VGroup.md).[`getThreeObject`](VGroup.md#getthreeobject)

***

### getTitle()

> **getTitle**(): [`Text`](Text.md)

Defined in: [mobjects/probability/SampleSpace.ts:536](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L536)

Get the title mobject, if set.

#### Returns

[`Text`](Text.md)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:752](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L752)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`VGroup`](VGroup.md).[`getTop`](VGroup.md#gettop)

***

### getUnitVector()

> **getUnitVector**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/VMobject.ts:1068](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L1068)

Get the unit vector from the first to the last point of this VMobject,
accounting for the object's current rotation transform.

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`VGroup`](VGroup.md).[`getUnitVector`](VGroup.md#getunitvector)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1006](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1006)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`VGroup`](VGroup.md).[`getUpdaters`](VGroup.md#getupdaters)

***

### getVerticalPartitions()

> **getVerticalPartitions**(): [`Partition`](../interfaces/Partition.md)[]

Defined in: [mobjects/probability/SampleSpace.ts:488](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L488)

Get all vertical partitions.

#### Returns

[`Partition`](../interfaces/Partition.md)[]

***

### getVisiblePoints()

> **getVisiblePoints**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:230](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L230)

Get points that should be visible (for rendering) as 2D Points

#### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`VGroup`](VGroup.md).[`getVisiblePoints`](VGroup.md#getvisiblepoints)

***

### getVisiblePoints3D()

> **getVisiblePoints3D**(): `number`[][]

Defined in: [core/VMobject.ts:238](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L238)

Get points that should be visible (for rendering) as 3D arrays

#### Returns

`number`[][]

#### Inherited from

[`VGroup`](VGroup.md).[`getVisiblePoints3D`](VGroup.md#getvisiblepoints3d)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:998](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L998)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`VGroup`](VGroup.md).[`hasUpdaters`](VGroup.md#hasupdaters)

***

### interpolate()

> **interpolate**(`target`, `alpha`): `this`

Defined in: [core/VMobject.ts:356](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L356)

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

Defined in: [core/VGroup.ts:527](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L527)

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

Defined in: [core/VGroup.ts:179](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L179)

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

Defined in: [core/Mobject.ts:700](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L700)

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

Defined in: [core/Mobject.ts:646](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L646)

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

Defined in: [core/Mobject.ts:1051](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1051)

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

Defined in: [core/VGroup.ts:117](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L117)

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

Defined in: [core/Mobject.ts:977](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L977)

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

Defined in: [core/VGroup.ts:96](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L96)

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

Defined in: [core/Mobject.ts:1145](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1145)

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

Defined in: [core/VGroup.ts:209](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L209)

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

Defined in: [core/Mobject.ts:358](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L358)

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

Defined in: [core/Mobject.ts:1120](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1120)

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

Defined in: [core/VGroup.ts:229](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L229)

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

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/VGroup.ts:255](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L255)

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

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/VGroup.ts:309](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L309)

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

Defined in: [core/VGroup.ts:294](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L294)

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

Defined in: [core/VGroup.ts:268](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L268)

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

Defined in: [core/VMobject.ts:164](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L164)

Set the points defining this VMobject.
Accepts either Point[] ({x, y} objects) or number[][] ([x, y, z] arrays).

#### Parameters

##### points

Array of points in either format

[`Point`](../interfaces/Point.md)[] | `number`[][]

#### Returns

`this`

this for chaining

#### Inherited from

[`VGroup`](VGroup.md).[`setPoints`](VGroup.md#setpoints)

***

### setPoints3D()

> **setPoints3D**(`points`): `this`

Defined in: [core/VMobject.ts:192](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L192)

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

Defined in: [core/VMobject.ts:261](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L261)

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

Defined in: [core/VGroup.ts:330](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L330)

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

Defined in: [core/VGroup.ts:281](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L281)

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

Defined in: [core/Mobject.ts:161](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L161)

Set style properties

#### Parameters

##### style

`Partial`\<[`MobjectStyle`](../interfaces/MobjectStyle.md)\>

#### Returns

`this`

#### Inherited from

[`VGroup`](VGroup.md).[`setStyle`](VGroup.md#setstyle)

***

### setX()

> **setX**(`x`): `this`

Defined in: [core/Mobject.ts:784](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L784)

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

Defined in: [core/Mobject.ts:793](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L793)

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

Defined in: [core/Mobject.ts:802](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L802)

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

Defined in: [core/VGroup.ts:165](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L165)

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

### subdividePartition()

> **subdividePartition**(`partitionIndex`, `proportions`, `options`): `this`

Defined in: [mobjects/probability/SampleSpace.ts:359](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/probability/SampleSpace.ts#L359)

Subdivide a vertical partition horizontally to show conditional probabilities.

#### Parameters

##### partitionIndex

`number`

Index of the vertical partition to subdivide

##### proportions

`number`[]

Array of proportions within the partition

##### options

[`DivideOptions`](../interfaces/DivideOptions.md) = `{}`

Colors, labels, and styling

#### Returns

`this`

this for chaining

#### Example

```typescript
// First divide vertically into A and B
sampleSpace.divideVertically([0.3, 0.7]);

// Then subdivide partition 0 (A) into sub-events
sampleSpace.subdividePartition(0, [0.6, 0.4], {
  colors: [YELLOW, RED],
  labels: ["P(C|A)", "P(D|A)"],
});
```

***

### toCorner()

> **toCorner**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:843](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L843)

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

Defined in: [core/Mobject.ts:821](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L821)

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

Defined in: [core/Mobject.ts:1015](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1015)

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
