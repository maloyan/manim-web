# Function: bipartiteGraph()

> **bipartiteGraph**(`n1`, `n2`, `edges?`, `options?`): [`Graph`](../classes/Graph.md)

Defined in: [mobjects/graph/index.ts:1639](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graph/index.ts#L1639)

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
