# Function: bipartiteGraph()

> **bipartiteGraph**(`n1`, `n2`, `edges?`, `options?`): [`Graph`](../classes/Graph.md)

Defined in: [mobjects/graph/index.ts:1639](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/graph/index.ts#L1639)

Create a bipartite graph

## Parameters

### n1

`number`

Number of vertices in first partition

### n2

`number`

Number of vertices in second partition

### edges?

[`EdgeTuple`](../type-aliases/EdgeTuple.md)[]

Edges between partitions (optional, complete if not provided)

### options?

`Partial`\<[`GenericGraphOptions`](../interfaces/GenericGraphOptions.md)\> = `{}`

## Returns

[`Graph`](../classes/Graph.md)

A bipartite Graph
