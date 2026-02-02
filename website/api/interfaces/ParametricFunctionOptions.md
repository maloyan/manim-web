# Interface: ParametricFunctionOptions

Defined in: [mobjects/graphing/ParametricFunction.ts:8](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/ParametricFunction.ts#L8)

Options for creating a ParametricFunction

## Properties

### axes?

> `optional` **axes**: [`Axes`](../classes/Axes.md)

Defined in: [mobjects/graphing/ParametricFunction.ts:20](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/ParametricFunction.ts#L20)

Reference axes for coordinate transformation. Optional

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/graphing/ParametricFunction.ts:14](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/ParametricFunction.ts#L14)

Stroke color. Default: '#58c4dd' (Manim blue)

***

### func()

> **func**: (`t`) => \[`number`, `number`, `number`\] \| \[`number`, `number`\]

Defined in: [mobjects/graphing/ParametricFunction.ts:10](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/ParametricFunction.ts#L10)

The parametric function: returns [x, y] or [x, y, z] for a given t

#### Parameters

##### t

`number`

#### Returns

\[`number`, `number`, `number`\] \| \[`number`, `number`\]

***

### numSamples?

> `optional` **numSamples**: `number`

Defined in: [mobjects/graphing/ParametricFunction.ts:18](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/ParametricFunction.ts#L18)

Number of samples to take. Default: 100

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [mobjects/graphing/ParametricFunction.ts:16](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/ParametricFunction.ts#L16)

Stroke width in pixels. Default: 2

***

### tRange?

> `optional` **tRange**: \[`number`, `number`\]

Defined in: [mobjects/graphing/ParametricFunction.ts:12](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/ParametricFunction.ts#L12)

Parameter range as [min, max]. Default: [0, 1]

***

### useAxesCoords?

> `optional` **useAxesCoords**: `boolean`

Defined in: [mobjects/graphing/ParametricFunction.ts:22](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/ParametricFunction.ts#L22)

Whether to use axes coordinate transformation. Default: true if axes provided
