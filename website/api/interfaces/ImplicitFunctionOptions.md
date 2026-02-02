# Interface: ImplicitFunctionOptions

Defined in: [mobjects/graphing/ImplicitFunction.ts:7](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/ImplicitFunction.ts#L7)

Options for creating an ImplicitFunction

## Properties

### axes?

> `optional` **axes**: [`Axes`](../classes/Axes.md)

Defined in: [mobjects/graphing/ImplicitFunction.ts:23](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/ImplicitFunction.ts#L23)

Reference axes for coordinate transformation. Optional

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/graphing/ImplicitFunction.ts:19](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/ImplicitFunction.ts#L19)

Stroke color. Default: '#58c4dd' (Manim blue)

***

### func()

> **func**: (`x`, `y`) => `number`

Defined in: [mobjects/graphing/ImplicitFunction.ts:9](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/ImplicitFunction.ts#L9)

The implicit function f(x, y) whose zero-level set is plotted

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`number`

***

### maxDepth?

> `optional` **maxDepth**: `number`

Defined in: [mobjects/graphing/ImplicitFunction.ts:17](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/ImplicitFunction.ts#L17)

Maximum grid depth for adaptive refinement (grid = 2^maxDepth at finest). Default: 9

***

### minDepth?

> `optional` **minDepth**: `number`

Defined in: [mobjects/graphing/ImplicitFunction.ts:15](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/ImplicitFunction.ts#L15)

Minimum grid depth (grid = 2^minDepth cells per axis). Default: 5

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/graphing/ImplicitFunction.ts:21](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/ImplicitFunction.ts#L21)

Stroke width in pixels. Default: 2

***

### xRange?

> `optional` **xRange**: \[`number`, `number`\]

Defined in: [mobjects/graphing/ImplicitFunction.ts:11](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/ImplicitFunction.ts#L11)

X range for the plot as [min, max]. Default: [-5, 5]

***

### yRange?

> `optional` **yRange**: \[`number`, `number`\]

Defined in: [mobjects/graphing/ImplicitFunction.ts:13](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/graphing/ImplicitFunction.ts#L13)

Y range for the plot as [min, max]. Default: [-5, 5]
