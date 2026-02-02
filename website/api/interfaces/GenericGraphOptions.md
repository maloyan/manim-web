# Interface: GenericGraphOptions

Defined in: [mobjects/graph/index.ts:122](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L122)

Options for creating a graph

## Extended by

- [`DiGraphOptions`](DiGraphOptions.md)

## Properties

### edgeConfig?

> `optional` **edgeConfig**: `Map`\<`string`, [`EdgeConfig`](EdgeConfig.md)\> \| `Record`\<`string`, [`EdgeConfig`](EdgeConfig.md)\>

Defined in: [mobjects/graph/index.ts:136](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L136)

Per-edge configuration (key is "source-target")

***

### edges?

> `optional` **edges**: [`EdgeTuple`](../type-aliases/EdgeTuple.md)[]

Defined in: [mobjects/graph/index.ts:126](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L126)

List of edges as [source, target] tuples

***

### edgeStyle?

> `optional` **edgeStyle**: [`EdgeStyleOptions`](EdgeStyleOptions.md)

Defined in: [mobjects/graph/index.ts:132](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L132)

Default edge styling

***

### labelFontSize?

> `optional` **labelFontSize**: `number`

Defined in: [mobjects/graph/index.ts:140](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L140)

Label font size. Default: 24

***

### layout?

> `optional` **layout**: [`LayoutConfig`](LayoutConfig.md) \| [`LayoutType`](../type-aliases/LayoutType.md)

Defined in: [mobjects/graph/index.ts:128](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L128)

Layout configuration

***

### showLabels?

> `optional` **showLabels**: `boolean`

Defined in: [mobjects/graph/index.ts:138](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L138)

Whether to show vertex labels. Default: false

***

### vertexConfig?

> `optional` **vertexConfig**: `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`VertexConfig`](VertexConfig.md)\> \| `Record`\<`string`, [`VertexConfig`](VertexConfig.md)\>

Defined in: [mobjects/graph/index.ts:134](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L134)

Per-vertex configuration

***

### vertexStyle?

> `optional` **vertexStyle**: [`VertexStyleOptions`](VertexStyleOptions.md)

Defined in: [mobjects/graph/index.ts:130](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L130)

Default vertex styling

***

### vertices?

> `optional` **vertices**: [`VertexId`](../type-aliases/VertexId.md)[]

Defined in: [mobjects/graph/index.ts:124](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graph/index.ts#L124)

List of vertex identifiers
