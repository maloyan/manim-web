# Class: BraceText

Defined in: [mobjects/svg/Brace.ts:1077](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L1077)

BraceText - Alias for BraceLabel with text

A convenience class that is identical to BraceLabel.
Provided for API compatibility with Manim.

## Example

```typescript
// These are equivalent:
const brace1 = new BraceLabel(mobject, { label: 'text' });
const brace2 = new BraceText(mobject, 'text');
```

## Extends

- [`BraceLabel`](BraceLabel.md)

## Constructors

### Constructor

> **new BraceText**(`mobject`, `text`, `options`): `BraceText`

Defined in: [mobjects/svg/Brace.ts:1078](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L1078)

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

##### text

`string`

##### options

`Omit`\<[`BraceLabelOptions`](../interfaces/BraceLabelOptions.md), `"label"`\> = `{}`

#### Returns

`BraceText`

#### Overrides

[`BraceLabel`](BraceLabel.md).[`constructor`](BraceLabel.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:112](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L112)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`__savedMobjectState`](BraceLabel.md#__savedmobjectstate)

***

### \_brace

> `protected` **\_brace**: [`Brace`](Brace.md)

Defined in: [mobjects/svg/Brace.ts:958](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L958)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_brace`](BraceLabel.md#_brace)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L89)

Dirty flag indicating transforms need sync

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_dirty`](BraceLabel.md#_dirty)

***

### \_label

> `protected` **\_label**: [`Mobject`](Mobject.md)

Defined in: [mobjects/svg/Brace.ts:959](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L959)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_label`](BraceLabel.md#_label)

***

### \_labelBuff

> `protected` **\_labelBuff**: `number`

Defined in: [mobjects/svg/Brace.ts:960](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L960)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_labelBuff`](BraceLabel.md#_labelbuff)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:68](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L68)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_opacity`](BraceLabel.md#_opacity)

***

### \_parent

> `protected` **\_parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L83)

Parent alias for backward compatibility

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_parent`](BraceLabel.md#_parent)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:77](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L77)

Style properties for backward compatibility

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_style`](BraceLabel.md#_style)

***

### \_submobjects

> `protected` **\_submobjects**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L80)

Submobjects alias for backward compatibility

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_submobjects`](BraceLabel.md#_submobjects)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L86)

Three.js backing object

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_threeObject`](BraceLabel.md#_threeobject)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`children`](BraceLabel.md#children)

***

### color

> **color**: `string` = `'#ffffff'`

Defined in: [core/Mobject.ts:65](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L65)

Color as CSS color string

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`color`](BraceLabel.md#color)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:74](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L74)

Fill opacity (0-1)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`fillOpacity`](BraceLabel.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`id`](BraceLabel.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`parent`](BraceLabel.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`position`](BraceLabel.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`rotation`](BraceLabel.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:98](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L98)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`savedState`](BraceLabel.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`scaleVector`](BraceLabel.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L71)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`strokeWidth`](BraceLabel.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:105](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L105)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`targetCopy`](BraceLabel.md#targetcopy)

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

[`BraceLabel`](BraceLabel.md).[`fillColor`](BraceLabel.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:916](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L916)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`isDirty`](BraceLabel.md#isdirty)

***

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [core/Group.ts:264](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L264)

Get the number of mobjects in this group.

##### Returns

`number`

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`length`](BraceLabel.md#length)

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

[`BraceLabel`](BraceLabel.md).[`opacity`](BraceLabel.md#opacity)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:154](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L154)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`style`](BraceLabel.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:186](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L186)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`submobjects`](BraceLabel.md#submobjects)

## Methods

### \_createCopy()

> `protected` **\_createCopy**(): `BraceText`

Defined in: [mobjects/svg/Brace.ts:1089](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L1089)

Create a copy of this BraceText

#### Returns

`BraceText`

#### Overrides

[`BraceLabel`](BraceLabel.md).[`_createCopy`](BraceLabel.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [core/Group.ts:242](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L242)

Create the Three.js backing object for this Group.
A group is simply a THREE.Group that contains children.

#### Returns

`Object3D`

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_createThreeObject`](BraceLabel.md#_createthreeobject)

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

[`BraceLabel`](BraceLabel.md).[`_getBoundingBox`](BraceLabel.md#_getboundingbox)

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

[`BraceLabel`](BraceLabel.md).[`_getEdgeInDirection`](BraceLabel.md#_getedgeindirection)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:896](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L896)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_markDirty`](BraceLabel.md#_markdirty)

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

[`BraceLabel`](BraceLabel.md).[`_markDirtyUpward`](BraceLabel.md#_markdirtyupward)

***

### \_positionLabel()

> `protected` **\_positionLabel**(): `void`

Defined in: [mobjects/svg/Brace.ts:1010](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L1010)

Position the label at the tip of the brace

#### Returns

`void`

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_positionLabel`](BraceLabel.md#_positionlabel)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [core/Mobject.ts:888](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L888)

Sync material-specific properties. Override in subclasses.

#### Returns

`void`

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_syncMaterialToThree`](BraceLabel.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:850](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L850)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`_syncToThree`](BraceLabel.md#_synctothree)

***

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<[`Mobject`](Mobject.md)\>

Defined in: [core/Group.ts:280](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L280)

Iterate over all mobjects in the group.

#### Returns

`Iterator`\<[`Mobject`](Mobject.md)\>

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`[iterator]`](BraceLabel.md#iterator)

***

### add()

> **add**(`mobject`): `this`

Defined in: [core/Group.ts:31](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L31)

Add a mobject to this group.

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

Mobject to add

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`add`](BraceLabel.md#add)

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

[`BraceLabel`](BraceLabel.md).[`addUpdater`](BraceLabel.md#addupdater)

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

[`BraceLabel`](BraceLabel.md).[`alignTo`](BraceLabel.md#alignto)

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

[`BraceLabel`](BraceLabel.md).[`applyFunction`](BraceLabel.md#applyfunction)

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

[`BraceLabel`](BraceLabel.md).[`applyToFamily`](BraceLabel.md#applytofamily)

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

[`BraceLabel`](BraceLabel.md).[`become`](BraceLabel.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:811](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L811)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`center`](BraceLabel.md#center)

***

### clear()

> **clear**(): `this`

Defined in: [core/Group.ts:73](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L73)

Remove all children from this group.

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`clear`](BraceLabel.md#clear)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:989](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L989)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`clearUpdaters`](BraceLabel.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:547](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L547)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`copy`](BraceLabel.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/Mobject.ts:1190](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1190)

Clean up Three.js resources.

#### Returns

`void`

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`dispose`](BraceLabel.md#dispose)

***

### filter()

> **filter**(`fn`): [`Group`](Group.md)

Defined in: [core/Group.ts:308](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L308)

Filter mobjects in the group.

#### Parameters

##### fn

(`mobject`, `index`) => `boolean`

Filter predicate

#### Returns

[`Group`](Group.md)

New Group with filtered mobjects

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`filter`](BraceLabel.md#filter)

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

[`BraceLabel`](BraceLabel.md).[`flip`](BraceLabel.md#flip)

***

### forEach()

> **forEach**(`fn`): `this`

Defined in: [core/Group.ts:289](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L289)

Apply a function to each mobject in the group.

#### Parameters

##### fn

(`mobject`, `index`) => `void`

Function to apply

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`forEach`](BraceLabel.md#foreach)

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

[`BraceLabel`](BraceLabel.md).[`generateTarget`](BraceLabel.md#generatetarget)

***

### get()

> **get**(`index`): [`Mobject`](Mobject.md)

Defined in: [core/Group.ts:273](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L273)

Get a mobject by index.

#### Parameters

##### index

`number`

Index of the mobject

#### Returns

[`Mobject`](Mobject.md)

The mobject at the given index, or undefined

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`get`](BraceLabel.md#get)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:760](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L760)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getBottom`](BraceLabel.md#getbottom)

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

[`BraceLabel`](BraceLabel.md).[`getBounds`](BraceLabel.md#getbounds)

***

### getBrace()

> **getBrace**(): [`Brace`](Brace.md)

Defined in: [mobjects/svg/Brace.ts:1027](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L1027)

Get the brace component

#### Returns

[`Brace`](Brace.md)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getBrace`](BraceLabel.md#getbrace)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Group.ts:84](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L84)

Get the center of the group (average of all children centers).

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getCenter`](BraceLabel.md#getcenter)

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

[`BraceLabel`](BraceLabel.md).[`getEdge`](BraceLabel.md#getedge)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:950](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L950)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getFamily`](BraceLabel.md#getfamily)

***

### getLabel()

> **getLabel**(): [`Mobject`](Mobject.md)

Defined in: [mobjects/svg/Brace.ts:1034](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L1034)

Get the label component

#### Returns

[`Mobject`](Mobject.md)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getLabel`](BraceLabel.md#getlabel)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:768](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L768)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getLeft`](BraceLabel.md#getleft)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:776](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L776)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getRight`](BraceLabel.md#getright)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:923](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L923)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getThreeObject`](BraceLabel.md#getthreeobject)

***

### getTip()

> **getTip**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/svg/Brace.ts:1041](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/svg/Brace.ts#L1041)

Get the tip point of the brace

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getTip`](BraceLabel.md#gettip)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:752](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L752)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getTop`](BraceLabel.md#gettop)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1006](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L1006)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`getUpdaters`](BraceLabel.md#getupdaters)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:998](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L998)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`hasUpdaters`](BraceLabel.md#hasupdaters)

***

### map()

> **map**\<`T`\>(`fn`): `T`[]

Defined in: [core/Group.ts:299](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L299)

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

[`BraceLabel`](BraceLabel.md).[`map`](BraceLabel.md#map)

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Group.ts:128](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L128)

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

[`BraceLabel`](BraceLabel.md).[`moveTo`](BraceLabel.md#moveto)

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

[`BraceLabel`](BraceLabel.md).[`moveToAligned`](BraceLabel.md#movetoaligned)

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

[`BraceLabel`](BraceLabel.md).[`nextTo`](BraceLabel.md#nextto)

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

[`BraceLabel`](BraceLabel.md).[`prepareForNonlinearTransform`](BraceLabel.md#preparefornonlineartransform)

***

### remove()

> **remove**(`mobject`): `this`

Defined in: [core/Group.ts:56](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L56)

Remove a mobject from this group.

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

Mobject to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`remove`](BraceLabel.md#remove)

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

[`BraceLabel`](BraceLabel.md).[`removeUpdater`](BraceLabel.md#removeupdater)

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

[`BraceLabel`](BraceLabel.md).[`restoreState`](BraceLabel.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axis`): `this`

Defined in: [core/Group.ts:157](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L157)

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

[`BraceLabel`](BraceLabel.md).[`rotate`](BraceLabel.md#rotate)

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

[`BraceLabel`](BraceLabel.md).[`rotateAboutOrigin`](BraceLabel.md#rotateaboutorigin)

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

[`BraceLabel`](BraceLabel.md).[`saveState`](BraceLabel.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Group.ts:174](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L174)

Scale all children.

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`scale`](BraceLabel.md#scale)

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/Group.ts:191](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L191)

Set the color of all children.

#### Parameters

##### color

`string`

CSS color string

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`setColor`](BraceLabel.md#setcolor)

***

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/Mobject.ts:463](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Mobject.ts#L463)

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

[`BraceLabel`](BraceLabel.md).[`setFill`](BraceLabel.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Group.ts:230](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L230)

Set the fill opacity of all children.

#### Parameters

##### opacity

`number`

Fill opacity (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`setFillOpacity`](BraceLabel.md#setfillopacity)

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [core/Group.ts:204](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L204)

Set the opacity of all children.

#### Parameters

##### opacity

`number`

Opacity value (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`setOpacity`](BraceLabel.md#setopacity)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Group.ts:217](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L217)

Set the stroke width of all children.

#### Parameters

##### width

`number`

Stroke width in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`setStrokeWidth`](BraceLabel.md#setstrokewidth)

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

[`BraceLabel`](BraceLabel.md).[`setStyle`](BraceLabel.md#setstyle)

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

[`BraceLabel`](BraceLabel.md).[`setX`](BraceLabel.md#setx)

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

[`BraceLabel`](BraceLabel.md).[`setY`](BraceLabel.md#sety)

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

[`BraceLabel`](BraceLabel.md).[`setZ`](BraceLabel.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Group.ts:110](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Group.ts#L110)

Shift all children by the given delta.

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`BraceLabel`](BraceLabel.md).[`shift`](BraceLabel.md#shift)

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

[`BraceLabel`](BraceLabel.md).[`toCorner`](BraceLabel.md#tocorner)

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

[`BraceLabel`](BraceLabel.md).[`toEdge`](BraceLabel.md#toedge)

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

[`BraceLabel`](BraceLabel.md).[`update`](BraceLabel.md#update)
