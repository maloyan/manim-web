# Class: DiGraph

Defined in: [mobjects/graph/index.ts:1399](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1399)

DiGraph - Directed graph visualization

Creates a graph with vertices connected by directed edges (Arrows).

## Example

```typescript
// Create a directed graph
const digraph = new DiGraph({
  vertices: ['A', 'B', 'C'],
  edges: [['A', 'B'], ['B', 'C'], ['C', 'A']],
  layout: 'circular'
});

// Tree structure with directed edges
const tree = new DiGraph({
  vertices: ['root', 'left', 'right', 'leafL', 'leafR'],
  edges: [
    ['root', 'left'],
    ['root', 'right'],
    ['left', 'leafL'],
    ['right', 'leafR']
  ],
  layout: { type: 'tree', root: 'root' }
});
```

## Extends

- [`GenericGraph`](GenericGraph.md)

## Constructors

### Constructor

> **new DiGraph**(`options`): `DiGraph`

Defined in: [mobjects/graph/index.ts:1400](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1400)

#### Parameters

##### options

[`DiGraphOptions`](../interfaces/DiGraphOptions.md) = `{}`

#### Returns

`DiGraph`

#### Overrides

[`GenericGraph`](GenericGraph.md).[`constructor`](GenericGraph.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`__savedMobjectState`](GenericGraph.md#__savedmobjectstate)

***

### \_directed

> `protected` **\_directed**: `boolean` = `false`

Defined in: [mobjects/graph/index.ts:686](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L686)

Whether this is a directed graph

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_directed`](GenericGraph.md#_directed)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_dirty`](GenericGraph.md#_dirty)

***

### \_edgeConfig

> `protected` **\_edgeConfig**: `Map`\<`string`, [`EdgeConfig`](../interfaces/EdgeConfig.md)\>

Defined in: [mobjects/graph/index.ts:683](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L683)

Per-edge configuration

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_edgeConfig`](GenericGraph.md#_edgeconfig)

***

### \_edgeMobjects

> `protected` **\_edgeMobjects**: `Map`\<`string`, [`Mobject`](Mobject.md)\>

Defined in: [mobjects/graph/index.ts:668](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L668)

Map of edge key to Line/Arrow mobject

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_edgeMobjects`](GenericGraph.md#_edgemobjects)

***

### \_edges

> `protected` **\_edges**: [`EdgeTuple`](../type-aliases/EdgeTuple.md)[] = `[]`

Defined in: [mobjects/graph/index.ts:659](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L659)

List of edges as [source, target] tuples

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_edges`](GenericGraph.md#_edges)

***

### \_edgeStyle

> `protected` **\_edgeStyle**: [`EdgeStyleOptions`](../interfaces/EdgeStyleOptions.md)

Defined in: [mobjects/graph/index.ts:677](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L677)

Default edge style

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_edgeStyle`](GenericGraph.md#_edgestyle)

***

### \_group

> `protected` **\_group**: `Group`\<`Object3DEventMap`\> = `null`

Defined in: [mobjects/graph/index.ts:689](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L689)

Three.js group for this graph

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_group`](GenericGraph.md#_group)

***

### \_layoutConfig

> `protected` **\_layoutConfig**: [`LayoutConfig`](../interfaces/LayoutConfig.md)

Defined in: [mobjects/graph/index.ts:671](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L671)

Layout configuration

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_layoutConfig`](GenericGraph.md#_layoutconfig)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_opacity`](GenericGraph.md#_opacity)

***

### \_positions

> `protected` **\_positions**: `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\>

Defined in: [mobjects/graph/index.ts:662](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L662)

Map of vertex id to position

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_positions`](GenericGraph.md#_positions)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_style`](GenericGraph.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_threeObject`](GenericGraph.md#_threeobject)

***

### \_vertexConfig

> `protected` **\_vertexConfig**: `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`VertexConfig`](../interfaces/VertexConfig.md)\>

Defined in: [mobjects/graph/index.ts:680](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L680)

Per-vertex configuration

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_vertexConfig`](GenericGraph.md#_vertexconfig)

***

### \_vertexMobjects

> `protected` **\_vertexMobjects**: `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`Dot`](Dot.md)\>

Defined in: [mobjects/graph/index.ts:665](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L665)

Map of vertex id to Dot mobject

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_vertexMobjects`](GenericGraph.md#_vertexmobjects)

***

### \_vertexStyle

> `protected` **\_vertexStyle**: [`VertexStyleOptions`](../interfaces/VertexStyleOptions.md)

Defined in: [mobjects/graph/index.ts:674](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L674)

Default vertex style

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_vertexStyle`](GenericGraph.md#_vertexstyle)

***

### \_vertices

> `protected` **\_vertices**: [`VertexId`](../type-aliases/VertexId.md)[] = `[]`

Defined in: [mobjects/graph/index.ts:656](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L656)

List of vertex identifiers

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_vertices`](GenericGraph.md#_vertices)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`children`](GenericGraph.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`fillOpacity`](GenericGraph.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`id`](GenericGraph.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`parent`](GenericGraph.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`position`](GenericGraph.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`rotation`](GenericGraph.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`savedState`](GenericGraph.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`scaleVector`](GenericGraph.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`strokeWidth`](GenericGraph.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`targetCopy`](GenericGraph.md#targetcopy)

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

[`GenericGraph`](GenericGraph.md).[`color`](GenericGraph.md#color)

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

[`GenericGraph`](GenericGraph.md).[`fillColor`](GenericGraph.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:933](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L933)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`isDirty`](GenericGraph.md#isdirty)

***

### numEdges

#### Get Signature

> **get** **numEdges**(): `number`

Defined in: [mobjects/graph/index.ts:1165](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1165)

Get the number of edges

##### Returns

`number`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`numEdges`](GenericGraph.md#numedges)

***

### numVertices

#### Get Signature

> **get** **numVertices**(): `number`

Defined in: [mobjects/graph/index.ts:990](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L990)

Get the number of vertices

##### Returns

`number`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`numVertices`](GenericGraph.md#numvertices)

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

[`GenericGraph`](GenericGraph.md).[`opacity`](GenericGraph.md#opacity)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`style`](GenericGraph.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`submobjects`](GenericGraph.md#submobjects)

## Methods

### \_computeLayout()

> `protected` **\_computeLayout**(): `void`

Defined in: [mobjects/graph/index.ts:779](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L779)

Compute vertex positions using the layout algorithm

#### Returns

`void`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_computeLayout`](GenericGraph.md#_computelayout)

***

### \_createCopy()

> `protected` **\_createCopy**(): `DiGraph`

Defined in: [mobjects/graph/index.ts:1458](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1458)

Create a copy of this digraph

#### Returns

`DiGraph`

#### Overrides

[`GenericGraph`](GenericGraph.md).[`_createCopy`](GenericGraph.md#_createcopy)

***

### \_createEdgeMobject()

> `protected` **\_createEdgeMobject**(`source`, `target`): `void`

Defined in: [mobjects/graph/index.ts:842](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L842)

Create a single edge mobject

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

##### target

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`void`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_createEdgeMobject`](GenericGraph.md#_createedgemobject)

***

### \_createMobjects()

> `protected` **\_createMobjects**(): `void`

Defined in: [mobjects/graph/index.ts:791](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L791)

Create vertex and edge mobjects

#### Returns

`void`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_createMobjects`](GenericGraph.md#_createmobjects)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [mobjects/graph/index.ts:1296](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1296)

Create the Three.js backing object

#### Returns

`Object3D`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_createThreeObject`](GenericGraph.md#_createthreeobject)

***

### \_createVertexMobject()

> `protected` **\_createVertexMobject**(`v`): `void`

Defined in: [mobjects/graph/index.ts:818](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L818)

Create a single vertex mobject

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`void`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_createVertexMobject`](GenericGraph.md#_createvertexmobject)

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

[`GenericGraph`](GenericGraph.md).[`_getBoundingBox`](GenericGraph.md#_getboundingbox)

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

[`GenericGraph`](GenericGraph.md).[`_getEdgeInDirection`](GenericGraph.md#_getedgeindirection)

***

### \_getEdgeKey()

> `protected` **\_getEdgeKey**(`source`, `target`): `string`

Defined in: [mobjects/graph/index.ts:766](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L766)

Get edge key from vertex pair

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

##### target

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`string`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_getEdgeKey`](GenericGraph.md#_getedgekey)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:913](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L913)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_markDirty`](GenericGraph.md#_markdirty)

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

[`GenericGraph`](GenericGraph.md).[`_markDirtyUpward`](GenericGraph.md#_markdirtyupward)

***

### \_shortenEdge()

> `protected` **\_shortenEdge**(`start`, `end`, `radius`): \[[`Vector3Tuple`](../type-aliases/Vector3Tuple.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\]

Defined in: [mobjects/graph/index.ts:879](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L879)

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

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_shortenEdge`](GenericGraph.md#_shortenedge)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [core/Mobject.ts:905](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L905)

Sync material-specific properties. Override in subclasses.

#### Returns

`void`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_syncMaterialToThree`](GenericGraph.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:867](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L867)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`_syncToThree`](GenericGraph.md#_synctothree)

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:492](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L492)

Add a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to add

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`add`](GenericGraph.md#add)

***

### addEdge()

> **addEdge**(`source`, `target`, `config?`): `this`

Defined in: [mobjects/graph/index.ts:1077](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1077)

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

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`addEdge`](GenericGraph.md#addedge)

***

### addEdges()

> **addEdges**(...`edges`): `this`

Defined in: [mobjects/graph/index.ts:1108](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1108)

Add multiple edges to the graph

#### Parameters

##### edges

...[`EdgeTuple`](../type-aliases/EdgeTuple.md)[]

Array of [source, target] tuples

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`addEdges`](GenericGraph.md#addedges)

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

[`GenericGraph`](GenericGraph.md).[`addUpdater`](GenericGraph.md#addupdater)

***

### addVertex()

> **addVertex**(`v`, `config?`): `this`

Defined in: [mobjects/graph/index.ts:922](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L922)

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

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`addVertex`](GenericGraph.md#addvertex)

***

### addVertices()

> **addVertices**(...`vertices`): `this`

Defined in: [mobjects/graph/index.ts:944](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L944)

Add multiple vertices to the graph

#### Parameters

##### vertices

...[`VertexId`](../type-aliases/VertexId.md)[]

Array of vertex identifiers

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`addVertices`](GenericGraph.md#addvertices)

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

[`GenericGraph`](GenericGraph.md).[`alignTo`](GenericGraph.md#alignto)

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

[`GenericGraph`](GenericGraph.md).[`applyFunction`](GenericGraph.md#applyfunction)

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

[`GenericGraph`](GenericGraph.md).[`applyToFamily`](GenericGraph.md#applytofamily)

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

[`GenericGraph`](GenericGraph.md).[`become`](GenericGraph.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:828](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L828)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`center`](GenericGraph.md#center)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:1006](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1006)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`clearUpdaters`](GenericGraph.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:536](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L536)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`copy`](GenericGraph.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [core/Mobject.ts:1207](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1207)

Clean up Three.js resources.

#### Returns

`void`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`dispose`](GenericGraph.md#dispose)

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

[`GenericGraph`](GenericGraph.md).[`flip`](GenericGraph.md#flip)

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

[`GenericGraph`](GenericGraph.md).[`generateTarget`](GenericGraph.md#generatetarget)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:777](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L777)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getBottom`](GenericGraph.md#getbottom)

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

[`GenericGraph`](GenericGraph.md).[`getBounds`](GenericGraph.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:625](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L625)

Get the center point of this mobject

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Center position as [x, y, z]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getCenter`](GenericGraph.md#getcenter)

***

### getDegree()

> **getDegree**(`v`): `number`

Defined in: [mobjects/graph/index.ts:1064](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1064)

Get the degree of a vertex (number of edges)

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`number`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getDegree`](GenericGraph.md#getdegree)

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

[`GenericGraph`](GenericGraph.md).[`getEdge`](GenericGraph.md#getedge)

***

### getEdgeMobject()

> **getEdgeMobject**(`source`, `target`): [`Mobject`](Mobject.md)

Defined in: [mobjects/graph/index.ts:1180](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1180)

Get the Line/Arrow mobject for an edge

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

##### target

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`Mobject`](Mobject.md)

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getEdgeMobject`](GenericGraph.md#getedgemobject)

***

### getEdges()

> **getEdges**(): [`EdgeTuple`](../type-aliases/EdgeTuple.md)[]

Defined in: [mobjects/graph/index.ts:1158](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1158)

Get all edges

#### Returns

[`EdgeTuple`](../type-aliases/EdgeTuple.md)[]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getEdges`](GenericGraph.md#getedges)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:967](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L967)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getFamily`](GenericGraph.md#getfamily)

***

### getInDegree()

> **getInDegree**(`v`): `number`

Defined in: [mobjects/graph/index.ts:1451](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1451)

Get in-degree (number of incoming edges)

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`number`

***

### getInNeighbors()

> **getInNeighbors**(`v`): [`VertexId`](../type-aliases/VertexId.md)[]

Defined in: [mobjects/graph/index.ts:1431](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1431)

Get in-neighbors (vertices that point to this vertex)

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`VertexId`](../type-aliases/VertexId.md)[]

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:785](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L785)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getLeft`](GenericGraph.md#getleft)

***

### getNeighbors()

> **getNeighbors**(`v`): [`VertexId`](../type-aliases/VertexId.md)[]

Defined in: [mobjects/graph/index.ts:1049](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1049)

Get neighbors of a vertex (adjacent vertices)

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`VertexId`](../type-aliases/VertexId.md)[]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getNeighbors`](GenericGraph.md#getneighbors)

***

### getOutDegree()

> **getOutDegree**(`v`): `number`

Defined in: [mobjects/graph/index.ts:1444](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1444)

Get out-degree (number of outgoing edges)

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`number`

***

### getOutNeighbors()

> **getOutNeighbors**(`v`): [`VertexId`](../type-aliases/VertexId.md)[]

Defined in: [mobjects/graph/index.ts:1418](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1418)

Get out-neighbors (vertices this vertex points to)

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`VertexId`](../type-aliases/VertexId.md)[]

***

### getPositions()

> **getPositions**(): `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\>

Defined in: [mobjects/graph/index.ts:1228](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1228)

Get all vertex positions

#### Returns

`Map`\<[`VertexId`](../type-aliases/VertexId.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\>

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getPositions`](GenericGraph.md#getpositions)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:793](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L793)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getRight`](GenericGraph.md#getright)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:940](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L940)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getThreeObject`](GenericGraph.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:769](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L769)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getTop`](GenericGraph.md#gettop)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1023](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1023)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getUpdaters`](GenericGraph.md#getupdaters)

***

### getVertexMobject()

> **getVertexMobject**(`v`): [`Dot`](Dot.md)

Defined in: [mobjects/graph/index.ts:1004](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1004)

Get the Dot mobject for a vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`Dot`](Dot.md)

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getVertexMobject`](GenericGraph.md#getvertexmobject)

***

### getVertexPosition()

> **getVertexPosition**(`v`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/graph/index.ts:1011](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1011)

Get the position of a vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getVertexPosition`](GenericGraph.md#getvertexposition)

***

### getVertices()

> **getVertices**(): [`VertexId`](../type-aliases/VertexId.md)[]

Defined in: [mobjects/graph/index.ts:983](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L983)

Get all vertex identifiers

#### Returns

[`VertexId`](../type-aliases/VertexId.md)[]

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`getVertices`](GenericGraph.md#getvertices)

***

### hasEdge()

> **hasEdge**(`source`, `target`): `boolean`

Defined in: [mobjects/graph/index.ts:1172](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1172)

Check if the graph contains an edge

#### Parameters

##### source

[`VertexId`](../type-aliases/VertexId.md)

##### target

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`boolean`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`hasEdge`](GenericGraph.md#hasedge)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:1015](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1015)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`hasUpdaters`](GenericGraph.md#hasupdaters)

***

### hasVertex()

> **hasVertex**(`v`): `boolean`

Defined in: [mobjects/graph/index.ts:997](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L997)

Check if the graph contains a vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

#### Returns

`boolean`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`hasVertex`](GenericGraph.md#hasvertex)

***

### highlightPath()

> **highlightPath**(`path`, `vertexColor`, `edgeColor`): `this`

Defined in: [mobjects/graph/index.ts:1261](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1261)

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

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`highlightPath`](GenericGraph.md#highlightpath)

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:215](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L215)

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

[`GenericGraph`](GenericGraph.md).[`moveTo`](GenericGraph.md#moveto)

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

[`GenericGraph`](GenericGraph.md).[`moveToAligned`](GenericGraph.md#movetoaligned)

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

[`GenericGraph`](GenericGraph.md).[`nextTo`](GenericGraph.md#nextto)

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

[`GenericGraph`](GenericGraph.md).[`prepareForNonlinearTransform`](GenericGraph.md#preparefornonlineartransform)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:517](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L517)

Remove a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`remove`](GenericGraph.md#remove)

***

### removeEdge()

> **removeEdge**(`source`, `target`): `this`

Defined in: [mobjects/graph/index.ts:1135](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1135)

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

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`removeEdge`](GenericGraph.md#removeedge)

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

[`GenericGraph`](GenericGraph.md).[`removeUpdater`](GenericGraph.md#removeupdater)

***

### removeVertex()

> **removeVertex**(`v`): `this`

Defined in: [mobjects/graph/index.ts:962](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L962)

Remove a vertex from the graph

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

Vertex identifier

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`removeVertex`](GenericGraph.md#removevertex)

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

[`GenericGraph`](GenericGraph.md).[`replace`](GenericGraph.md#replace)

***

### resetColors()

> **resetColors**(): `this`

Defined in: [mobjects/graph/index.ts:1274](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1274)

Reset all colors to default

#### Returns

`this`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`resetColors`](GenericGraph.md#resetcolors)

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

[`GenericGraph`](GenericGraph.md).[`restoreState`](GenericGraph.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axisOrOptions?`): `this`

Defined in: [core/Mobject.ts:245](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L245)

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

[`GenericGraph`](GenericGraph.md).[`rotate`](GenericGraph.md#rotate)

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

[`GenericGraph`](GenericGraph.md).[`rotateAboutOrigin`](GenericGraph.md#rotateaboutorigin)

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

[`GenericGraph`](GenericGraph.md).[`saveState`](GenericGraph.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Mobject.ts:378](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L378)

Scale the mobject uniformly or non-uniformly

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`scale`](GenericGraph.md#scale)

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/Mobject.ts:398](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L398)

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

[`GenericGraph`](GenericGraph.md).[`setColor`](GenericGraph.md#setcolor)

***

### setEdgeColor()

> **setEdgeColor**(`source`, `target`, `color`): `this`

Defined in: [mobjects/graph/index.ts:1249](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1249)

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

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`setEdgeColor`](GenericGraph.md#setedgecolor)

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

[`GenericGraph`](GenericGraph.md).[`setFill`](GenericGraph.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:444](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L444)

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

[`GenericGraph`](GenericGraph.md).[`setFillOpacity`](GenericGraph.md#setfillopacity)

***

### setLayout()

> **setLayout**(`layout`): `this`

Defined in: [mobjects/graph/index.ts:1192](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1192)

Change the layout algorithm

#### Parameters

##### layout

Layout type or configuration

[`LayoutConfig`](../interfaces/LayoutConfig.md) | [`LayoutType`](../type-aliases/LayoutType.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`setLayout`](GenericGraph.md#setlayout)

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:412](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L412)

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

[`GenericGraph`](GenericGraph.md).[`setOpacity`](GenericGraph.md#setopacity)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Mobject.ts:428](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L428)

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

[`GenericGraph`](GenericGraph.md).[`setStrokeWidth`](GenericGraph.md#setstrokewidth)

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

[`GenericGraph`](GenericGraph.md).[`setStyle`](GenericGraph.md#setstyle)

***

### setVertexColor()

> **setVertexColor**(`v`, `color`): `this`

Defined in: [mobjects/graph/index.ts:1237](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1237)

Set the color of a specific vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

##### color

`string`

#### Returns

`this`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`setVertexColor`](GenericGraph.md#setvertexcolor)

***

### setVertexPosition()

> **setVertexPosition**(`v`, `position`): `this`

Defined in: [mobjects/graph/index.ts:1018](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1018)

Set the position of a vertex

#### Parameters

##### v

[`VertexId`](../type-aliases/VertexId.md)

##### position

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`setVertexPosition`](GenericGraph.md#setvertexposition)

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

[`GenericGraph`](GenericGraph.md).[`setX`](GenericGraph.md#setx)

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

[`GenericGraph`](GenericGraph.md).[`setY`](GenericGraph.md#sety)

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

[`GenericGraph`](GenericGraph.md).[`setZ`](GenericGraph.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Mobject.ts:201](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L201)

Translate the mobject by a delta

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`GenericGraph`](GenericGraph.md).[`shift`](GenericGraph.md#shift)

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

[`GenericGraph`](GenericGraph.md).[`toCorner`](GenericGraph.md#tocorner)

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

[`GenericGraph`](GenericGraph.md).[`toEdge`](GenericGraph.md#toedge)

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

[`GenericGraph`](GenericGraph.md).[`update`](GenericGraph.md#update)
