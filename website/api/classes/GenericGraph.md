# Class: GenericGraph

Defined in: [mobjects/graph/index.ts:654](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L654)

GenericGraph - Base class for graph visualization

Provides the foundation for both directed and undirected graphs.
Manages vertices and edges as Mobject children for animation support.

## Extends

- [`Mobject`](Mobject.md)

## Extended by

- [`Graph`](Graph.md)
- [`DiGraph`](DiGraph.md)

## Constructors

### Constructor

> **new GenericGraph**(`options`): `GenericGraph`

Defined in: [mobjects/graph/index.ts:691](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L691)

#### Parameters

##### options

[`GenericGraphOptions`](../interfaces/GenericGraphOptions.md) = `{}`

#### Returns

`GenericGraph`

#### Overrides

[`Mobject`](Mobject.md).[`constructor`](Mobject.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Mobject`](Mobject.md).[`__savedMobjectState`](Mobject.md#__savedmobjectstate)

***

### \_directed

> `protected` **\_directed**: `boolean` = `false`

Defined in: [mobjects/graph/index.ts:686](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L686)

Whether this is a directed graph

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`Mobject`](Mobject.md).[`_dirty`](Mobject.md#_dirty)

***

### \_edgeConfig

> `protected` **\_edgeConfig**: `Map`\<`string`, [`EdgeConfig`](../interfaces/EdgeConfig.md)\>

Defined in: [mobjects/graph/index.ts:683](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L683)

Per-edge configuration

***

### \_edgeMobjects

> `protected` **\_edgeMobjects**: `Map`\<`string`, [`Mobject`](Mobject.md)\>

Defined in: [mobjects/graph/index.ts:668](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L668)

Map of edge key to Line/Arrow mobject

***

### \_edges

> `protected` **\_edges**: [`EdgeTuple`](../type-aliases/EdgeTuple.md)[] = `[]`

Defined in: [mobjects/graph/index.ts:659](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L659)

List of edges as [source, target] tuples

***

### \_edgeStyle

> `protected` **\_edgeStyle**: [`EdgeStyleOptions`](../interfaces/EdgeStyleOptions.md)

Defined in: [mobjects/graph/index.ts:677](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L677)

Default edge style

***

### \_group

> `protected` **\_group**: `Group`\<`Object3DEventMap`\> = `null`

Defined in: [mobjects/graph/index.ts:689](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L689)

Three.js group for this graph

***

### \_layoutConfig

> `protected` **\_layoutConfig**: [`LayoutConfig`](../interfaces/LayoutConfig.md)

Defined in: [mobjects/graph/index.ts:671](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L671)

Layout configuration

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Mobject`](Mobject.md).[`_opacity`](Mobject.md#_opacity)

***

### \_positions

> `protected` **\_positions**: `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\>

Defined in: [mobjects/graph/index.ts:662](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L662)

Map of vertex id to position

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`Mobject`](Mobject.md).[`_style`](Mobject.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`Mobject`](Mobject.md).[`_threeObject`](Mobject.md#_threeobject)

***

### \_vertexConfig

> `protected` **\_vertexConfig**: `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`VertexConfig`](../interfaces/VertexConfig.md)\>

Defined in: [mobjects/graph/index.ts:680](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L680)

Per-vertex configuration

***

### \_vertexMobjects

> `protected` **\_vertexMobjects**: `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`Dot`](Dot.md)\>

Defined in: [mobjects/graph/index.ts:665](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L665)

Map of vertex id to Dot mobject

***

### \_vertexStyle

> `protected` **\_vertexStyle**: [`VertexStyleOptions`](../interfaces/VertexStyleOptions.md)

Defined in: [mobjects/graph/index.ts:674](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L674)

Default vertex style

***

### \_vertices

> `protected` **\_vertices**: [`VertexId`](../type-aliases/VertexId.md)[] = `[]`

Defined in: [mobjects/graph/index.ts:656](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L656)

List of vertex identifiers

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Mobject`](Mobject.md).[`children`](Mobject.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`Mobject`](Mobject.md).[`fillOpacity`](Mobject.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Mobject`](Mobject.md).[`id`](Mobject.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Mobject`](Mobject.md).[`parent`](Mobject.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Mobject`](Mobject.md).[`position`](Mobject.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Mobject`](Mobject.md).[`rotation`](Mobject.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Mobject`](Mobject.md).[`savedState`](Mobject.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Mobject`](Mobject.md).[`scaleVector`](Mobject.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Mobject`](Mobject.md).[`strokeWidth`](Mobject.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Mobject`](Mobject.md).[`targetCopy`](Mobject.md#targetcopy)

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

[`Mobject`](Mobject.md).[`color`](Mobject.md#color)

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

[`Mobject`](Mobject.md).[`fillColor`](Mobject.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:932](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L932)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Mobject`](Mobject.md).[`isDirty`](Mobject.md#isdirty)

***

### numEdges

#### Get Signature

> **get** **numEdges**(): `number`

Defined in: [mobjects/graph/index.ts:1165](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1165)

Get the number of edges

##### Returns

`number`

***

### numVertices

#### Get Signature

> **get** **numVertices**(): `number`

Defined in: [mobjects/graph/index.ts:990](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L990)

Get the number of vertices

##### Returns

`number`

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

[`Mobject`](Mobject.md).[`opacity`](Mobject.md#opacity)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Mobject`](Mobject.md).[`style`](Mobject.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Mobject`](Mobject.md).[`submobjects`](Mobject.md#submobjects)

## Methods

### \_computeLayout()

> `protected` **\_computeLayout**(): `void`

Defined in: [mobjects/graph/index.ts:779](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L779)

Compute vertex positions using the layout algorithm

#### Returns

`void`

***

### \_createCopy()

> `protected` **\_createCopy**(): `GenericGraph`

Defined in: [mobjects/graph/index.ts:1304](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1304)

Create a copy of this graph

#### Returns

`GenericGraph`

#### Overrides

[`Mobject`](Mobject.md).[`_createCopy`](Mobject.md#_createcopy)

***

### \_createEdgeMobject()

> `protected` **\_createEdgeMobject**(`source`, `target`): `void`

Defined in: [mobjects/graph/index.ts:842](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L842)

Create a single edge mobject

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

##### target

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`void`

***

### \_createMobjects()

> `protected` **\_createMobjects**(): `void`

Defined in: [mobjects/graph/index.ts:791](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L791)

Create vertex and edge mobjects

#### Returns

`void`

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [mobjects/graph/index.ts:1296](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1296)

Create the Three.js backing object

#### Returns

`Object3D`

#### Overrides

[`Mobject`](Mobject.md).[`_createThreeObject`](Mobject.md#_createthreeobject)

***

### \_createVertexMobject()

> `protected` **\_createVertexMobject**(`v`): `void`

Defined in: [mobjects/graph/index.ts:818](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L818)

Create a single vertex mobject

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`void`

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

[`Mobject`](Mobject.md).[`_getBoundingBox`](Mobject.md#_getboundingbox)

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

[`Mobject`](Mobject.md).[`_getEdgeInDirection`](Mobject.md#_getedgeindirection)

***

### \_getEdgeKey()

> `protected` **\_getEdgeKey**(`source`, `target`): `string`

Defined in: [mobjects/graph/index.ts:766](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L766)

Get edge key from vertex pair

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

##### target

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`string`

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:912](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L912)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`_markDirty`](Mobject.md#_markdirty)

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

[`Mobject`](Mobject.md).[`_markDirtyUpward`](Mobject.md#_markdirtyupward)

***

### \_shortenEdge()

> `protected` **\_shortenEdge**(`start`, `end`, `radius`): \[[`Vector3Tuple`](../type-aliases/Vector3Tuple.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\]

Defined in: [mobjects/graph/index.ts:879](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L879)

Shorten an edge to not overlap with vertex circles

#### Parameters

##### start

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### end

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### radius

`number`

#### Returns

\[[`Vector3Tuple`](../type-aliases/Vector3Tuple.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\]

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [core/Mobject.ts:904](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L904)

Sync material-specific properties. Override in subclasses.

#### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`_syncMaterialToThree`](Mobject.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:866](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L866)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`_syncToThree`](Mobject.md#_synctothree)

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

[`Mobject`](Mobject.md).[`add`](Mobject.md#add)

***

### addEdge()

> **addEdge**(`source`, `target`, `config?`): `this`

Defined in: [mobjects/graph/index.ts:1077](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1077)

Add an edge to the graph

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

Source vertex

##### target

[`VertexId`](../type-aliases/VertexId.md)

Target vertex

##### config?

[`EdgeConfig`](../interfaces/EdgeConfig.md)

Optional edge configuration

#### Returns

`this`

this for chaining

***

### addEdges()

> **addEdges**(...`edges`): `this`

Defined in: [mobjects/graph/index.ts:1108](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1108)

Add multiple edges to the graph

#### Parameters

##### edges

...[`EdgeTuple`](../type-aliases/EdgeTuple.md)[]

Array of [source, target] tuples

#### Returns

`this`

this for chaining

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

[`Mobject`](Mobject.md).[`addUpdater`](Mobject.md#addupdater)

***

### addVertex()

> **addVertex**(`v`, `config?`): `this`

Defined in: [mobjects/graph/index.ts:922](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L922)

Add a vertex to the graph

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

Vertex identifier

##### config?

[`VertexConfig`](../interfaces/VertexConfig.md)

Optional vertex configuration

#### Returns

`this`

this for chaining

***

### addVertices()

> **addVertices**(...`vertices`): `this`

Defined in: [mobjects/graph/index.ts:944](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L944)

Add multiple vertices to the graph

#### Parameters

##### vertices

...[`VertexId`](../type-aliases/VertexId.md)[]

Array of vertex identifiers

#### Returns

`this`

this for chaining

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

[`Mobject`](Mobject.md).[`alignTo`](Mobject.md#alignto)

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

[`Mobject`](Mobject.md).[`applyFunction`](Mobject.md#applyfunction)

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

[`Mobject`](Mobject.md).[`applyToFamily`](Mobject.md#applytofamily)

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

[`Mobject`](Mobject.md).[`become`](Mobject.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:827](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L827)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`center`](Mobject.md#center)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:1005](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1005)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`clearUpdaters`](Mobject.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:534](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L534)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`Mobject`](Mobject.md).[`copy`](Mobject.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/Mobject.ts:1206](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1206)

Clean up Three.js resources.

#### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`dispose`](Mobject.md#dispose)

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

[`Mobject`](Mobject.md).[`flip`](Mobject.md#flip)

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

[`Mobject`](Mobject.md).[`generateTarget`](Mobject.md#generatetarget)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:776](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L776)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getBottom`](Mobject.md#getbottom)

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

[`Mobject`](Mobject.md).[`getBounds`](Mobject.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:623](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L623)

Get the center point of this mobject

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getCenter`](Mobject.md#getcenter)

***

### getDegree()

> **getDegree**(`v`): `number`

Defined in: [mobjects/graph/index.ts:1064](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1064)

Get the degree of a vertex (number of edges)

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`number`

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

[`Mobject`](Mobject.md).[`getEdge`](Mobject.md#getedge)

***

### getEdgeMobject()

> **getEdgeMobject**(`source`, `target`): [`Mobject`](Mobject.md)

Defined in: [mobjects/graph/index.ts:1180](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1180)

Get the Line/Arrow mobject for an edge

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

##### target

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`Mobject`](Mobject.md)

***

### getEdges()

> **getEdges**(): [`EdgeTuple`](../type-aliases/EdgeTuple.md)[]

Defined in: [mobjects/graph/index.ts:1158](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1158)

Get all edges

#### Returns

[`EdgeTuple`](../type-aliases/EdgeTuple.md)[]

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:966](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L966)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Mobject`](Mobject.md).[`getFamily`](Mobject.md#getfamily)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:784](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L784)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getLeft`](Mobject.md#getleft)

***

### getNeighbors()

> **getNeighbors**(`v`): [`VertexId`](../type-aliases/VertexId.md)[]

Defined in: [mobjects/graph/index.ts:1049](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1049)

Get neighbors of a vertex (adjacent vertices)

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`VertexId`](../type-aliases/VertexId.md)[]

***

### getPositions()

> **getPositions**(): `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\>

Defined in: [mobjects/graph/index.ts:1228](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1228)

Get all vertex positions

#### Returns

`Map`\<[`VertexId`](../type-aliases/VertexId.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\>

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:792](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L792)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getRight`](Mobject.md#getright)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:939](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L939)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Mobject`](Mobject.md).[`getThreeObject`](Mobject.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:768](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L768)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getTop`](Mobject.md#gettop)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1022](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1022)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Mobject`](Mobject.md).[`getUpdaters`](Mobject.md#getupdaters)

***

### getVertexMobject()

> **getVertexMobject**(`v`): [`Dot`](Dot.md)

Defined in: [mobjects/graph/index.ts:1004](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1004)

Get the Dot mobject for a vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`Dot`](Dot.md)

***

### getVertexPosition()

> **getVertexPosition**(`v`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/graph/index.ts:1011](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1011)

Get the position of a vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

***

### getVertices()

> **getVertices**(): [`VertexId`](../type-aliases/VertexId.md)[]

Defined in: [mobjects/graph/index.ts:983](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L983)

Get all vertex identifiers

#### Returns

[`VertexId`](../type-aliases/VertexId.md)[]

***

### hasEdge()

> **hasEdge**(`source`, `target`): `boolean`

Defined in: [mobjects/graph/index.ts:1172](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1172)

Check if the graph contains an edge

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

##### target

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`boolean`

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:1014](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Mobject.ts#L1014)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Mobject`](Mobject.md).[`hasUpdaters`](Mobject.md#hasupdaters)

***

### hasVertex()

> **hasVertex**(`v`): `boolean`

Defined in: [mobjects/graph/index.ts:997](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L997)

Check if the graph contains a vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`boolean`

***

### highlightPath()

> **highlightPath**(`path`, `vertexColor`, `edgeColor`): `this`

Defined in: [mobjects/graph/index.ts:1261](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1261)

Highlight a path (sequence of vertices)

#### Parameters

##### path

[`VertexId`](../type-aliases/VertexId.md)[]

##### vertexColor

`string` = `RED`

##### edgeColor

`string` = `RED`

#### Returns

`this`

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

[`Mobject`](Mobject.md).[`moveTo`](Mobject.md#moveto)

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

[`Mobject`](Mobject.md).[`moveToAligned`](Mobject.md#movetoaligned)

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

[`Mobject`](Mobject.md).[`nextTo`](Mobject.md#nextto)

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

[`Mobject`](Mobject.md).[`prepareForNonlinearTransform`](Mobject.md#preparefornonlineartransform)

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

[`Mobject`](Mobject.md).[`remove`](Mobject.md#remove)

***

### removeEdge()

> **removeEdge**(`source`, `target`): `this`

Defined in: [mobjects/graph/index.ts:1135](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1135)

Remove an edge from the graph

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

Source vertex

##### target

[`VertexId`](../type-aliases/VertexId.md)

Target vertex

#### Returns

`this`

this for chaining

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

[`Mobject`](Mobject.md).[`removeUpdater`](Mobject.md#removeupdater)

***

### removeVertex()

> **removeVertex**(`v`): `this`

Defined in: [mobjects/graph/index.ts:962](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L962)

Remove a vertex from the graph

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

Vertex identifier

#### Returns

`this`

this for chaining

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

[`Mobject`](Mobject.md).[`replace`](Mobject.md#replace)

***

### resetColors()

> **resetColors**(): `this`

Defined in: [mobjects/graph/index.ts:1274](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1274)

Reset all colors to default

#### Returns

`this`

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

[`Mobject`](Mobject.md).[`restoreState`](Mobject.md#restorestate)

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

[`Mobject`](Mobject.md).[`rotate`](Mobject.md#rotate)

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

[`Mobject`](Mobject.md).[`rotateAboutOrigin`](Mobject.md#rotateaboutorigin)

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

[`Mobject`](Mobject.md).[`saveState`](Mobject.md#savestate)

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

[`Mobject`](Mobject.md).[`scale`](Mobject.md#scale)

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

[`Mobject`](Mobject.md).[`setColor`](Mobject.md#setcolor)

***

### setEdgeColor()

> **setEdgeColor**(`source`, `target`, `color`): `this`

Defined in: [mobjects/graph/index.ts:1249](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1249)

Set the color of a specific edge

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

##### target

[`VertexId`](../type-aliases/VertexId.md)

##### color

`string`

#### Returns

`this`

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

[`Mobject`](Mobject.md).[`setFill`](Mobject.md#setfill)

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

[`Mobject`](Mobject.md).[`setFillOpacity`](Mobject.md#setfillopacity)

***

### setLayout()

> **setLayout**(`layout`): `this`

Defined in: [mobjects/graph/index.ts:1192](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1192)

Change the layout algorithm

#### Parameters

##### layout

Layout type or configuration

[`LayoutConfig`](../interfaces/LayoutConfig.md) | [`LayoutType`](../type-aliases/LayoutType.md)

#### Returns

`this`

this for chaining

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

[`Mobject`](Mobject.md).[`setOpacity`](Mobject.md#setopacity)

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

[`Mobject`](Mobject.md).[`setStrokeWidth`](Mobject.md#setstrokewidth)

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

[`Mobject`](Mobject.md).[`setStyle`](Mobject.md#setstyle)

***

### setVertexColor()

> **setVertexColor**(`v`, `color`): `this`

Defined in: [mobjects/graph/index.ts:1237](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1237)

Set the color of a specific vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

##### color

`string`

#### Returns

`this`

***

### setVertexPosition()

> **setVertexPosition**(`v`, `position`): `this`

Defined in: [mobjects/graph/index.ts:1018](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1018)

Set the position of a vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

##### position

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

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

[`Mobject`](Mobject.md).[`setX`](Mobject.md#setx)

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

[`Mobject`](Mobject.md).[`setY`](Mobject.md#sety)

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

[`Mobject`](Mobject.md).[`setZ`](Mobject.md#setz)

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

[`Mobject`](Mobject.md).[`shift`](Mobject.md#shift)

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

[`Mobject`](Mobject.md).[`toCorner`](Mobject.md#tocorner)

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

[`Mobject`](Mobject.md).[`toEdge`](Mobject.md#toedge)

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

[`Mobject`](Mobject.md).[`update`](Mobject.md#update)
