# Interface: LayoutConfig

Defined in: [mobjects/graph/index.ts:102](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graph/index.ts#L102)

Layout configuration options

## Properties

### center?

> `optional` **center**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/graph/index.ts:108](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graph/index.ts#L108)

Center point of the layout. Default: [0, 0, 0]

***

### iterations?

> `optional` **iterations**: `number`

Defined in: [mobjects/graph/index.ts:110](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graph/index.ts#L110)

Number of iterations for force-directed layouts. Default: 50

***

### partition?

> `optional` **partition**: \[[`VertexId`](../type-aliases/VertexId.md)[], [`VertexId`](../type-aliases/VertexId.md)[]\]

Defined in: [mobjects/graph/index.ts:114](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graph/index.ts#L114)

For bipartite layout: partition sets

***

### positions?

> `optional` **positions**: `Map`\<[`VertexId`](../type-aliases/VertexId.md), [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)\>

Defined in: [mobjects/graph/index.ts:116](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graph/index.ts#L116)

Custom positions map for custom layout

***

### root?

> `optional` **root**: [`VertexId`](../type-aliases/VertexId.md)

Defined in: [mobjects/graph/index.ts:112](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graph/index.ts#L112)

For tree layout: root vertex

***

### scale?

> `optional` **scale**: `number`

Defined in: [mobjects/graph/index.ts:106](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graph/index.ts#L106)

Scale factor for the layout. Default: 2

***

### type

> **type**: [`LayoutType`](../type-aliases/LayoutType.md)

Defined in: [mobjects/graph/index.ts:104](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graph/index.ts#L104)

Type of layout algorithm
