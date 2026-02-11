# Class: Vector

Defined in: [mobjects/geometry/Arrow.ts:458](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L458)

Vector - An Arrow starting from the origin by default

## Extends

- [`Arrow`](Arrow.md)

## Constructors

### Constructor

> **new Vector**(`options`): `Vector`

Defined in: [mobjects/geometry/Arrow.ts:459](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L459)

#### Parameters

##### options

`Omit`\<[`ArrowOptions`](../interfaces/ArrowOptions.md), `"start"`\> & `object` = `{}`

#### Returns

`Vector`

#### Overrides

[`Arrow`](Arrow.md).[`constructor`](Arrow.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:123](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L123)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Arrow`](Arrow.md).[`__savedMobjectState`](Arrow.md#__savedmobjectstate)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:100](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L100)

Dirty flag indicating transforms need sync

#### Inherited from

[`Arrow`](Arrow.md).[`_dirty`](Arrow.md#_dirty)

***

### \_disableChildZLayering

> `protected` **\_disableChildZLayering**: `boolean` = `false`

Defined in: [core/Mobject.ts:91](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L91)

When true, children skip the 2D z-layering offset in _syncToThree.
 Set this on 3D container objects (e.g. ThreeDAxes) where z-offsets
 would shift objects away from their intended 3D positions.

#### Inherited from

[`Arrow`](Arrow.md).[`_disableChildZLayering`](Arrow.md#_disablechildzlayering)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Arrow`](Arrow.md).[`_opacity`](Arrow.md#_opacity)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:94](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L94)

Style properties for backward compatibility

#### Inherited from

[`Arrow`](Arrow.md).[`_style`](Arrow.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:97](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L97)

Three.js backing object

#### Inherited from

[`Arrow`](Arrow.md).[`_threeObject`](Arrow.md#_threeobject)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Arrow`](Arrow.md).[`children`](Arrow.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`Arrow`](Arrow.md).[`fillOpacity`](Arrow.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Arrow`](Arrow.md).[`id`](Arrow.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Arrow`](Arrow.md).[`parent`](Arrow.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Arrow`](Arrow.md).[`position`](Arrow.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Arrow`](Arrow.md).[`rotation`](Arrow.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:109](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L109)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Arrow`](Arrow.md).[`savedState`](Arrow.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Arrow`](Arrow.md).[`scaleVector`](Arrow.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Arrow`](Arrow.md).[`strokeWidth`](Arrow.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:116](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L116)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Arrow`](Arrow.md).[`targetCopy`](Arrow.md#targetcopy)

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

[`Arrow`](Arrow.md).[`color`](Arrow.md#color)

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

[`Arrow`](Arrow.md).[`fillColor`](Arrow.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:958](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L958)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Arrow`](Arrow.md).[`isDirty`](Arrow.md#isdirty)

***

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [core/Group.ts:255](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L255)

Get the number of mobjects in this group.

##### Returns

`number`

#### Inherited from

[`Arrow`](Arrow.md).[`length`](Arrow.md#length)

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

[`Arrow`](Arrow.md).[`opacity`](Arrow.md#opacity)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:165](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L165)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Arrow`](Arrow.md).[`style`](Arrow.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:197](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L197)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Arrow`](Arrow.md).[`submobjects`](Arrow.md#submobjects)

## Methods

### \_createCopy()

> `protected` **\_createCopy**(): [`Arrow`](Arrow.md)

Defined in: [mobjects/geometry/Arrow.ts:310](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L310)

Create a copy of this Arrow

#### Returns

[`Arrow`](Arrow.md)

#### Inherited from

[`Arrow`](Arrow.md).[`_createCopy`](Arrow.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [core/Group.ts:233](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L233)

Create the Three.js backing object for this Group.
A group is simply a THREE.Group that contains children.

#### Returns

`Object3D`

#### Inherited from

[`Arrow`](Arrow.md).[`_createThreeObject`](Arrow.md#_createthreeobject)

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

[`Arrow`](Arrow.md).[`_getBoundingBox`](Arrow.md#_getboundingbox)

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

[`Arrow`](Arrow.md).[`_getEdgeInDirection`](Arrow.md#_getedgeindirection)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:938](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L938)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Arrow`](Arrow.md).[`_markDirty`](Arrow.md#_markdirty)

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

[`Arrow`](Arrow.md).[`_markDirtyUpward`](Arrow.md#_markdirtyupward)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [core/Mobject.ts:930](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L930)

Sync material-specific properties. Override in subclasses.

#### Returns

`void`

#### Inherited from

[`Arrow`](Arrow.md).[`_syncMaterialToThree`](Arrow.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:891](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L891)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Arrow`](Arrow.md).[`_syncToThree`](Arrow.md#_synctothree)

***

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<[`Mobject`](Mobject.md)\>

Defined in: [core/Group.ts:271](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L271)

Iterate over all mobjects in the group.

#### Returns

`Iterator`\<[`Mobject`](Mobject.md)\>

#### Inherited from

[`Arrow`](Arrow.md).[`[iterator]`](Arrow.md#iterator)

***

### add()

> **add**(`mobject`): `this`

Defined in: [core/Group.ts:31](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L31)

Add a mobject to this group.

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

Mobject to add

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`add`](Arrow.md#add)

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

[`Arrow`](Arrow.md).[`addUpdater`](Arrow.md#addupdater)

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

[`Arrow`](Arrow.md).[`alignTo`](Arrow.md#alignto)

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

[`Arrow`](Arrow.md).[`applyFunction`](Arrow.md#applyfunction)

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

[`Arrow`](Arrow.md).[`applyToFamily`](Arrow.md#applytofamily)

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

[`Arrow`](Arrow.md).[`become`](Arrow.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:850](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L850)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`center`](Arrow.md#center)

***

### clear()

> **clear**(): `this`

Defined in: [core/Group.ts:73](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L73)

Remove all children from this group.

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`clear`](Arrow.md#clear)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:1031](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1031)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`clearUpdaters`](Arrow.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:553](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L553)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`Arrow`](Arrow.md).[`copy`](Arrow.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/Mobject.ts:1243](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1243)

Clean up Three.js resources.

#### Returns

`void`

#### Inherited from

[`Arrow`](Arrow.md).[`dispose`](Arrow.md#dispose)

***

### filter()

> **filter**(`fn`): [`Group`](Group.md)

Defined in: [core/Group.ts:299](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L299)

Filter mobjects in the group.

#### Parameters

##### fn

(`mobject`, `index`) => `boolean`

Filter predicate

#### Returns

[`Group`](Group.md)

New Group with filtered mobjects

#### Inherited from

[`Arrow`](Arrow.md).[`filter`](Arrow.md#filter)

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

[`Arrow`](Arrow.md).[`flip`](Arrow.md#flip)

***

### forEach()

> **forEach**(`fn`): `this`

Defined in: [core/Group.ts:280](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L280)

Apply a function to each mobject in the group.

#### Parameters

##### fn

(`mobject`, `index`) => `void`

Function to apply

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`forEach`](Arrow.md#foreach)

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

[`Arrow`](Arrow.md).[`generateTarget`](Arrow.md#generatetarget)

***

### get()

> **get**(`index`): [`Mobject`](Mobject.md)

Defined in: [core/Group.ts:264](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L264)

Get a mobject by index.

#### Parameters

##### index

`number`

Index of the mobject

#### Returns

[`Mobject`](Mobject.md)

The mobject at the given index, or undefined

#### Inherited from

[`Arrow`](Arrow.md).[`get`](Arrow.md#get)

***

### getAngle()

> **getAngle**(): `number`

Defined in: [mobjects/geometry/Arrow.ts:300](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L300)

Get the angle of the arrow in the XY plane (in radians)

#### Returns

`number`

#### Inherited from

[`Arrow`](Arrow.md).[`getAngle`](Arrow.md#getangle)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:799](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L799)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`Arrow`](Arrow.md).[`getBottom`](Arrow.md#getbottom)

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

[`Arrow`](Arrow.md).[`getBounds`](Arrow.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Group.ts:86](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L86)

Get the center of the group (average of all children centers).
Children maintain world-space coordinates, so no group position offset
is added (shift/moveTo only update children, not group position).

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`Arrow`](Arrow.md).[`getCenter`](Arrow.md#getcenter)

***

### getDirection()

> **getDirection**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Arrow.ts:285](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L285)

Get the direction vector of the arrow (normalized)

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Arrow`](Arrow.md).[`getDirection`](Arrow.md#getdirection)

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

[`Arrow`](Arrow.md).[`getEdge`](Arrow.md#getedge)

***

### getEnd()

> **getEnd**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Arrow.ts:227](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L227)

Get the end point (tip of the arrow)

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Arrow`](Arrow.md).[`getEnd`](Arrow.md#getend)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:992](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L992)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Arrow`](Arrow.md).[`getFamily`](Arrow.md#getfamily)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:807](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L807)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`Arrow`](Arrow.md).[`getLeft`](Arrow.md#getleft)

***

### getLength()

> **getLength**(): `number`

Defined in: [mobjects/geometry/Arrow.ts:243](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L243)

Get the length of the arrow (including tip)

#### Returns

`number`

#### Inherited from

[`Arrow`](Arrow.md).[`getLength`](Arrow.md#getlength)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:815](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L815)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`Arrow`](Arrow.md).[`getRight`](Arrow.md#getright)

***

### getStart()

> **getStart**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/geometry/Arrow.ts:211](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L211)

Get the start point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Arrow`](Arrow.md).[`getStart`](Arrow.md#getstart)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:965](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L965)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Arrow`](Arrow.md).[`getThreeObject`](Arrow.md#getthreeobject)

***

### getTipLength()

> **getTipLength**(): `number`

Defined in: [mobjects/geometry/Arrow.ts:253](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L253)

Get the tip length

#### Returns

`number`

#### Inherited from

[`Arrow`](Arrow.md).[`getTipLength`](Arrow.md#gettiplength)

***

### getTipWidth()

> **getTipWidth**(): `number`

Defined in: [mobjects/geometry/Arrow.ts:269](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L269)

Get the tip width

#### Returns

`number`

#### Inherited from

[`Arrow`](Arrow.md).[`getTipWidth`](Arrow.md#gettipwidth)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:791](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L791)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`Arrow`](Arrow.md).[`getTop`](Arrow.md#gettop)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1048](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1048)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Arrow`](Arrow.md).[`getUpdaters`](Arrow.md#getupdaters)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:1040](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Mobject.ts#L1040)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Arrow`](Arrow.md).[`hasUpdaters`](Arrow.md#hasupdaters)

***

### map()

> **map**\<`T`\>(`fn`): `T`[]

Defined in: [core/Group.ts:290](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L290)

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

[`Arrow`](Arrow.md).[`map`](Arrow.md#map)

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Group.ts:125](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L125)

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

[`Arrow`](Arrow.md).[`moveTo`](Arrow.md#moveto)

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

[`Arrow`](Arrow.md).[`moveToAligned`](Arrow.md#movetoaligned)

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

[`Arrow`](Arrow.md).[`nextTo`](Arrow.md#nextto)

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

[`Arrow`](Arrow.md).[`prepareForNonlinearTransform`](Arrow.md#preparefornonlineartransform)

***

### remove()

> **remove**(`mobject`): `this`

Defined in: [core/Group.ts:56](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L56)

Remove a mobject from this group.

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

Mobject to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`remove`](Arrow.md#remove)

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

[`Arrow`](Arrow.md).[`removeUpdater`](Arrow.md#removeupdater)

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

[`Arrow`](Arrow.md).[`replace`](Arrow.md#replace)

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

[`Arrow`](Arrow.md).[`restoreState`](Arrow.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axis`): `this`

Defined in: [core/Group.ts:155](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L155)

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

[`Arrow`](Arrow.md).[`rotate`](Arrow.md#rotate)

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

[`Arrow`](Arrow.md).[`rotateAboutOrigin`](Arrow.md#rotateaboutorigin)

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

[`Arrow`](Arrow.md).[`saveState`](Arrow.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Group.ts:169](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L169)

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

[`Arrow`](Arrow.md).[`scale`](Arrow.md#scale)

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/Group.ts:182](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L182)

Set the color of all children.

#### Parameters

##### color

`string`

CSS color string

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`setColor`](Arrow.md#setcolor)

***

### setEnd()

> **setEnd**(`point`): `this`

Defined in: [mobjects/geometry/Arrow.ts:234](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L234)

Set the end point (tip of the arrow)

#### Parameters

##### point

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

#### Inherited from

[`Arrow`](Arrow.md).[`setEnd`](Arrow.md#setend)

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

[`Arrow`](Arrow.md).[`setFill`](Arrow.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Group.ts:221](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L221)

Set the fill opacity of all children.

#### Parameters

##### opacity

`number`

Fill opacity (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`setFillOpacity`](Arrow.md#setfillopacity)

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [core/Group.ts:195](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L195)

Set the opacity of all children.

#### Parameters

##### opacity

`number`

Opacity value (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`setOpacity`](Arrow.md#setopacity)

***

### setStart()

> **setStart**(`point`): `this`

Defined in: [mobjects/geometry/Arrow.ts:218](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L218)

Set the start point

#### Parameters

##### point

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

#### Inherited from

[`Arrow`](Arrow.md).[`setStart`](Arrow.md#setstart)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Group.ts:208](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L208)

Set the stroke width of all children.

#### Parameters

##### width

`number`

Stroke width in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`Arrow`](Arrow.md).[`setStrokeWidth`](Arrow.md#setstrokewidth)

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

[`Arrow`](Arrow.md).[`setStyle`](Arrow.md#setstyle)

***

### setTipLength()

> **setTipLength**(`value`): `this`

Defined in: [mobjects/geometry/Arrow.ts:260](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L260)

Set the tip length

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Arrow`](Arrow.md).[`setTipLength`](Arrow.md#settiplength)

***

### setTipWidth()

> **setTipWidth**(`value`): `this`

Defined in: [mobjects/geometry/Arrow.ts:276](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/geometry/Arrow.ts#L276)

Set the tip width

#### Parameters

##### value

`number`

#### Returns

`this`

#### Inherited from

[`Arrow`](Arrow.md).[`setTipWidth`](Arrow.md#settipwidth)

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

[`Arrow`](Arrow.md).[`setX`](Arrow.md#setx)

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

[`Arrow`](Arrow.md).[`setY`](Arrow.md#sety)

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

[`Arrow`](Arrow.md).[`setZ`](Arrow.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Group.ts:111](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Group.ts#L111)

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

[`Arrow`](Arrow.md).[`shift`](Arrow.md#shift)

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

[`Arrow`](Arrow.md).[`toCorner`](Arrow.md#tocorner)

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

[`Arrow`](Arrow.md).[`toEdge`](Arrow.md#toedge)

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

[`Arrow`](Arrow.md).[`update`](Arrow.md#update)
