# Interface: FunctionGraphOptions

Defined in: [mobjects/graphing/FunctionGraph.ts:8](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/FunctionGraph.ts#L8)

Options for creating a FunctionGraph

## Properties

### axes?

> `optional` **axes**: [`Axes`](../classes/Axes.md)

Defined in: [mobjects/graphing/FunctionGraph.ts:22](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/FunctionGraph.ts#L22)

Reference axes for coordinate transformation. Optional

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/graphing/FunctionGraph.ts:14](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/FunctionGraph.ts#L14)

Stroke color. Default: '#58c4dd' (Manim blue)

***

### discontinuities?

> `optional` **discontinuities**: `number`[]

Defined in: [mobjects/graphing/FunctionGraph.ts:18](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/FunctionGraph.ts#L18)

X values where the function is discontinuous. Default: []

***

### func()

> **func**: (`x`) => `number`

Defined in: [mobjects/graphing/FunctionGraph.ts:10](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/FunctionGraph.ts#L10)

The function to graph: y = func(x)

#### Parameters

##### x

`number`

#### Returns

`number`

***

### numSamples?

> `optional` **numSamples**: `number`

Defined in: [mobjects/graphing/FunctionGraph.ts:20](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/FunctionGraph.ts#L20)

Number of samples to take. Default: 100

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/graphing/FunctionGraph.ts:16](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/FunctionGraph.ts#L16)

Stroke width in pixels. Default: 2

***

### xRange?

> `optional` **xRange**: \[`number`, `number`\]

Defined in: [mobjects/graphing/FunctionGraph.ts:12](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/FunctionGraph.ts#L12)

X range for the graph as [min, max]. Default: from axes or [-5, 5]
