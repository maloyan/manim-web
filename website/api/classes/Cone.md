# Class: Cone

Defined in: [mobjects/three-d/Cylinder.ts:332](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L332)

Cone - A 3D cone mesh (cylinder with top radius = 0)

Creates a cone using Three.js CylinderGeometry with the top radius
set to 0.

## Example

```typescript
// Create a default cone
const cone = new Cone();

// Create a tall red cone
const tallCone = new Cone({
  radius: 0.5,
  height: 4,
  color: '#ff0000'
});
```

## Extends

- [`Cylinder`](Cylinder.md)

## Constructors

### Constructor

> **new Cone**(`options`): `Cone`

Defined in: [mobjects/three-d/Cylinder.ts:333](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L333)

#### Parameters

##### options

[`ConeOptions`](../interfaces/ConeOptions.md) = `{}`

#### Returns

`Cone`

#### Overrides

[`Cylinder`](Cylinder.md).[`constructor`](Cylinder.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Cylinder`](Cylinder.md).[`__savedMobjectState`](Cylinder.md#__savedmobjectstate)

***

### \_centerPoint

> `protected` **\_centerPoint**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/Cylinder.ts:64](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L64)

#### Inherited from

[`Cylinder`](Cylinder.md).[`_centerPoint`](Cylinder.md#_centerpoint)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`Cylinder`](Cylinder.md).[`_dirty`](Cylinder.md#_dirty)

***

### \_height

> `protected` **\_height**: `number`

Defined in: [mobjects/three-d/Cylinder.ts:60](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L60)

#### Inherited from

[`Cylinder`](Cylinder.md).[`_height`](Cylinder.md#_height)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Cylinder`](Cylinder.md).[`_opacity`](Cylinder.md#_opacity)

***

### \_openEnded

> `protected` **\_openEnded**: `boolean`

Defined in: [mobjects/three-d/Cylinder.ts:62](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L62)

#### Inherited from

[`Cylinder`](Cylinder.md).[`_openEnded`](Cylinder.md#_openended)

***

### \_radialSegments

> `protected` **\_radialSegments**: `number`

Defined in: [mobjects/three-d/Cylinder.ts:61](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L61)

#### Inherited from

[`Cylinder`](Cylinder.md).[`_radialSegments`](Cylinder.md#_radialsegments)

***

### \_radiusBottom

> `protected` **\_radiusBottom**: `number`

Defined in: [mobjects/three-d/Cylinder.ts:59](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L59)

#### Inherited from

[`Cylinder`](Cylinder.md).[`_radiusBottom`](Cylinder.md#_radiusbottom)

***

### \_radiusTop

> `protected` **\_radiusTop**: `number`

Defined in: [mobjects/three-d/Cylinder.ts:58](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L58)

#### Inherited from

[`Cylinder`](Cylinder.md).[`_radiusTop`](Cylinder.md#_radiustop)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`Cylinder`](Cylinder.md).[`_style`](Cylinder.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`Cylinder`](Cylinder.md).[`_threeObject`](Cylinder.md#_threeobject)

***

### \_wireframe

> `protected` **\_wireframe**: `boolean`

Defined in: [mobjects/three-d/Cylinder.ts:63](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L63)

#### Inherited from

[`Cylinder`](Cylinder.md).[`_wireframe`](Cylinder.md#_wireframe)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Cylinder`](Cylinder.md).[`children`](Cylinder.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`Cylinder`](Cylinder.md).[`fillOpacity`](Cylinder.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Cylinder`](Cylinder.md).[`id`](Cylinder.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Cylinder`](Cylinder.md).[`parent`](Cylinder.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Cylinder`](Cylinder.md).[`position`](Cylinder.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Cylinder`](Cylinder.md).[`rotation`](Cylinder.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Cylinder`](Cylinder.md).[`savedState`](Cylinder.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Cylinder`](Cylinder.md).[`scaleVector`](Cylinder.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Cylinder`](Cylinder.md).[`strokeWidth`](Cylinder.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Cylinder`](Cylinder.md).[`targetCopy`](Cylinder.md#targetcopy)

## Accessors

### color

#### Get Signature

> **get** **color**(): `string`

Defined in: [core/Mobject.ts:67](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L67)

##### Returns

`string`

#### Set Signature

> **set** **color**(`value`): `void`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L71)

##### Parameters

###### value

`string`

##### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`color`](Cylinder.md#color)

***

### fillColor

#### Get Signature

> **get** **fillColor**(): `string`

Defined in: [core/Mobject.ts:471](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L471)

Get the fill color

##### Returns

`string`

#### Set Signature

> **set** **fillColor**(`color`): `void`

Defined in: [core/Mobject.ts:478](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L478)

Set the fill color

##### Parameters

###### color

`string`

##### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`fillColor`](Cylinder.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:932](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L932)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Cylinder`](Cylinder.md).[`isDirty`](Cylinder.md#isdirty)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/Mobject.ts:145](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L145)

Get the overall opacity of the mobject

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/Mobject.ts:152](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L152)

Set the overall opacity of the mobject

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`opacity`](Cylinder.md#opacity)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Cylinder`](Cylinder.md).[`style`](Cylinder.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Cylinder`](Cylinder.md).[`submobjects`](Cylinder.md#submobjects)

## Methods

### \_createCopy()

> `protected` **\_createCopy**(): `Cone`

Defined in: [mobjects/three-d/Cylinder.ts:377](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L377)

Create a copy of this Cone

#### Returns

`Cone`

#### Overrides

[`Cylinder`](Cylinder.md).[`_createCopy`](Cylinder.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [mobjects/three-d/Cylinder.ts:101](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L101)

Create the Three.js cylinder mesh

#### Returns

`Object3D`

#### Inherited from

[`Cylinder`](Cylinder.md).[`_createThreeObject`](Cylinder.md#_createthreeobject)

***

### \_getBoundingBox()

> `protected` **\_getBoundingBox**(): `object`

Defined in: [core/Mobject.ts:746](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L746)

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

[`Cylinder`](Cylinder.md).[`_getBoundingBox`](Cylinder.md#_getboundingbox)

***

### \_getEdgeInDirection()

> `protected` **\_getEdgeInDirection**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:729](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L729)

Get the edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to get edge in

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Cylinder`](Cylinder.md).[`_getEdgeInDirection`](Cylinder.md#_getedgeindirection)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:912](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L912)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`_markDirty`](Cylinder.md#_markdirty)

***

### \_markDirtyUpward()

> **\_markDirtyUpward**(): `void`

Defined in: [core/Mobject.ts:921](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L921)

Mark this mobject and all ancestors as needing sync.
Use when a deep child's geometry changes and the parent tree must re-traverse.
Short-circuits if this node is already dirty (ancestors must be dirty too).

#### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`_markDirtyUpward`](Cylinder.md#_markdirtyupward)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [mobjects/three-d/Cylinder.ts:126](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L126)

Sync material properties to Three.js object

#### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`_syncMaterialToThree`](Cylinder.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:866](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L866)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`_syncToThree`](Cylinder.md#_synctothree)

***

### \_updateGeometry()

> `protected` **\_updateGeometry**(): `void`

Defined in: [mobjects/three-d/Cylinder.ts:142](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L142)

Update the geometry with current dimensions

#### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`_updateGeometry`](Cylinder.md#_updategeometry)

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:490](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L490)

Add a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to add

#### Returns

`this`

this for chaining

#### Inherited from

[`Cylinder`](Cylinder.md).[`add`](Cylinder.md#add)

***

### addUpdater()

> **addUpdater**(`updater`, `callOnAdd`): `this`

Defined in: [core/Mobject.ts:980](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L980)

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

[`Cylinder`](Cylinder.md).[`addUpdater`](Cylinder.md#addupdater)

***

### alignTo()

> **alignTo**(`target`, `direction`): `this`

Defined in: [core/Mobject.ts:694](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L694)

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

[`Cylinder`](Cylinder.md).[`alignTo`](Cylinder.md#alignto)

***

### applyFunction()

> **applyFunction**(`fn`): `this`

Defined in: [core/Mobject.ts:1047](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1047)

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

[`Cylinder`](Cylinder.md).[`applyFunction`](Cylinder.md#applyfunction)

***

### applyToFamily()

> **applyToFamily**(`func`): `this`

Defined in: [core/Mobject.ts:955](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L955)

Apply a function to this mobject and all descendants

#### Parameters

##### func

(`mobject`) => `void`

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`applyToFamily`](Cylinder.md#applytofamily)

***

### become()

> **become**(`other`): `this`

Defined in: [core/Mobject.ts:561](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L561)

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

[`Cylinder`](Cylinder.md).[`become`](Cylinder.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:827](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L827)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Cylinder`](Cylinder.md).[`center`](Cylinder.md#center)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:1005](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1005)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Cylinder`](Cylinder.md).[`clearUpdaters`](Cylinder.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:534](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L534)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`Cylinder`](Cylinder.md).[`copy`](Cylinder.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/Mobject.ts:1206](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1206)

Clean up Three.js resources.

#### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`dispose`](Cylinder.md#dispose)

***

### flip()

> **flip**(`axis`): `this`

Defined in: [core/Mobject.ts:364](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L364)

Flip the mobject along an axis (mirror reflection).

#### Parameters

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis to flip across, defaults to RIGHT ([1,0,0]) for horizontal flip

#### Returns

`this`

this for chaining

#### Inherited from

[`Cylinder`](Cylinder.md).[`flip`](Cylinder.md#flip)

***

### generateTarget()

> **generateTarget**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:1115](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1115)

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

[`Cylinder`](Cylinder.md).[`generateTarget`](Cylinder.md#generatetarget)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:776](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L776)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`Cylinder`](Cylinder.md).[`getBottom`](Cylinder.md#getbottom)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [core/Mobject.ts:638](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L638)

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

[`Cylinder`](Cylinder.md).[`getBounds`](Cylinder.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:623](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L623)

Get the center point of this mobject

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`Cylinder`](Cylinder.md).[`getCenter`](Cylinder.md#getcenter)

***

### getEdge()

> **getEdge**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:760](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L760)

Get a specific edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to the edge point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Cylinder`](Cylinder.md).[`getEdge`](Cylinder.md#getedge)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:966](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L966)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Cylinder`](Cylinder.md).[`getFamily`](Cylinder.md#getfamily)

***

### getHeight()

> **getHeight**(): `number`

Defined in: [mobjects/three-d/Cylinder.ts:192](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L192)

Get the height

#### Returns

`number`

#### Inherited from

[`Cylinder`](Cylinder.md).[`getHeight`](Cylinder.md#getheight)

***

### getLateralSurfaceArea()

> **getLateralSurfaceArea**(): `number`

Defined in: [mobjects/three-d/Cylinder.ts:240](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L240)

Get the lateral surface area of the cylinder

#### Returns

`number`

#### Inherited from

[`Cylinder`](Cylinder.md).[`getLateralSurfaceArea`](Cylinder.md#getlateralsurfacearea)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:784](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L784)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`Cylinder`](Cylinder.md).[`getLeft`](Cylinder.md#getleft)

***

### getRadius()

> **getRadius**(): `number`

Defined in: [mobjects/three-d/Cylinder.ts:361](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L361)

Get the base radius

#### Returns

`number`

***

### getRadiusBottom()

> **getRadiusBottom**(): `number`

Defined in: [mobjects/three-d/Cylinder.ts:176](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L176)

Get the radius at the bottom

#### Returns

`number`

#### Inherited from

[`Cylinder`](Cylinder.md).[`getRadiusBottom`](Cylinder.md#getradiusbottom)

***

### getRadiusTop()

> **getRadiusTop**(): `number`

Defined in: [mobjects/three-d/Cylinder.ts:160](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L160)

Get the radius at the top

#### Returns

`number`

#### Inherited from

[`Cylinder`](Cylinder.md).[`getRadiusTop`](Cylinder.md#getradiustop)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:792](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L792)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`Cylinder`](Cylinder.md).[`getRight`](Cylinder.md#getright)

***

### getSurfaceArea()

> **getSurfaceArea**(): `number`

Defined in: [mobjects/three-d/Cylinder.ts:251](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L251)

Get the total surface area of the cylinder (including caps)

#### Returns

`number`

#### Inherited from

[`Cylinder`](Cylinder.md).[`getSurfaceArea`](Cylinder.md#getsurfacearea)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:939](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L939)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Cylinder`](Cylinder.md).[`getThreeObject`](Cylinder.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:768](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L768)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`Cylinder`](Cylinder.md).[`getTop`](Cylinder.md#gettop)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1022](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1022)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Cylinder`](Cylinder.md).[`getUpdaters`](Cylinder.md#getupdaters)

***

### getVolume()

> **getVolume**(): `number`

Defined in: [mobjects/three-d/Cylinder.ts:264](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L264)

Get the volume of the cylinder

#### Returns

`number`

#### Inherited from

[`Cylinder`](Cylinder.md).[`getVolume`](Cylinder.md#getvolume)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:1014](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1014)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Cylinder`](Cylinder.md).[`hasUpdaters`](Cylinder.md#hasupdaters)

***

### isOpenEnded()

> **isOpenEnded**(): `boolean`

Defined in: [mobjects/three-d/Cylinder.ts:224](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L224)

Get whether ends are open

#### Returns

`boolean`

#### Inherited from

[`Cylinder`](Cylinder.md).[`isOpenEnded`](Cylinder.md#isopenended)

***

### isWireframe()

> **isWireframe**(): `boolean`

Defined in: [mobjects/three-d/Cylinder.ts:208](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L208)

Get whether wireframe mode is enabled

#### Returns

`boolean`

#### Inherited from

[`Cylinder`](Cylinder.md).[`isWireframe`](Cylinder.md#iswireframe)

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:215](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L215)

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

[`Cylinder`](Cylinder.md).[`moveTo`](Cylinder.md#moveto)

***

### moveToAligned()

> **moveToAligned**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:716](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L716)

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

[`Cylinder`](Cylinder.md).[`moveToAligned`](Cylinder.md#movetoaligned)

***

### nextTo()

> **nextTo**(`target`, `direction`, `buff`): `this`

Defined in: [core/Mobject.ts:662](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L662)

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

[`Cylinder`](Cylinder.md).[`nextTo`](Cylinder.md#nextto)

***

### prepareForNonlinearTransform()

> **prepareForNonlinearTransform**(`numPieces`): `this`

Defined in: [core/Mobject.ts:1067](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1067)

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

[`Cylinder`](Cylinder.md).[`prepareForNonlinearTransform`](Cylinder.md#preparefornonlineartransform)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:515](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L515)

Remove a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Cylinder`](Cylinder.md).[`remove`](Cylinder.md#remove)

***

### removeUpdater()

> **removeUpdater**(`updater`): `this`

Defined in: [core/Mobject.ts:993](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L993)

Remove an updater function

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

The updater function to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Cylinder`](Cylinder.md).[`removeUpdater`](Cylinder.md#removeupdater)

***

### replace()

> **replace**(`target`, `stretch`): `this`

Defined in: [core/Mobject.ts:591](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L591)

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

[`Cylinder`](Cylinder.md).[`replace`](Cylinder.md#replace)

***

### restoreState()

> **restoreState**(): `boolean`

Defined in: [core/Mobject.ts:1161](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1161)

Restore this mobject to its previously saved state (from saveState).
Uses the deep copy stored on `this.savedState` to restore all properties.

#### Returns

`boolean`

true if state was restored, false if no saved state exists

#### Inherited from

[`Cylinder`](Cylinder.md).[`restoreState`](Cylinder.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axisOrOptions?`): `this`

Defined in: [core/Mobject.ts:245](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L245)

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

[`Cylinder`](Cylinder.md).[`rotate`](Cylinder.md#rotate)

***

### rotateAboutOrigin()

> **rotateAboutOrigin**(`angle`, `axis`): `this`

Defined in: [core/Mobject.ts:355](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L355)

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

[`Cylinder`](Cylinder.md).[`rotateAboutOrigin`](Cylinder.md#rotateaboutorigin)

***

### saveState()

> **saveState**(): `this`

Defined in: [core/Mobject.ts:1136](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1136)

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

[`Cylinder`](Cylinder.md).[`saveState`](Cylinder.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Mobject.ts:378](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L378)

Scale the mobject uniformly or non-uniformly

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`Cylinder`](Cylinder.md).[`scale`](Cylinder.md#scale)

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/Mobject.ts:396](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L396)

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

[`Cylinder`](Cylinder.md).[`setColor`](Cylinder.md#setcolor)

***

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/Mobject.ts:458](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L458)

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

[`Cylinder`](Cylinder.md).[`setFill`](Cylinder.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:442](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L442)

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

[`Cylinder`](Cylinder.md).[`setFillOpacity`](Cylinder.md#setfillopacity)

***

### setHeight()

> **setHeight**(`value`): `this`

Defined in: [mobjects/three-d/Cylinder.ts:199](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L199)

Set the height

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`setHeight`](Cylinder.md#setheight)

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:410](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L410)

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

[`Cylinder`](Cylinder.md).[`setOpacity`](Cylinder.md#setopacity)

***

### setOpenEnded()

> **setOpenEnded**(`value`): `this`

Defined in: [mobjects/three-d/Cylinder.ts:231](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L231)

Set whether ends are open

#### Parameters

##### value

`boolean`

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`setOpenEnded`](Cylinder.md#setopenended)

***

### setRadius()

> **setRadius**(`value`): `this`

Defined in: [mobjects/three-d/Cylinder.ts:368](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L368)

Set the base radius

#### Parameters

##### value

`number`

#### Returns

`this`

***

### setRadiusBottom()

> **setRadiusBottom**(`value`): `this`

Defined in: [mobjects/three-d/Cylinder.ts:183](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L183)

Set the radius at the bottom

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`setRadiusBottom`](Cylinder.md#setradiusbottom)

***

### setRadiusTop()

> **setRadiusTop**(`value`): `this`

Defined in: [mobjects/three-d/Cylinder.ts:167](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L167)

Set the radius at the top

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`setRadiusTop`](Cylinder.md#setradiustop)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Mobject.ts:426](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L426)

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

[`Cylinder`](Cylinder.md).[`setStrokeWidth`](Cylinder.md#setstrokewidth)

***

### setStyle()

> **setStyle**(`style`): `this`

Defined in: [core/Mobject.ts:167](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L167)

Set style properties

#### Parameters

##### style

`Partial`\<[`MobjectStyle`](../interfaces/MobjectStyle.md)\>

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`setStyle`](Cylinder.md#setstyle)

***

### setWireframe()

> **setWireframe**(`value`): `this`

Defined in: [mobjects/three-d/Cylinder.ts:215](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Cylinder.ts#L215)

Set wireframe mode

#### Parameters

##### value

`boolean`

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`setWireframe`](Cylinder.md#setwireframe)

***

### setX()

> **setX**(`x`): `this`

Defined in: [core/Mobject.ts:800](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L800)

Set the x-coordinate of this mobject's center, preserving y and z.
Matches Manim Python's set_x() behavior.

#### Parameters

##### x

`number`

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`setX`](Cylinder.md#setx)

***

### setY()

> **setY**(`y`): `this`

Defined in: [core/Mobject.ts:809](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L809)

Set the y-coordinate of this mobject's center, preserving x and z.
Matches Manim Python's set_y() behavior.

#### Parameters

##### y

`number`

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`setY`](Cylinder.md#sety)

***

### setZ()

> **setZ**(`z`): `this`

Defined in: [core/Mobject.ts:818](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L818)

Set the z-coordinate of this mobject's center, preserving x and y.
Matches Manim Python's set_z() behavior.

#### Parameters

##### z

`number`

#### Returns

`this`

#### Inherited from

[`Cylinder`](Cylinder.md).[`setZ`](Cylinder.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Mobject.ts:201](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L201)

Translate the mobject by a delta

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`Cylinder`](Cylinder.md).[`shift`](Cylinder.md#shift)

***

### toCorner()

> **toCorner**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:859](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L859)

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

[`Cylinder`](Cylinder.md).[`toCorner`](Cylinder.md#tocorner)

***

### toEdge()

> **toEdge**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:837](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L837)

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

[`Cylinder`](Cylinder.md).[`toEdge`](Cylinder.md#toedge)

***

### update()

> **update**(`dt`): `void`

Defined in: [core/Mobject.ts:1031](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1031)

Run all updaters with given dt
Called by Scene during render loop

#### Parameters

##### dt

`number`

Delta time in seconds since last frame

#### Returns

`void`

#### Inherited from

[`Cylinder`](Cylinder.md).[`update`](Cylinder.md#update)
