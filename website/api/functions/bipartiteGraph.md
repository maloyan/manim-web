# Function: bipartiteGraph()

> **bipartiteGraph**(`n1`, `n2`, `edges?`, `options?`): [`Graph`](../classes/Graph.md)

Defined in: [mobjects/graph/index.ts:1639](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graph/index.ts#L1639)

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
