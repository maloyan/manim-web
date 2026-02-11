# Interface: AxesOptions

Defined in: [mobjects/graphing/Axes.ts:16](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L16)

Options for creating Axes

## Extended by

- [`NumberPlaneOptions`](NumberPlaneOptions.md)

## Properties

### axisConfig?

> `optional` **axisConfig**: `Partial`\<[`NumberLineOptions`](NumberLineOptions.md)\>

Defined in: [mobjects/graphing/Axes.ts:28](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L28)

Common configuration for both axes

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/graphing/Axes.ts:26](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L26)

Stroke color for axes. Default: '#ffffff'

***

### tipLength?

> `optional` **tipLength**: `number`

Defined in: [mobjects/graphing/Axes.ts:36](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L36)

Length of arrow tips. Default: 0.25

***

### tips?

> `optional` **tips**: `boolean`

Defined in: [mobjects/graphing/Axes.ts:34](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L34)

Whether to include arrow tips on axes. Default: true

***

### xAxisConfig?

> `optional` **xAxisConfig**: `Partial`\<[`NumberLineOptions`](NumberLineOptions.md)\>

Defined in: [mobjects/graphing/Axes.ts:30](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L30)

Configuration specific to x-axis (overrides axisConfig)

***

### xLength?

> `optional` **xLength**: `number`

Defined in: [mobjects/graphing/Axes.ts:22](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L22)

Visual length of the x-axis. Default: 10

***

### xRange?

> `optional` **xRange**: \[`number`, `number`, `number`\] \| \[`number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:18](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L18)

X-axis range as [min, max] or [min, max, step]. Default: [-5, 5, 1]

***

### yAxisConfig?

> `optional` **yAxisConfig**: `Partial`\<[`NumberLineOptions`](NumberLineOptions.md)\>

Defined in: [mobjects/graphing/Axes.ts:32](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L32)

Configuration specific to y-axis (overrides axisConfig)

***

### yLength?

> `optional` **yLength**: `number`

Defined in: [mobjects/graphing/Axes.ts:24](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L24)

Visual length of the y-axis. Default: 6

***

### yRange?

> `optional` **yRange**: \[`number`, `number`, `number`\] \| \[`number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:20](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/graphing/Axes.ts#L20)

Y-axis range as [min, max] or [min, max, step]. Default: [-3, 3, 1]
