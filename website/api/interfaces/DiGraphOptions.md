# Interface: DiGraphOptions

Defined in: [mobjects/graph/index.ts:1370](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1370)

Options for creating a directed graph

## Extends

- [`GenericGraphOptions`](GenericGraphOptions.md)

## Properties

### edgeConfig?

> `optional` **edgeConfig**: `Map`\<`string`, [`EdgeConfig`](EdgeConfig.md)\> \| `Record`\<`string`, [`EdgeConfig`](EdgeConfig.md)\>

Defined in: [mobjects/graph/index.ts:136](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L136)

Per-edge configuration (key is "source-target")

#### Inherited from

[`GenericGraphOptions`](GenericGraphOptions.md).[`edgeConfig`](GenericGraphOptions.md#edgeconfig)

***

### edges?

> `optional` **edges**: [`EdgeTuple`](../type-aliases/EdgeTuple.md)[]

Defined in: [mobjects/graph/index.ts:126](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L126)

List of edges as [source, target] tuples

#### Inherited from

[`GenericGraphOptions`](GenericGraphOptions.md).[`edges`](GenericGraphOptions.md#edges)

***

### edgeStyle?

> `optional` **edgeStyle**: [`EdgeStyleOptions`](EdgeStyleOptions.md)

Defined in: [mobjects/graph/index.ts:132](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L132)

Default edge styling

#### Inherited from

[`GenericGraphOptions`](GenericGraphOptions.md).[`edgeStyle`](GenericGraphOptions.md#edgestyle)

***

### labelFontSize?

> `optional` **labelFontSize**: `number`

Defined in: [mobjects/graph/index.ts:140](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L140)

Label font size. Default: 24

#### Inherited from

[`GenericGraphOptions`](GenericGraphOptions.md).[`labelFontSize`](GenericGraphOptions.md#labelfontsize)

***

### layout?

> `optional` **layout**: [`LayoutConfig`](LayoutConfig.md) \| [`LayoutType`](../type-aliases/LayoutType.md)

Defined in: [mobjects/graph/index.ts:128](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L128)

Layout configuration

#### Inherited from

[`GenericGraphOptions`](GenericGraphOptions.md).[`layout`](GenericGraphOptions.md#layout)

***

### showLabels?

> `optional` **showLabels**: `boolean`

Defined in: [mobjects/graph/index.ts:138](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L138)

Whether to show vertex labels. Default: false

#### Inherited from

[`GenericGraphOptions`](GenericGraphOptions.md).[`showLabels`](GenericGraphOptions.md#showlabels)

***

### vertexConfig?

> `optional` **vertexConfig**: `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`VertexConfig`](VertexConfig.md)\> \| `Record`\<`string`, [`VertexConfig`](VertexConfig.md)\>

Defined in: [mobjects/graph/index.ts:134](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L134)

Per-vertex configuration

#### Inherited from

[`GenericGraphOptions`](GenericGraphOptions.md).[`vertexConfig`](GenericGraphOptions.md#vertexconfig)

***

### vertexStyle?

> `optional` **vertexStyle**: [`VertexStyleOptions`](VertexStyleOptions.md)

Defined in: [mobjects/graph/index.ts:130](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L130)

Default vertex styling

#### Inherited from

[`GenericGraphOptions`](GenericGraphOptions.md).[`vertexStyle`](GenericGraphOptions.md#vertexstyle)

***

### vertices?

> `optional` **vertices**: [`VertexId`](../type-aliases/VertexId.md)[]

Defined in: [mobjects/graph/index.ts:124](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L124)

List of vertex identifiers

#### Inherited from

[`GenericGraphOptions`](GenericGraphOptions.md).[`vertices`](GenericGraphOptions.md#vertices)
