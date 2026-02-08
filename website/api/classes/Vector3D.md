# Class: Vector3D

Defined in: [mobjects/three-d/Arrow3D.ts:349](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L349)

Vector3D - An Arrow3D starting from the origin by default

## Extends

- [`Arrow3D`](Arrow3D.md)

## Constructors

### Constructor

> **new Vector3D**(`options`): `Vector3D`

Defined in: [mobjects/three-d/Arrow3D.ts:350](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L350)

#### Parameters

##### options

`Omit`\<[`Arrow3DOptions`](../interfaces/Arrow3DOptions.md), `"start"`\> & `object`

#### Returns

`Vector3D`

#### Overrides

[`Arrow3D`](Arrow3D.md).[`constructor`](Arrow3D.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`__savedMobjectState`](Arrow3D.md#__savedmobjectstate)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`_dirty`](Arrow3D.md#_dirty)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`_opacity`](Arrow3D.md#_opacity)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`_style`](Arrow3D.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`_threeObject`](Arrow3D.md#_threeobject)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`children`](Arrow3D.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`fillOpacity`](Arrow3D.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`id`](Arrow3D.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`parent`](Arrow3D.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`position`](Arrow3D.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`rotation`](Arrow3D.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`savedState`](Arrow3D.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`scaleVector`](Arrow3D.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`strokeWidth`](Arrow3D.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`targetCopy`](Arrow3D.md#targetcopy)

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

[`Arrow3D`](Arrow3D.md).[`color`](Arrow3D.md#color)

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

[`Arrow3D`](Arrow3D.md).[`fillColor`](Arrow3D.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:932](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L932)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`isDirty`](Arrow3D.md#isdirty)

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

[`Arrow3D`](Arrow3D.md).[`opacity`](Arrow3D.md#opacity)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`style`](Arrow3D.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`submobjects`](Arrow3D.md#submobjects)

## Methods

### \_createCopy()

> `protected` **\_createCopy**(): [`Arrow3D`](Arrow3D.md)

Defined in: [mobjects/three-d/Arrow3D.ts:332](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L332)

Create a copy of this Arrow3D

#### Returns

[`Arrow3D`](Arrow3D.md)

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`_createCopy`](Arrow3D.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [mobjects/three-d/Arrow3D.ts:84](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L84)

Create the Three.js arrow object (shaft + tip)

#### Returns

`Object3D`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`_createThreeObject`](Arrow3D.md#_createthreeobject)

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

[`Arrow3D`](Arrow3D.md).[`_getBoundingBox`](Arrow3D.md#_getboundingbox)

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

[`Arrow3D`](Arrow3D.md).[`_getEdgeInDirection`](Arrow3D.md#_getedgeindirection)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:912](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L912)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`_markDirty`](Arrow3D.md#_markdirty)

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

[`Arrow3D`](Arrow3D.md).[`_markDirtyUpward`](Arrow3D.md#_markdirtyupward)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [mobjects/three-d/Arrow3D.ts:176](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L176)

Sync material properties to Three.js object

#### Returns

`void`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`_syncMaterialToThree`](Arrow3D.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:866](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L866)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`_syncToThree`](Arrow3D.md#_synctothree)

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

[`Arrow3D`](Arrow3D.md).[`add`](Arrow3D.md#add)

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

[`Arrow3D`](Arrow3D.md).[`addUpdater`](Arrow3D.md#addupdater)

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

[`Arrow3D`](Arrow3D.md).[`alignTo`](Arrow3D.md#alignto)

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

[`Arrow3D`](Arrow3D.md).[`applyFunction`](Arrow3D.md#applyfunction)

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

[`Arrow3D`](Arrow3D.md).[`applyToFamily`](Arrow3D.md#applytofamily)

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

[`Arrow3D`](Arrow3D.md).[`become`](Arrow3D.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:827](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L827)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`center`](Arrow3D.md#center)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:1005](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1005)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`clearUpdaters`](Arrow3D.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:534](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L534)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`copy`](Arrow3D.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/Mobject.ts:1206](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1206)

Clean up Three.js resources.

#### Returns

`void`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`dispose`](Arrow3D.md#dispose)

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

[`Arrow3D`](Arrow3D.md).[`flip`](Arrow3D.md#flip)

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

[`Arrow3D`](Arrow3D.md).[`generateTarget`](Arrow3D.md#generatetarget)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:776](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L776)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getBottom`](Arrow3D.md#getbottom)

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

[`Arrow3D`](Arrow3D.md).[`getBounds`](Arrow3D.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:623](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L623)

Get the center point of this mobject

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getCenter`](Arrow3D.md#getcenter)

***

### getDirection()

> **getDirection**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/Arrow3D.ts:306](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L306)

Get the direction vector (normalized)

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getDirection`](Arrow3D.md#getdirection)

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

[`Arrow3D`](Arrow3D.md).[`getEdge`](Arrow3D.md#getedge)

***

### getEnd()

> **getEnd**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/Arrow3D.ts:232](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L232)

Get the end point (tip of the arrow)

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getEnd`](Arrow3D.md#getend)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:966](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L966)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getFamily`](Arrow3D.md#getfamily)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:784](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L784)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getLeft`](Arrow3D.md#getleft)

***

### getLength()

> **getLength**(): `number`

Defined in: [mobjects/three-d/Arrow3D.ts:296](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L296)

Get the length of the arrow

#### Returns

`number`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getLength`](Arrow3D.md#getlength)

***

### getMidpoint()

> **getMidpoint**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/Arrow3D.ts:321](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L321)

Get the midpoint of the arrow

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getMidpoint`](Arrow3D.md#getmidpoint)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:792](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L792)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getRight`](Arrow3D.md#getright)

***

### getShaftRadius()

> **getShaftRadius**(): `number`

Defined in: [mobjects/three-d/Arrow3D.ts:280](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L280)

Get the shaft radius

#### Returns

`number`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getShaftRadius`](Arrow3D.md#getshaftradius)

***

### getStart()

> **getStart**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/Arrow3D.ts:216](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L216)

Get the start point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getStart`](Arrow3D.md#getstart)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:939](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L939)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getThreeObject`](Arrow3D.md#getthreeobject)

***

### getTipLength()

> **getTipLength**(): `number`

Defined in: [mobjects/three-d/Arrow3D.ts:248](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L248)

Get the tip length

#### Returns

`number`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getTipLength`](Arrow3D.md#gettiplength)

***

### getTipRadius()

> **getTipRadius**(): `number`

Defined in: [mobjects/three-d/Arrow3D.ts:264](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L264)

Get the tip radius

#### Returns

`number`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getTipRadius`](Arrow3D.md#gettipradius)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:768](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L768)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getTop`](Arrow3D.md#gettop)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1022](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1022)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`getUpdaters`](Arrow3D.md#getupdaters)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:1014](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1014)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`hasUpdaters`](Arrow3D.md#hasupdaters)

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

[`Arrow3D`](Arrow3D.md).[`moveTo`](Arrow3D.md#moveto)

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

[`Arrow3D`](Arrow3D.md).[`moveToAligned`](Arrow3D.md#movetoaligned)

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

[`Arrow3D`](Arrow3D.md).[`nextTo`](Arrow3D.md#nextto)

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

[`Arrow3D`](Arrow3D.md).[`prepareForNonlinearTransform`](Arrow3D.md#preparefornonlineartransform)

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

[`Arrow3D`](Arrow3D.md).[`remove`](Arrow3D.md#remove)

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

[`Arrow3D`](Arrow3D.md).[`removeUpdater`](Arrow3D.md#removeupdater)

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

[`Arrow3D`](Arrow3D.md).[`replace`](Arrow3D.md#replace)

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

[`Arrow3D`](Arrow3D.md).[`restoreState`](Arrow3D.md#restorestate)

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

[`Arrow3D`](Arrow3D.md).[`rotate`](Arrow3D.md#rotate)

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

[`Arrow3D`](Arrow3D.md).[`rotateAboutOrigin`](Arrow3D.md#rotateaboutorigin)

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

[`Arrow3D`](Arrow3D.md).[`saveState`](Arrow3D.md#savestate)

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

[`Arrow3D`](Arrow3D.md).[`scale`](Arrow3D.md#scale)

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

[`Arrow3D`](Arrow3D.md).[`setColor`](Arrow3D.md#setcolor)

***

### setEnd()

> **setEnd**(`point`): `this`

Defined in: [mobjects/three-d/Arrow3D.ts:239](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L239)

Set the end point (tip of the arrow)

#### Parameters

##### point

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`setEnd`](Arrow3D.md#setend)

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

[`Arrow3D`](Arrow3D.md).[`setFill`](Arrow3D.md#setfill)

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

[`Arrow3D`](Arrow3D.md).[`setFillOpacity`](Arrow3D.md#setfillopacity)

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

[`Arrow3D`](Arrow3D.md).[`setOpacity`](Arrow3D.md#setopacity)

***

### setShaftRadius()

> **setShaftRadius**(`value`): `this`

Defined in: [mobjects/three-d/Arrow3D.ts:287](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L287)

Set the shaft radius

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`setShaftRadius`](Arrow3D.md#setshaftradius)

***

### setStart()

> **setStart**(`point`): `this`

Defined in: [mobjects/three-d/Arrow3D.ts:223](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L223)

Set the start point

#### Parameters

##### point

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`setStart`](Arrow3D.md#setstart)

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

[`Arrow3D`](Arrow3D.md).[`setStrokeWidth`](Arrow3D.md#setstrokewidth)

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

[`Arrow3D`](Arrow3D.md).[`setStyle`](Arrow3D.md#setstyle)

***

### setTipLength()

> **setTipLength**(`value`): `this`

Defined in: [mobjects/three-d/Arrow3D.ts:255](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L255)

Set the tip length

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`setTipLength`](Arrow3D.md#settiplength)

***

### setTipRadius()

> **setTipRadius**(`value`): `this`

Defined in: [mobjects/three-d/Arrow3D.ts:271](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/three-d/Arrow3D.ts#L271)

Set the tip radius

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Arrow3D`](Arrow3D.md).[`setTipRadius`](Arrow3D.md#settipradius)

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

[`Arrow3D`](Arrow3D.md).[`setX`](Arrow3D.md#setx)

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

[`Arrow3D`](Arrow3D.md).[`setY`](Arrow3D.md#sety)

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

[`Arrow3D`](Arrow3D.md).[`setZ`](Arrow3D.md#setz)

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

[`Arrow3D`](Arrow3D.md).[`shift`](Arrow3D.md#shift)

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

[`Arrow3D`](Arrow3D.md).[`toCorner`](Arrow3D.md#tocorner)

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

[`Arrow3D`](Arrow3D.md).[`toEdge`](Arrow3D.md#toedge)

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

[`Arrow3D`](Arrow3D.md).[`update`](Arrow3D.md#update)
