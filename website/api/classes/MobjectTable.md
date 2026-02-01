# Class: MobjectTable

Defined in: [mobjects/table/Table.ts:682](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L682)

MobjectTable - A table that can contain any type of mobject

This is essentially an alias for Table, but with a more descriptive name
when you explicitly want to mix different mobject types.

## Example

```typescript
const circle = new Circle();
const square = new Square();
const text = new Text({ text: 'Hello' });

const table = new MobjectTable({
  data: [[circle, square, text]]
});
```

## Extends

- [`Table`](Table.md)

## Constructors

### Constructor

> **new MobjectTable**(`options`): `MobjectTable`

Defined in: [mobjects/table/Table.ts:683](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L683)

#### Parameters

##### options

[`MobjectTableOptions`](../interfaces/MobjectTableOptions.md)

#### Returns

`MobjectTable`

#### Overrides

[`Table`](Table.md).[`constructor`](Table.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:112](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L112)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Table`](Table.md).[`__savedMobjectState`](Table.md#__savedmobjectstate)

***

### \_backgroundRectangles

> `protected` **\_backgroundRectangles**: `Map`\<`string`, [`Rectangle`](Rectangle.md)\>

Defined in: [mobjects/table/Table.ts:100](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L100)

Background rectangles for highlighting

#### Inherited from

[`Table`](Table.md).[`_backgroundRectangles`](Table.md#_backgroundrectangles)

***

### \_colLabels

> `protected` **\_colLabels**: [`Mobject`](Mobject.md)[]

Defined in: [mobjects/table/Table.ts:80](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L80)

#### Inherited from

[`Table`](Table.md).[`_colLabels`](Table.md#_collabels)

***

### \_colPositions

> `protected` **\_colPositions**: `number`[] = `[]`

Defined in: [mobjects/table/Table.ts:108](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L108)

#### Inherited from

[`Table`](Table.md).[`_colPositions`](Table.md#_colpositions)

***

### \_colWidths

> `protected` **\_colWidths**: `number`[] = `[]`

Defined in: [mobjects/table/Table.ts:104](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L104)

#### Inherited from

[`Table`](Table.md).[`_colWidths`](Table.md#_colwidths)

***

### \_data

> `protected` **\_data**: [`Mobject`](Mobject.md)[][]

Defined in: [mobjects/table/Table.ts:78](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L78)

#### Inherited from

[`Table`](Table.md).[`_data`](Table.md#_data)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L89)

Dirty flag indicating transforms need sync

#### Inherited from

[`Table`](Table.md).[`_dirty`](Table.md#_dirty)

***

### \_entries

> `protected` **\_entries**: [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:94](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L94)

All entries arranged in the table (includes labels)

#### Inherited from

[`Table`](Table.md).[`_entries`](Table.md#_entries)

***

### \_fillMaterial

> `protected` **\_fillMaterial**: `MeshBasicMaterial` = `null`

Defined in: [core/VMobject.ts:80](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L80)

Three.js fill material

#### Inherited from

[`Table`](Table.md).[`_fillMaterial`](Table.md#_fillmaterial)

***

### \_geometryDirty

> `protected` **\_geometryDirty**: `boolean` = `true`

Defined in: [core/VMobject.ts:83](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L83)

Whether geometry needs rebuild (separate from material dirty)

#### Inherited from

[`Table`](Table.md).[`_geometryDirty`](Table.md#_geometrydirty)

***

### \_hBuff

> `protected` **\_hBuff**: `number`

Defined in: [mobjects/table/Table.ts:84](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L84)

#### Inherited from

[`Table`](Table.md).[`_hBuff`](Table.md#_hbuff)

***

### \_horizontalLines

> `protected` **\_horizontalLines**: [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:96](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L96)

Horizontal lines

#### Inherited from

[`Table`](Table.md).[`_horizontalLines`](Table.md#_horizontallines)

***

### \_includeOuterLines

> `protected` **\_includeOuterLines**: `boolean`

Defined in: [mobjects/table/Table.ts:82](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L82)

#### Inherited from

[`Table`](Table.md).[`_includeOuterLines`](Table.md#_includeouterlines)

***

### \_lineColor

> `protected` **\_lineColor**: `string`

Defined in: [mobjects/table/Table.ts:85](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L85)

#### Inherited from

[`Table`](Table.md).[`_lineColor`](Table.md#_linecolor)

***

### \_lineStrokeWidth

> `protected` **\_lineStrokeWidth**: `number`

Defined in: [mobjects/table/Table.ts:86](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L86)

#### Inherited from

[`Table`](Table.md).[`_lineStrokeWidth`](Table.md#_linestrokewidth)

***

### \_numCols

> `protected` **\_numCols**: `number`

Defined in: [mobjects/table/Table.ts:91](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L91)

Number of columns in the table (excluding labels)

#### Inherited from

[`Table`](Table.md).[`_numCols`](Table.md#_numcols)

***

### \_numRows

> `protected` **\_numRows**: `number`

Defined in: [mobjects/table/Table.ts:89](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L89)

Number of rows in the table (excluding labels)

#### Inherited from

[`Table`](Table.md).[`_numRows`](Table.md#_numrows)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:68](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L68)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Table`](Table.md).[`_opacity`](Table.md#_opacity)

***

### \_parent

> `protected` **\_parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L83)

Parent alias for backward compatibility

#### Inherited from

[`Table`](Table.md).[`_parent`](Table.md#_parent)

***

### \_points2D

> `protected` **\_points2D**: [`Point`](../interfaces/Point.md)[] = `[]`

Defined in: [core/VMobject.ts:64](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L64)

Array of 2D points for backward compatibility.
Each point is {x, y}.

#### Inherited from

[`Table`](Table.md).[`_points2D`](Table.md#_points2d)

***

### \_points3D

> `protected` **\_points3D**: `number`[][] = `[]`

Defined in: [core/VMobject.ts:71](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L71)

Array of cubic Bezier control points in 3D.
Each point is [x, y, z].
Stored as: [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]

#### Inherited from

[`Table`](Table.md).[`_points3D`](Table.md#_points3d)

***

### \_rowHeights

> `protected` **\_rowHeights**: `number`[] = `[]`

Defined in: [mobjects/table/Table.ts:103](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L103)

Cell dimensions for each row and column

#### Inherited from

[`Table`](Table.md).[`_rowHeights`](Table.md#_rowheights)

***

### \_rowLabels

> `protected` **\_rowLabels**: [`Mobject`](Mobject.md)[]

Defined in: [mobjects/table/Table.ts:79](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L79)

#### Inherited from

[`Table`](Table.md).[`_rowLabels`](Table.md#_rowlabels)

***

### \_rowPositions

> `protected` **\_rowPositions**: `number`[] = `[]`

Defined in: [mobjects/table/Table.ts:107](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L107)

Starting positions for rows and columns

#### Inherited from

[`Table`](Table.md).[`_rowPositions`](Table.md#_rowpositions)

***

### \_strokeMaterial

> `protected` **\_strokeMaterial**: `LineMaterial` = `null`

Defined in: [core/VMobject.ts:77](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L77)

Three.js stroke material (Line2 LineMaterial for thick strokes)

#### Inherited from

[`Table`](Table.md).[`_strokeMaterial`](Table.md#_strokematerial)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:77](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L77)

Style properties for backward compatibility

#### Inherited from

[`Table`](Table.md).[`_style`](Table.md#_style)

***

### \_submobjects

> `protected` **\_submobjects**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L80)

Submobjects alias for backward compatibility

#### Inherited from

[`Table`](Table.md).[`_submobjects`](Table.md#_submobjects)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L86)

Three.js backing object

#### Inherited from

[`Table`](Table.md).[`_threeObject`](Table.md#_threeobject)

***

### \_topLeftEntry

> `protected` **\_topLeftEntry**: [`Mobject`](Mobject.md)

Defined in: [mobjects/table/Table.ts:81](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L81)

#### Inherited from

[`Table`](Table.md).[`_topLeftEntry`](Table.md#_topleftentry)

***

### \_vBuff

> `protected` **\_vBuff**: `number`

Defined in: [mobjects/table/Table.ts:83](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L83)

#### Inherited from

[`Table`](Table.md).[`_vBuff`](Table.md#_vbuff)

***

### \_verticalLines

> `protected` **\_verticalLines**: [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:98](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L98)

Vertical lines

#### Inherited from

[`Table`](Table.md).[`_verticalLines`](Table.md#_verticallines)

***

### \_visiblePointCount

> `protected` **\_visiblePointCount**: `number` = `null`

Defined in: [core/VMobject.ts:74](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L74)

Number of points visible (for Create animation)

#### Inherited from

[`Table`](Table.md).[`_visiblePointCount`](Table.md#_visiblepointcount)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Table`](Table.md).[`children`](Table.md#children)

***

### color

> **color**: `string` = `'#ffffff'`

Defined in: [core/Mobject.ts:65](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L65)

Color as CSS color string

#### Inherited from

[`Table`](Table.md).[`color`](Table.md#color)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:74](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L74)

Fill opacity (0-1)

#### Inherited from

[`Table`](Table.md).[`fillOpacity`](Table.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Table`](Table.md).[`id`](Table.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Table`](Table.md).[`parent`](Table.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Table`](Table.md).[`position`](Table.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Table`](Table.md).[`rotation`](Table.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:98](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L98)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Table`](Table.md).[`savedState`](Table.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Table`](Table.md).[`scaleVector`](Table.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L71)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Table`](Table.md).[`strokeWidth`](Table.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:105](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L105)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Table`](Table.md).[`targetCopy`](Table.md#targetcopy)

***

### \_rendererHeight

> `static` **\_rendererHeight**: `number` = `450`

Defined in: [core/VMobject.ts:93](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L93)

#### Inherited from

[`Table`](Table.md).[`_rendererHeight`](Table.md#_rendererheight)

***

### \_rendererWidth

> `static` **\_rendererWidth**: `number` = `800`

Defined in: [core/VMobject.ts:92](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L92)

Renderer resolution for LineMaterial (set by Scene)

#### Inherited from

[`Table`](Table.md).[`_rendererWidth`](Table.md#_rendererwidth)

***

### useShaderCurves

> `static` **useShaderCurves**: `boolean` = `false`

Defined in: [core/VMobject.ts:101](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L101)

When true, VMobjects use GPU Bezier SDF shaders for stroke rendering
instead of the default Line2/LineMaterial approach. This produces
ManimGL-quality anti-aliased curves with variable stroke width and
round caps. Default: false (opt-in).

#### Inherited from

[`Table`](Table.md).[`useShaderCurves`](Table.md#useshadercurves)

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

[`Table`](Table.md).[`fillColor`](Table.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:916](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L916)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Table`](Table.md).[`isDirty`](Table.md#isdirty)

***

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [core/VGroup.ts:492](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L492)

Get the number of vmobjects in this group.

##### Returns

`number`

#### Inherited from

[`Table`](Table.md).[`length`](Table.md#length)

***

### numPoints

#### Get Signature

> **get** **numPoints**(): `number`

Defined in: [core/VMobject.ts:207](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L207)

Get the number of points

##### Returns

`number`

#### Inherited from

[`Table`](Table.md).[`numPoints`](Table.md#numpoints)

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

[`Table`](Table.md).[`opacity`](Table.md#opacity)

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

[`Table`](Table.md).[`points`](Table.md#points)

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

[`Table`](Table.md).[`shaderCurves`](Table.md#shadercurves)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:154](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L154)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Table`](Table.md).[`style`](Table.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:186](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L186)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Table`](Table.md).[`submobjects`](Table.md#submobjects)

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

[`Table`](Table.md).[`visiblePointCount`](Table.md#visiblepointcount)

## Methods

### \_arrangeEntries()

> `protected` **\_arrangeEntries**(): `void`

Defined in: [mobjects/table/Table.ts:281](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L281)

Arrange entries in the table grid

#### Returns

`void`

#### Inherited from

[`Table`](Table.md).[`_arrangeEntries`](Table.md#_arrangeentries)

***

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

[`Table`](Table.md).[`_buildEarcutFillGeometry`](Table.md#_buildearcutfillgeometry)

***

### \_calculateDimensions()

> `protected` **\_calculateDimensions**(): `void`

Defined in: [mobjects/table/Table.ts:178](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L178)

Calculate cell dimensions based on entry sizes

#### Returns

`void`

#### Inherited from

[`Table`](Table.md).[`_calculateDimensions`](Table.md#_calculatedimensions)

***

### \_createCopy()

> `protected` **\_createCopy**(): [`VMobject`](VMobject.md)

Defined in: [mobjects/table/Table.ts:567](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L567)

Create a copy of this Table

#### Returns

[`VMobject`](VMobject.md)

#### Inherited from

[`Table`](Table.md).[`_createCopy`](Table.md#_createcopy)

***

### \_createLines()

> `protected` **\_createLines**(): `void`

Defined in: [mobjects/table/Table.ts:328](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L328)

Create grid lines

#### Returns

`void`

#### Inherited from

[`Table`](Table.md).[`_createLines`](Table.md#_createlines)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [core/VGroup.ts:463](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L463)

Create the Three.js backing object for this VGroup.
A VGroup is simply a THREE.Group that contains children.

#### Returns

`Object3D`

#### Inherited from

[`Table`](Table.md).[`_createThreeObject`](Table.md#_createthreeobject)

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

[`Table`](Table.md).[`_getBoundingBox`](Table.md#_getboundingbox)

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

[`Table`](Table.md).[`_getEdgeInDirection`](Table.md#_getedgeindirection)

***

### \_getMobjectBounds()

> `protected` **\_getMobjectBounds**(`mobject`): `object`

Defined in: [mobjects/table/Table.ts:263](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L263)

Get bounds of a mobject

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`

#### Inherited from

[`Table`](Table.md).[`_getMobjectBounds`](Table.md#_getmobjectbounds)

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

[`Table`](Table.md).[`_interpolatePointList2D`](Table.md#_interpolatepointlist2d)

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

[`Table`](Table.md).[`_interpolatePointList3D`](Table.md#_interpolatepointlist3d)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:896](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L896)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Table`](Table.md).[`_markDirty`](Table.md#_markdirty)

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

[`Table`](Table.md).[`_markDirtyUpward`](Table.md#_markdirtyupward)

***

### \_pointsToCurvePath()

> `protected` **\_pointsToCurvePath**(): `CurvePath`\<`Vector3`\>

Defined in: [core/VMobject.ts:537](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L537)

Convert points to a THREE.CurvePath for stroke rendering

#### Returns

`CurvePath`\<`Vector3`\>

#### Inherited from

[`Table`](Table.md).[`_pointsToCurvePath`](Table.md#_pointstocurvepath)

***

### \_pointsToShape()

> `protected` **\_pointsToShape**(): `Shape`

Defined in: [core/VMobject.ts:495](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L495)

Convert Bezier control points to a Three.js Shape for filled rendering.

#### Returns

`Shape`

THREE.Shape representing the path

#### Inherited from

[`Table`](Table.md).[`_pointsToShape`](Table.md#_pointstoshape)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [core/VMobject.ts:1014](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L1014)

Sync material properties to Three.js

#### Returns

`void`

#### Inherited from

[`Table`](Table.md).[`_syncMaterialToThree`](Table.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:850](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L850)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Table`](Table.md).[`_syncToThree`](Table.md#_synctothree)

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

[`Table`](Table.md).[`_updateGeometry`](Table.md#_updategeometry)

***

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<[`VMobject`](VMobject.md)\>

Defined in: [core/VGroup.ts:508](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L508)

Iterate over all vmobjects in the group.

#### Returns

`Iterator`\<[`VMobject`](VMobject.md)\>

#### Inherited from

[`Table`](Table.md).[`[iterator]`](Table.md#iterator)

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

[`Table`](Table.md).[`add`](Table.md#add)

***

### addHighlight()

> **addHighlight**(`row`, `col`, `color`, `opacity`): [`Rectangle`](Rectangle.md)

Defined in: [mobjects/table/Table.ts:486](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L486)

Add a highlight rectangle behind a cell

#### Parameters

##### row

`number`

Row index (0-based)

##### col

`number`

Column index (0-based)

##### color

`string` = `YELLOW`

Highlight color. Default: YELLOW

##### opacity

`number` = `0.3`

Fill opacity. Default: 0.3

#### Returns

[`Rectangle`](Rectangle.md)

The created Rectangle for further customization

#### Inherited from

[`Table`](Table.md).[`addHighlight`](Table.md#addhighlight)

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

[`Table`](Table.md).[`addPoints`](Table.md#addpoints)

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

[`Table`](Table.md).[`addPointsAsCorners`](Table.md#addpointsascorners)

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

[`Table`](Table.md).[`addUpdater`](Table.md#addupdater)

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

[`Table`](Table.md).[`addVMobjects`](Table.md#addvmobjects)

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

[`Table`](Table.md).[`alignPoints`](Table.md#alignpoints)

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

[`Table`](Table.md).[`alignTo`](Table.md#alignto)

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

[`Table`](Table.md).[`applyFunction`](Table.md#applyfunction)

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

[`Table`](Table.md).[`applyToFamily`](Table.md#applytofamily)

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

[`Table`](Table.md).[`arrange`](Table.md#arrange)

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

[`Table`](Table.md).[`arrangeInGrid`](Table.md#arrangeingrid)

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

[`Table`](Table.md).[`arrangeSubmobjects`](Table.md#arrangesubmobjects)

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

[`Table`](Table.md).[`become`](Table.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:811](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L811)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Table`](Table.md).[`center`](Table.md#center)

***

### clearPoints()

> **clearPoints**(): `this`

Defined in: [core/VMobject.ts:341](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L341)

Clear all points

#### Returns

`this`

#### Inherited from

[`Table`](Table.md).[`clearPoints`](Table.md#clearpoints)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:989](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L989)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Table`](Table.md).[`clearUpdaters`](Table.md#clearupdaters)

***

### copy()

> **copy**(): [`VMobject`](VMobject.md)

Defined in: [core/VGroup.ts:485](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L485)

Copy this VGroup.

#### Returns

[`VMobject`](VMobject.md)

#### Inherited from

[`Table`](Table.md).[`copy`](Table.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/VMobject.ts:1113](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L1113)

Clean up Three.js resources

#### Returns

`void`

#### Inherited from

[`Table`](Table.md).[`dispose`](Table.md#dispose)

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

[`Table`](Table.md).[`filter`](Table.md#filter)

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

[`Table`](Table.md).[`flip`](Table.md#flip)

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

[`Table`](Table.md).[`forEach`](Table.md#foreach)

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

[`Table`](Table.md).[`generateTarget`](Table.md#generatetarget)

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

[`Table`](Table.md).[`get`](Table.md#get)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:760](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L760)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`Table`](Table.md).[`getBottom`](Table.md#getbottom)

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

[`Table`](Table.md).[`getBounds`](Table.md#getbounds)

***

### getCell()

> **getCell**(`row`, `col`): [`Mobject`](Mobject.md)

Defined in: [mobjects/table/Table.ts:399](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L399)

Get a specific cell entry by row and column (0-indexed, data only)

#### Parameters

##### row

`number`

Row index (0-based)

##### col

`number`

Column index (0-based)

#### Returns

[`Mobject`](Mobject.md)

The mobject at that cell

#### Inherited from

[`Table`](Table.md).[`getCell`](Table.md#getcell)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/VGroup.ts:137](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L137)

Get the center of the group (average of all children centers).

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`Table`](Table.md).[`getCenter`](Table.md#getcenter)

***

### getColLabels()

> **getColLabels**(): [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:460](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L460)

Get column labels as a VGroup

#### Returns

[`VGroup`](VGroup.md)

#### Inherited from

[`Table`](Table.md).[`getColLabels`](Table.md#getcollabels)

***

### getColumn()

> **getColumn**(`col`): [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:423](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L423)

Get a column as a VGroup (0-indexed, data only)

#### Parameters

##### col

`number`

Column index (0-based)

#### Returns

[`VGroup`](VGroup.md)

VGroup containing all entries in the column

#### Inherited from

[`Table`](Table.md).[`getColumn`](Table.md#getcolumn)

***

### getCombinedPoints()

> **getCombinedPoints**(): `number`[][]

Defined in: [core/VGroup.ts:449](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L449)

Get combined path points from all children.

#### Returns

`number`[][]

Combined array of points from all children

#### Inherited from

[`Table`](Table.md).[`getCombinedPoints`](Table.md#getcombinedpoints)

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

[`Table`](Table.md).[`getEdge`](Table.md#getedge)

***

### getEntries()

> **getEntries**(): [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:440](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L440)

Get all data entries as a VGroup

#### Returns

[`VGroup`](VGroup.md)

VGroup containing all data entries

#### Inherited from

[`Table`](Table.md).[`getEntries`](Table.md#getentries)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:950](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L950)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Table`](Table.md).[`getFamily`](Table.md#getfamily)

***

### getHorizontalLines()

> **getHorizontalLines**(): [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:467](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L467)

Get all horizontal lines

#### Returns

[`VGroup`](VGroup.md)

#### Inherited from

[`Table`](Table.md).[`getHorizontalLines`](Table.md#gethorizontallines)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:768](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L768)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`Table`](Table.md).[`getLeft`](Table.md#getleft)

***

### getNumCols()

> **getNumCols**(): `number`

Defined in: [mobjects/table/Table.ts:546](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L546)

Get the number of columns (data only)

#### Returns

`number`

#### Inherited from

[`Table`](Table.md).[`getNumCols`](Table.md#getnumcols)

***

### getNumRows()

> **getNumRows**(): `number`

Defined in: [mobjects/table/Table.ts:539](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L539)

Get the number of rows (data only)

#### Returns

`number`

#### Inherited from

[`Table`](Table.md).[`getNumRows`](Table.md#getnumrows)

***

### getPoints()

> **getPoints**(): `number`[][]

Defined in: [core/VGroup.ts:558](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VGroup.ts#L558)

Get all 3D points from the VGroup.

#### Returns

`number`[][]

#### Inherited from

[`Table`](Table.md).[`getPoints`](Table.md#getpoints)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:776](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L776)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`Table`](Table.md).[`getRight`](Table.md#getright)

***

### getRow()

> **getRow**(`row`): [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:411](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L411)

Get a row as a VGroup (0-indexed, data only)

#### Parameters

##### row

`number`

Row index (0-based)

#### Returns

[`VGroup`](VGroup.md)

VGroup containing all entries in the row

#### Inherited from

[`Table`](Table.md).[`getRow`](Table.md#getrow)

***

### getRowLabels()

> **getRowLabels**(): [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:453](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L453)

Get row labels as a VGroup

#### Returns

[`VGroup`](VGroup.md)

#### Inherited from

[`Table`](Table.md).[`getRowLabels`](Table.md#getrowlabels)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:923](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L923)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Table`](Table.md).[`getThreeObject`](Table.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:752](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L752)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`Table`](Table.md).[`getTop`](Table.md#gettop)

***

### getUnitVector()

> **getUnitVector**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/VMobject.ts:1068](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L1068)

Get the unit vector from the first to the last point of this VMobject,
accounting for the object's current rotation transform.

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Table`](Table.md).[`getUnitVector`](Table.md#getunitvector)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1006](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1006)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Table`](Table.md).[`getUpdaters`](Table.md#getupdaters)

***

### getVerticalLines()

> **getVerticalLines**(): [`VGroup`](VGroup.md)

Defined in: [mobjects/table/Table.ts:474](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L474)

Get all vertical lines

#### Returns

[`VGroup`](VGroup.md)

#### Inherited from

[`Table`](Table.md).[`getVerticalLines`](Table.md#getverticallines)

***

### getVisiblePoints()

> **getVisiblePoints**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:230](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L230)

Get points that should be visible (for rendering) as 2D Points

#### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`Table`](Table.md).[`getVisiblePoints`](Table.md#getvisiblepoints)

***

### getVisiblePoints3D()

> **getVisiblePoints3D**(): `number`[][]

Defined in: [core/VMobject.ts:238](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/VMobject.ts#L238)

Get points that should be visible (for rendering) as 3D arrays

#### Returns

`number`[][]

#### Inherited from

[`Table`](Table.md).[`getVisiblePoints3D`](Table.md#getvisiblepoints3d)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:998](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L998)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Table`](Table.md).[`hasUpdaters`](Table.md#hasupdaters)

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

[`Table`](Table.md).[`interpolate`](Table.md#interpolate)

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

[`Table`](Table.md).[`map`](Table.md#map)

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

[`Table`](Table.md).[`moveTo`](Table.md#moveto)

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

[`Table`](Table.md).[`moveToAligned`](Table.md#movetoaligned)

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

[`Table`](Table.md).[`nextTo`](Table.md#nextto)

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

[`Table`](Table.md).[`prepareForNonlinearTransform`](Table.md#preparefornonlineartransform)

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

[`Table`](Table.md).[`remove`](Table.md#remove)

***

### removeHighlight()

> **removeHighlight**(`row`, `col`): `this`

Defined in: [mobjects/table/Table.ts:526](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L526)

Remove a highlight from a cell

#### Parameters

##### row

`number`

Row index (0-based)

##### col

`number`

Column index (0-based)

#### Returns

`this`

#### Inherited from

[`Table`](Table.md).[`removeHighlight`](Table.md#removehighlight)

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

[`Table`](Table.md).[`removeUpdater`](Table.md#removeupdater)

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

[`Table`](Table.md).[`removeVMobjects`](Table.md#removevmobjects)

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

[`Table`](Table.md).[`restoreState`](Table.md#restorestate)

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

[`Table`](Table.md).[`rotate`](Table.md#rotate)

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

[`Table`](Table.md).[`rotateAboutOrigin`](Table.md#rotateaboutorigin)

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

[`Table`](Table.md).[`saveState`](Table.md#savestate)

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

[`Table`](Table.md).[`scale`](Table.md#scale)

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

[`Table`](Table.md).[`setColor`](Table.md#setcolor)

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

[`Table`](Table.md).[`setFill`](Table.md#setfill)

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

[`Table`](Table.md).[`setFillOpacity`](Table.md#setfillopacity)

***

### setLineColor()

> **setLineColor**(`color`): `this`

Defined in: [mobjects/table/Table.ts:553](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L553)

Set the color of grid lines

#### Parameters

##### color

`string`

#### Returns

`this`

#### Inherited from

[`Table`](Table.md).[`setLineColor`](Table.md#setlinecolor)

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

[`Table`](Table.md).[`setOpacity`](Table.md#setopacity)

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

[`Table`](Table.md).[`setPoints`](Table.md#setpoints)

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

[`Table`](Table.md).[`setPoints3D`](Table.md#setpoints3d)

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

[`Table`](Table.md).[`setPointsAsCorners`](Table.md#setpointsascorners)

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

[`Table`](Table.md).[`setStroke`](Table.md#setstroke)

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

[`Table`](Table.md).[`setStrokeWidth`](Table.md#setstrokewidth)

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

[`Table`](Table.md).[`setStyle`](Table.md#setstyle)

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

[`Table`](Table.md).[`setX`](Table.md#setx)

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

[`Table`](Table.md).[`setY`](Table.md#sety)

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

[`Table`](Table.md).[`setZ`](Table.md#setz)

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

[`Table`](Table.md).[`shift`](Table.md#shift)

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

[`Table`](Table.md).[`toCorner`](Table.md#tocorner)

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

[`Table`](Table.md).[`toEdge`](Table.md#toedge)

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

[`Table`](Table.md).[`update`](Table.md#update)
