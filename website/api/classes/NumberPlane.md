# Class: NumberPlane

Defined in: [mobjects/graphing/NumberPlane.ts:56](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/NumberPlane.ts#L56)

NumberPlane - A coordinate system with a background grid

Extends Axes to add a grid of background lines for better visualization
of the coordinate space.

## Example

```typescript
// Create a simple number plane
const plane = new NumberPlane();

// Create a number plane with custom grid styling
const styledPlane = new NumberPlane({
  xRange: [-5, 5, 1],
  yRange: [-3, 3, 1],
  backgroundLineStyle: {
    color: '#334455',
    strokeWidth: 0.5,
    opacity: 0.3
  }
});
```

## Extends

- [`Axes`](Axes.md)

## Constructors

### Constructor

> **new NumberPlane**(`options`): `NumberPlane`

Defined in: [mobjects/graphing/NumberPlane.ts:64](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/NumberPlane.ts#L64)

#### Parameters

##### options

[`NumberPlaneOptions`](../interfaces/NumberPlaneOptions.md) = `{}`

#### Returns

`NumberPlane`

#### Overrides

[`Axes`](Axes.md).[`constructor`](Axes.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Axes`](Axes.md).[`__savedMobjectState`](Axes.md#__savedmobjectstate)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`Axes`](Axes.md).[`_dirty`](Axes.md#_dirty)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Axes`](Axes.md).[`_opacity`](Axes.md#_opacity)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`Axes`](Axes.md).[`_style`](Axes.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`Axes`](Axes.md).[`_threeObject`](Axes.md#_threeobject)

***

### \_tipLength

> `protected` **\_tipLength**: `number`

Defined in: [mobjects/graphing/Axes.ts:73](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L73)

#### Inherited from

[`Axes`](Axes.md).[`_tipLength`](Axes.md#_tiplength)

***

### \_tips

> `protected` **\_tips**: `boolean`

Defined in: [mobjects/graphing/Axes.ts:72](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L72)

#### Inherited from

[`Axes`](Axes.md).[`_tips`](Axes.md#_tips)

***

### \_xLength

> `protected` **\_xLength**: `number`

Defined in: [mobjects/graphing/Axes.ts:70](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L70)

#### Inherited from

[`Axes`](Axes.md).[`_xLength`](Axes.md#_xlength)

***

### \_xRange

> `protected` **\_xRange**: \[`number`, `number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:68](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L68)

#### Inherited from

[`Axes`](Axes.md).[`_xRange`](Axes.md#_xrange)

***

### \_xTip

> `protected` **\_xTip**: [`VMobject`](VMobject.md) = `null`

Defined in: [mobjects/graphing/Axes.ts:74](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L74)

#### Inherited from

[`Axes`](Axes.md).[`_xTip`](Axes.md#_xtip)

***

### \_yLength

> `protected` **\_yLength**: `number`

Defined in: [mobjects/graphing/Axes.ts:71](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L71)

#### Inherited from

[`Axes`](Axes.md).[`_yLength`](Axes.md#_ylength)

***

### \_yRange

> `protected` **\_yRange**: \[`number`, `number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:69](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L69)

#### Inherited from

[`Axes`](Axes.md).[`_yRange`](Axes.md#_yrange)

***

### \_yTip

> `protected` **\_yTip**: [`VMobject`](VMobject.md) = `null`

Defined in: [mobjects/graphing/Axes.ts:75](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L75)

#### Inherited from

[`Axes`](Axes.md).[`_yTip`](Axes.md#_ytip)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Axes`](Axes.md).[`children`](Axes.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`Axes`](Axes.md).[`fillOpacity`](Axes.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Axes`](Axes.md).[`id`](Axes.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Axes`](Axes.md).[`parent`](Axes.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Axes`](Axes.md).[`position`](Axes.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Axes`](Axes.md).[`rotation`](Axes.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Axes`](Axes.md).[`savedState`](Axes.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Axes`](Axes.md).[`scaleVector`](Axes.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Axes`](Axes.md).[`strokeWidth`](Axes.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Axes`](Axes.md).[`targetCopy`](Axes.md#targetcopy)

***

### xAxis

> **xAxis**: [`NumberLine`](NumberLine.md)

Defined in: [mobjects/graphing/Axes.ts:64](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L64)

The x-axis NumberLine

#### Inherited from

[`Axes`](Axes.md).[`xAxis`](Axes.md#xaxis)

***

### yAxis

> **yAxis**: [`NumberLine`](NumberLine.md)

Defined in: [mobjects/graphing/Axes.ts:66](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L66)

The y-axis NumberLine

#### Inherited from

[`Axes`](Axes.md).[`yAxis`](Axes.md#yaxis)

## Accessors

### color

#### Get Signature

> **get** **color**(): `string`

Defined in: [core/Mobject.ts:67](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L67)

##### Returns

`string`

#### Set Signature

> **set** **color**(`value`): `void`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L71)

##### Parameters

###### value

`string`

##### Returns

`void`

#### Inherited from

[`Axes`](Axes.md).[`color`](Axes.md#color)

***

### fillColor

#### Get Signature

> **get** **fillColor**(): `string`

Defined in: [core/Mobject.ts:473](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L473)

Get the fill color

##### Returns

`string`

#### Set Signature

> **set** **fillColor**(`color`): `void`

Defined in: [core/Mobject.ts:480](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L480)

Set the fill color

##### Parameters

###### color

`string`

##### Returns

`void`

#### Inherited from

[`Axes`](Axes.md).[`fillColor`](Axes.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:933](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L933)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Axes`](Axes.md).[`isDirty`](Axes.md#isdirty)

***

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [core/Group.ts:255](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L255)

Get the number of mobjects in this group.

##### Returns

`number`

#### Inherited from

[`Axes`](Axes.md).[`length`](Axes.md#length)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/Mobject.ts:145](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L145)

Get the overall opacity of the mobject

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/Mobject.ts:152](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L152)

Set the overall opacity of the mobject

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`Axes`](Axes.md).[`opacity`](Axes.md#opacity)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Axes`](Axes.md).[`style`](Axes.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Axes`](Axes.md).[`submobjects`](Axes.md#submobjects)

***

### xRange

#### Get Signature

> **get** **xRange**(): \[`number`, `number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:309](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L309)

Public accessor for x range (matches Python Manim's ax.x_range)

##### Returns

\[`number`, `number`, `number`\]

#### Inherited from

[`Axes`](Axes.md).[`xRange`](Axes.md#xrange)

***

### yRange

#### Get Signature

> **get** **yRange**(): \[`number`, `number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:321](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L321)

Public accessor for y range (matches Python Manim's ax.y_range)

##### Returns

\[`number`, `number`, `number`\]

#### Inherited from

[`Axes`](Axes.md).[`yRange`](Axes.md#yrange)

## Methods

### \_createCopy()

> `protected` **\_createCopy**(): `NumberPlane`

Defined in: [mobjects/graphing/NumberPlane.ts:309](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/NumberPlane.ts#L309)

Create a copy of this NumberPlane

#### Returns

`NumberPlane`

#### Overrides

[`Axes`](Axes.md).[`_createCopy`](Axes.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [core/Group.ts:233](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L233)

Create the Three.js backing object for this Group.
A group is simply a THREE.Group that contains children.

#### Returns

`Object3D`

#### Inherited from

[`Axes`](Axes.md).[`_createThreeObject`](Axes.md#_createthreeobject)

***

### \_getBoundingBox()

> `protected` **\_getBoundingBox**(): `object`

Defined in: [core/Mobject.ts:748](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L748)

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

[`Axes`](Axes.md).[`_getBoundingBox`](Axes.md#_getboundingbox)

***

### \_getEdgeInDirection()

> `protected` **\_getEdgeInDirection**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:731](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L731)

Get the edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to get edge in

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Axes`](Axes.md).[`_getEdgeInDirection`](Axes.md#_getedgeindirection)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:913](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L913)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Axes`](Axes.md).[`_markDirty`](Axes.md#_markdirty)

***

### \_markDirtyUpward()

> **\_markDirtyUpward**(): `void`

Defined in: [core/Mobject.ts:922](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L922)

Mark this mobject and all ancestors as needing sync.
Use when a deep child's geometry changes and the parent tree must re-traverse.
Short-circuits if this node is already dirty (ancestors must be dirty too).

#### Returns

`void`

#### Inherited from

[`Axes`](Axes.md).[`_markDirtyUpward`](Axes.md#_markdirtyupward)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [core/Mobject.ts:905](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L905)

Sync material-specific properties. Override in subclasses.

#### Returns

`void`

#### Inherited from

[`Axes`](Axes.md).[`_syncMaterialToThree`](Axes.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:867](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L867)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Axes`](Axes.md).[`_syncToThree`](Axes.md#_synctothree)

***

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<[`Mobject`](Mobject.md)\>

Defined in: [core/Group.ts:271](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L271)

Iterate over all mobjects in the group.

#### Returns

`Iterator`\<[`Mobject`](Mobject.md)\>

#### Inherited from

[`Axes`](Axes.md).[`[iterator]`](Axes.md#iterator)

***

### add()

> **add**(`mobject`): `this`

Defined in: [core/Group.ts:31](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L31)

Add a mobject to this group.

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

Mobject to add

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`add`](Axes.md#add)

***

### addUpdater()

> **addUpdater**(`updater`, `callOnAdd`): `this`

Defined in: [core/Mobject.ts:981](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L981)

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

[`Axes`](Axes.md).[`addUpdater`](Axes.md#addupdater)

***

### alignTo()

> **alignTo**(`target`, `direction`): `this`

Defined in: [core/Mobject.ts:696](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L696)

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

[`Axes`](Axes.md).[`alignTo`](Axes.md#alignto)

***

### applyFunction()

> **applyFunction**(`fn`): `this`

Defined in: [core/Mobject.ts:1048](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1048)

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

[`Axes`](Axes.md).[`applyFunction`](Axes.md#applyfunction)

***

### applyToFamily()

> **applyToFamily**(`func`): `this`

Defined in: [core/Mobject.ts:956](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L956)

Apply a function to this mobject and all descendants

#### Parameters

##### func

(`mobject`) => `void`

#### Returns

`this`

#### Inherited from

[`Axes`](Axes.md).[`applyToFamily`](Axes.md#applytofamily)

***

### become()

> **become**(`other`): `this`

Defined in: [core/Mobject.ts:563](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L563)

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

[`Axes`](Axes.md).[`become`](Axes.md#become)

***

### c2p()

> **c2p**(`x`, `y`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/graphing/Axes.ts:240](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L240)

Alias for coordsToPoint (matches Python Manim's c2p shorthand)

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Axes`](Axes.md).[`c2p`](Axes.md#c2p)

***

### c2pX()

> **c2pX**(`x`): `number`

Defined in: [mobjects/graphing/Axes.ts:349](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L349)

Convert an x coordinate to visual x position

#### Parameters

##### x

`number`

#### Returns

`number`

#### Inherited from

[`Axes`](Axes.md).[`c2pX`](Axes.md#c2px)

***

### c2pY()

> **c2pY**(`y`): `number`

Defined in: [mobjects/graphing/Axes.ts:356](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L356)

Convert a y coordinate to visual y position

#### Parameters

##### y

`number`

#### Returns

`number`

#### Inherited from

[`Axes`](Axes.md).[`c2pY`](Axes.md#c2py)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:828](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L828)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`center`](Axes.md#center)

***

### clear()

> **clear**(): `this`

Defined in: [core/Group.ts:73](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L73)

Remove all children from this group.

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`clear`](Axes.md#clear)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:1006](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1006)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`clearUpdaters`](Axes.md#clearupdaters)

***

### coordsToPoint()

> **coordsToPoint**(`x`, `y`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/graphing/Axes.ts:244](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L244)

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Axes`](Axes.md).[`coordsToPoint`](Axes.md#coordstopoint)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:536](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L536)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`Axes`](Axes.md).[`copy`](Axes.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/Mobject.ts:1207](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1207)

Clean up Three.js resources.

#### Returns

`void`

#### Inherited from

[`Axes`](Axes.md).[`dispose`](Axes.md#dispose)

***

### filter()

> **filter**(`fn`): [`Group`](Group.md)

Defined in: [core/Group.ts:299](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L299)

Filter mobjects in the group.

#### Parameters

##### fn

(`mobject`, `index`) => `boolean`

Filter predicate

#### Returns

[`Group`](Group.md)

New Group with filtered mobjects

#### Inherited from

[`Axes`](Axes.md).[`filter`](Axes.md#filter)

***

### flip()

> **flip**(`axis`): `this`

Defined in: [core/Mobject.ts:364](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L364)

Flip the mobject along an axis (mirror reflection).

#### Parameters

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis to flip across, defaults to RIGHT ([1,0,0]) for horizontal flip

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`flip`](Axes.md#flip)

***

### forEach()

> **forEach**(`fn`): `this`

Defined in: [core/Group.ts:280](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L280)

Apply a function to each mobject in the group.

#### Parameters

##### fn

(`mobject`, `index`) => `void`

Function to apply

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`forEach`](Axes.md#foreach)

***

### generateTarget()

> **generateTarget**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:1116](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1116)

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

[`Axes`](Axes.md).[`generateTarget`](Axes.md#generatetarget)

***

### get()

> **get**(`index`): [`Mobject`](Mobject.md)

Defined in: [core/Group.ts:264](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L264)

Get a mobject by index.

#### Parameters

##### index

`number`

Index of the mobject

#### Returns

[`Mobject`](Mobject.md)

The mobject at the given index, or undefined

#### Inherited from

[`Axes`](Axes.md).[`get`](Axes.md#get)

***

### getArea()

> **getArea**(`graph`, `xRange`, `options`): [`VMobject`](VMobject.md)

Defined in: [mobjects/graphing/Axes.ts:584](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L584)

Create a filled area between a graph and either the x-axis or another graph.

#### Parameters

##### graph

[`FunctionGraph`](FunctionGraph.md)

The primary graph boundary

##### xRange

\[`number`, `number`\]

The x interval [start, end]

##### options

Area options

###### boundedGraph?

[`FunctionGraph`](FunctionGraph.md)

###### color?

`string`

###### opacity?

`number`

###### strokeWidth?

`number`

#### Returns

[`VMobject`](VMobject.md)

A filled VMobject representing the area

#### Inherited from

[`Axes`](Axes.md).[`getArea`](Axes.md#getarea)

***

### getAxisLabels()

> **getAxisLabels**(`xLabelOrOpts?`, `yLabelArg?`): [`Group`](Group.md)

Defined in: [mobjects/graphing/Axes.ts:381](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L381)

Get axis labels ("x" and "y" by default).
Labels can be LaTeX strings or pre-built Mobject instances (e.g. Tex, MathTex).

#### Parameters

##### xLabelOrOpts?

`string` | [`Mobject`](Mobject.md) | \{ `xLabel?`: `string` \| [`Mobject`](Mobject.md); `yLabel?`: `string` \| [`Mobject`](Mobject.md); \}

##### yLabelArg?

`string` | [`Mobject`](Mobject.md)

#### Returns

[`Group`](Group.md)

A Group containing the two labels

#### Inherited from

[`Axes`](Axes.md).[`getAxisLabels`](Axes.md#getaxislabels)

***

### getBackgroundLines()

> **getBackgroundLines**(): [`Group`](Group.md)

Defined in: [mobjects/graphing/NumberPlane.ts:257](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/NumberPlane.ts#L257)

Get the background lines Group

#### Returns

[`Group`](Group.md)

Group containing all background grid lines

***

### getBackgroundLineStyle()

> **getBackgroundLineStyle**(): [`BackgroundLineStyle`](../interfaces/BackgroundLineStyle.md)

Defined in: [mobjects/graphing/NumberPlane.ts:302](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/NumberPlane.ts#L302)

Get the background line style

#### Returns

[`BackgroundLineStyle`](../interfaces/BackgroundLineStyle.md)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:777](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L777)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`Axes`](Axes.md).[`getBottom`](Axes.md#getbottom)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [core/Mobject.ts:640](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L640)

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

[`Axes`](Axes.md).[`getBounds`](Axes.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Group.ts:86](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L86)

Get the center of the group (average of all children centers).
Children maintain world-space coordinates, so no group position offset
is added (shift/moveTo only update children, not group position).

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`Axes`](Axes.md).[`getCenter`](Axes.md#getcenter)

***

### getEdge()

> **getEdge**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:761](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L761)

Get a specific edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to the edge point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Axes`](Axes.md).[`getEdge`](Axes.md#getedge)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:967](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L967)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Axes`](Axes.md).[`getFamily`](Axes.md#getfamily)

***

### getGraphLabel()

> **getGraphLabel**(`graph`, `labelOrOptions?`, `options?`): [`MathTex`](MathTex.md)

Defined in: [mobjects/graphing/Axes.ts:426](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L426)

Get a label for a graph at a specific x-value.
Matches Python Manim's axes.get_graph_label() API.

#### Parameters

##### graph

[`FunctionGraph`](FunctionGraph.md)

The FunctionGraph to label

##### labelOrOptions?

`string` | \{ `color?`: `string`; `direction?`: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md); `label?`: `string`; `xVal?`: `number`; \}

##### options?

Positioning options

###### color?

`string`

###### direction?

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

###### label?

`string`

###### xVal?

`number`

#### Returns

[`MathTex`](MathTex.md)

A MathTex label positioned near the graph

#### Inherited from

[`Axes`](Axes.md).[`getGraphLabel`](Axes.md#getgraphlabel)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:785](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L785)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`Axes`](Axes.md).[`getLeft`](Axes.md#getleft)

***

### getOrigin()

> **getOrigin**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/graphing/Axes.ts:342](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L342)

Get the origin point in visual coordinates

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Axes`](Axes.md).[`getOrigin`](Axes.md#getorigin)

***

### getRiemannRectangles()

> **getRiemannRectangles**(`graph`, `options`): [`VGroup`](VGroup.md)

Defined in: [mobjects/graphing/Axes.ts:514](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L514)

Create Riemann sum rectangles under a graph.

#### Parameters

##### graph

[`FunctionGraph`](FunctionGraph.md)

The FunctionGraph to approximate

##### options

Riemann rectangle options

###### color?

`string`

###### dx?

`number`

###### fillOpacity?

`number`

###### strokeColor?

`string`

###### strokeWidth?

`number`

###### xRange?

\[`number`, `number`\]

#### Returns

[`VGroup`](VGroup.md)

A VGroup of filled rectangles

#### Inherited from

[`Axes`](Axes.md).[`getRiemannRectangles`](Axes.md#getriemannrectangles)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:793](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L793)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`Axes`](Axes.md).[`getRight`](Axes.md#getright)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:940](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L940)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Axes`](Axes.md).[`getThreeObject`](Axes.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:769](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L769)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`Axes`](Axes.md).[`getTop`](Axes.md#gettop)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1023](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1023)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Axes`](Axes.md).[`getUpdaters`](Axes.md#getupdaters)

***

### getVerticalLine()

> **getVerticalLine**(`point`, `options`): [`VMobject`](VMobject.md)

Defined in: [mobjects/graphing/Axes.ts:474](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L474)

Create a vertical line from the x-axis to a point.

#### Parameters

##### point

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

The target point [x, y, z] in visual coordinates

##### options

Line options

###### color?

`string`

###### lineFunc?

*typeof* [`Line`](Line.md) \| *typeof* [`DashedLine`](DashedLine.md)

###### strokeWidth?

`number`

#### Returns

[`VMobject`](VMobject.md)

A Line from the x-axis to the point

#### Inherited from

[`Axes`](Axes.md).[`getVerticalLine`](Axes.md#getverticalline)

***

### getXAxis()

> **getXAxis**(): [`NumberLine`](NumberLine.md)

Defined in: [mobjects/graphing/Axes.ts:290](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L290)

Get the x-axis NumberLine

#### Returns

[`NumberLine`](NumberLine.md)

#### Inherited from

[`Axes`](Axes.md).[`getXAxis`](Axes.md#getxaxis)

***

### getXLength()

> **getXLength**(): `number`

Defined in: [mobjects/graphing/Axes.ts:328](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L328)

Get the visual x length

#### Returns

`number`

#### Inherited from

[`Axes`](Axes.md).[`getXLength`](Axes.md#getxlength)

***

### getXRange()

> **getXRange**(): \[`number`, `number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:304](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L304)

Get the x range

#### Returns

\[`number`, `number`, `number`\]

#### Inherited from

[`Axes`](Axes.md).[`getXRange`](Axes.md#getxrange)

***

### getYAxis()

> **getYAxis**(): [`NumberLine`](NumberLine.md)

Defined in: [mobjects/graphing/Axes.ts:297](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L297)

Get the y-axis NumberLine

#### Returns

[`NumberLine`](NumberLine.md)

#### Inherited from

[`Axes`](Axes.md).[`getYAxis`](Axes.md#getyaxis)

***

### getYLength()

> **getYLength**(): `number`

Defined in: [mobjects/graphing/Axes.ts:335](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L335)

Get the visual y length

#### Returns

`number`

#### Inherited from

[`Axes`](Axes.md).[`getYLength`](Axes.md#getylength)

***

### getYRange()

> **getYRange**(): \[`number`, `number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:316](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L316)

Get the y range

#### Returns

\[`number`, `number`, `number`\]

#### Inherited from

[`Axes`](Axes.md).[`getYRange`](Axes.md#getyrange)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:1015](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1015)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Axes`](Axes.md).[`hasUpdaters`](Axes.md#hasupdaters)

***

### i2gp()

> **i2gp**(`x`, `graph`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/graphing/Axes.ts:495](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L495)

Input to graph point: convert an x value to the visual point on a graph.
Shorthand for graph.getPointFromX(x).

#### Parameters

##### x

`number`

The x coordinate in graph space

##### graph

[`FunctionGraph`](FunctionGraph.md)

The FunctionGraph

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

The visual coordinates on the graph

#### Inherited from

[`Axes`](Axes.md).[`i2gp`](Axes.md#i2gp)

***

### inputToGraphPoint()

> **inputToGraphPoint**(`x`, `graph`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/graphing/Axes.ts:504](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L504)

Alias for i2gp — convert an x value to the visual point on a graph.
Matches Python Manim's axes.input_to_graph_point() API.

#### Parameters

##### x

`number`

##### graph

[`FunctionGraph`](FunctionGraph.md)

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Axes`](Axes.md).[`inputToGraphPoint`](Axes.md#inputtographpoint)

***

### map()

> **map**\<`T`\>(`fn`): `T`[]

Defined in: [core/Group.ts:290](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L290)

Map over all mobjects in the group.

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`mobject`, `index`) => `T`

Mapping function

#### Returns

`T`[]

Array of mapped values

#### Inherited from

[`Axes`](Axes.md).[`map`](Axes.md#map)

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Group.ts:125](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L125)

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

[`Axes`](Axes.md).[`moveTo`](Axes.md#moveto)

***

### moveToAligned()

> **moveToAligned**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:718](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L718)

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

[`Axes`](Axes.md).[`moveToAligned`](Axes.md#movetoaligned)

***

### nextTo()

> **nextTo**(`target`, `direction`, `buff`): `this`

Defined in: [core/Mobject.ts:664](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L664)

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

[`Axes`](Axes.md).[`nextTo`](Axes.md#nextto)

***

### plot()

> **plot**(`func`, `options`): [`FunctionGraph`](FunctionGraph.md)

Defined in: [mobjects/graphing/Axes.ts:366](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L366)

Plot a function on these axes, returning a FunctionGraph.

#### Parameters

##### func

(`x`) => `number`

Function y = f(x)

##### options

`Partial`\<`Omit`\<[`FunctionGraphOptions`](../interfaces/FunctionGraphOptions.md), `"func"` \| `"axes"`\>\> = `{}`

Additional FunctionGraph options (color, strokeWidth, etc.)

#### Returns

[`FunctionGraph`](FunctionGraph.md)

A FunctionGraph bound to these axes

#### Inherited from

[`Axes`](Axes.md).[`plot`](Axes.md#plot)

***

### plotLineGraph()

> **plotLineGraph**(`options`): [`VDict`](VDict.md)

Defined in: [mobjects/graphing/Axes.ts:676](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L676)

Plot a line graph connecting data points with straight line segments.
Returns a VDict with "line_graph" (the connecting line) and
"vertex_dots" (dots at each data point).

Matches Python Manim's axes.plot_line_graph() API.

#### Parameters

##### options

Line graph options

###### addVertexDots?

`boolean`

###### lineColor?

`string`

###### strokeWidth?

`number`

###### vertexDotRadius?

`number`

###### vertexDotStyle?

\{ `color?`: `string`; `fillOpacity?`: `number`; `strokeColor?`: `string`; `strokeWidth?`: `number`; \}

###### vertexDotStyle.color?

`string`

###### vertexDotStyle.fillOpacity?

`number`

###### vertexDotStyle.strokeColor?

`string`

###### vertexDotStyle.strokeWidth?

`number`

###### xValues

`number`[]

###### yValues

`number`[]

#### Returns

[`VDict`](VDict.md)

A VDict with "line_graph" and "vertex_dots" entries

#### Inherited from

[`Axes`](Axes.md).[`plotLineGraph`](Axes.md#plotlinegraph)

***

### pointToCoords()

> **pointToCoords**(`point`): \[`number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:268](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L268)

Convert visual point coordinates to graph coordinates

#### Parameters

##### point

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Visual point [x, y, z]

#### Returns

\[`number`, `number`\]

The graph coordinates [x, y]

#### Inherited from

[`Axes`](Axes.md).[`pointToCoords`](Axes.md#pointtocoords)

***

### prepareForNonlinearTransform()

> **prepareForNonlinearTransform**(`numPieces`): `this`

Defined in: [core/Mobject.ts:1068](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1068)

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

[`Axes`](Axes.md).[`prepareForNonlinearTransform`](Axes.md#preparefornonlineartransform)

***

### remove()

> **remove**(`mobject`): `this`

Defined in: [core/Group.ts:56](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L56)

Remove a mobject from this group.

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

Mobject to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`remove`](Axes.md#remove)

***

### removeUpdater()

> **removeUpdater**(`updater`): `this`

Defined in: [core/Mobject.ts:994](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L994)

Remove an updater function

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

The updater function to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`removeUpdater`](Axes.md#removeupdater)

***

### replace()

> **replace**(`target`, `stretch`): `this`

Defined in: [core/Mobject.ts:593](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L593)

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

[`Axes`](Axes.md).[`replace`](Axes.md#replace)

***

### restoreState()

> **restoreState**(): `boolean`

Defined in: [core/Mobject.ts:1162](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1162)

Restore this mobject to its previously saved state (from saveState).
Uses the deep copy stored on `this.savedState` to restore all properties.

#### Returns

`boolean`

true if state was restored, false if no saved state exists

#### Inherited from

[`Axes`](Axes.md).[`restoreState`](Axes.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axis`): `this`

Defined in: [core/Group.ts:155](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L155)

Rotate all children around an axis.
Only children are rotated to avoid double-counting with Three.js hierarchy.

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

[`Axes`](Axes.md).[`rotate`](Axes.md#rotate)

***

### rotateAboutOrigin()

> **rotateAboutOrigin**(`angle`, `axis`): `this`

Defined in: [core/Mobject.ts:355](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L355)

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

[`Axes`](Axes.md).[`rotateAboutOrigin`](Axes.md#rotateaboutorigin)

***

### saveState()

> **saveState**(): `this`

Defined in: [core/Mobject.ts:1137](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1137)

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

[`Axes`](Axes.md).[`saveState`](Axes.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Group.ts:169](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L169)

Scale all children.
Only children are scaled to avoid double-counting with Three.js hierarchy.

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`scale`](Axes.md#scale)

***

### setBackgroundLineStyle()

> **setBackgroundLineStyle**(`style`): `this`

Defined in: [mobjects/graphing/NumberPlane.ts:290](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/NumberPlane.ts#L290)

Set the background line style

#### Parameters

##### style

`Partial`\<[`BackgroundLineStyle`](../interfaces/BackgroundLineStyle.md)\>

#### Returns

`this`

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/Group.ts:182](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L182)

Set the color of all children.

#### Parameters

##### color

`string`

CSS color string

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`setColor`](Axes.md#setcolor)

***

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/Mobject.ts:460](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L460)

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

[`Axes`](Axes.md).[`setFill`](Axes.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Group.ts:221](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L221)

Set the fill opacity of all children.

#### Parameters

##### opacity

`number`

Fill opacity (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`setFillOpacity`](Axes.md#setfillopacity)

***

### setIncludeBackgroundLines()

> **setIncludeBackgroundLines**(`include`): `this`

Defined in: [mobjects/graphing/NumberPlane.ts:264](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/NumberPlane.ts#L264)

Set whether to show background lines

#### Parameters

##### include

`boolean`

#### Returns

`this`

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [core/Group.ts:195](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L195)

Set the opacity of all children.

#### Parameters

##### opacity

`number`

Opacity value (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`setOpacity`](Axes.md#setopacity)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Group.ts:208](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L208)

Set the stroke width of all children.

#### Parameters

##### width

`number`

Stroke width in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`setStrokeWidth`](Axes.md#setstrokewidth)

***

### setStyle()

> **setStyle**(`style`): `this`

Defined in: [core/Mobject.ts:167](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L167)

Set style properties

#### Parameters

##### style

`Partial`\<[`MobjectStyle`](../interfaces/MobjectStyle.md)\>

#### Returns

`this`

#### Inherited from

[`Axes`](Axes.md).[`setStyle`](Axes.md#setstyle)

***

### setX()

> **setX**(`x`): `this`

Defined in: [core/Mobject.ts:801](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L801)

Set the x-coordinate of this mobject's center, preserving y and z.
Matches Manim Python's set_x() behavior.

#### Parameters

##### x

`number`

#### Returns

`this`

#### Inherited from

[`Axes`](Axes.md).[`setX`](Axes.md#setx)

***

### setY()

> **setY**(`y`): `this`

Defined in: [core/Mobject.ts:810](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L810)

Set the y-coordinate of this mobject's center, preserving x and z.
Matches Manim Python's set_y() behavior.

#### Parameters

##### y

`number`

#### Returns

`this`

#### Inherited from

[`Axes`](Axes.md).[`setY`](Axes.md#sety)

***

### setZ()

> **setZ**(`z`): `this`

Defined in: [core/Mobject.ts:819](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L819)

Set the z-coordinate of this mobject's center, preserving x and y.
Matches Manim Python's set_z() behavior.

#### Parameters

##### z

`number`

#### Returns

`this`

#### Inherited from

[`Axes`](Axes.md).[`setZ`](Axes.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Group.ts:111](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Group.ts#L111)

Shift all children by the given delta.
Only children are shifted (they maintain world-space coordinates).
The group's own position is NOT updated to avoid double-counting
when getCenter() computes the average of children centers.

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`Axes`](Axes.md).[`shift`](Axes.md#shift)

***

### toCorner()

> **toCorner**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:860](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L860)

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

[`Axes`](Axes.md).[`toCorner`](Axes.md#tocorner)

***

### toEdge()

> **toEdge**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:838](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L838)

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

[`Axes`](Axes.md).[`toEdge`](Axes.md#toedge)

***

### update()

> **update**(`dt`): `void`

Defined in: [core/Mobject.ts:1032](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1032)

Run all updaters with given dt
Called by Scene during render loop

#### Parameters

##### dt

`number`

Delta time in seconds since last frame

#### Returns

`void`

#### Inherited from

[`Axes`](Axes.md).[`update`](Axes.md#update)
