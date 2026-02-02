# Interface: NumberPlaneOptions

Defined in: [mobjects/graphing/NumberPlane.ts:20](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/NumberPlane.ts#L20)

Options for creating a NumberPlane

## Extends

- [`AxesOptions`](AxesOptions.md)

## Properties

### axisConfig?

> `optional` **axisConfig**: `Partial`\<[`NumberLineOptions`](NumberLineOptions.md)\>

Defined in: [mobjects/graphing/Axes.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L28)

Common configuration for both axes

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`axisConfig`](AxesOptions.md#axisconfig)

***

### backgroundLineStyle?

> `optional` **backgroundLineStyle**: [`BackgroundLineStyle`](BackgroundLineStyle.md)

Defined in: [mobjects/graphing/NumberPlane.ts:24](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/NumberPlane.ts#L24)

Style configuration for background grid lines

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/graphing/Axes.ts:26](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L26)

Stroke color for axes. Default: '#ffffff'

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`color`](AxesOptions.md#color)

***

### fadedLineRatio?

> `optional` **fadedLineRatio**: `number`

Defined in: [mobjects/graphing/NumberPlane.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/NumberPlane.ts#L28)

Number of faded lines per interval between main lines. Default: 1

***

### fadedLineStyle?

> `optional` **fadedLineStyle**: [`BackgroundLineStyle`](BackgroundLineStyle.md)

Defined in: [mobjects/graphing/NumberPlane.ts:26](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/NumberPlane.ts#L26)

Style configuration for faded sub-grid lines. Auto-computed from backgroundLineStyle if not set.

***

### fadingFactor?

> `optional` **fadingFactor**: `number`

Defined in: [mobjects/graphing/NumberPlane.ts:30](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/NumberPlane.ts#L30)

Fading factor for lines far from axes. Default: 1 (no fading)

***

### includeBackgroundLines?

> `optional` **includeBackgroundLines**: `boolean`

Defined in: [mobjects/graphing/NumberPlane.ts:22](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/NumberPlane.ts#L22)

Whether to include background grid lines. Default: true

***

### tipLength?

> `optional` **tipLength**: `number`

Defined in: [mobjects/graphing/Axes.ts:36](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L36)

Length of arrow tips. Default: 0.25

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`tipLength`](AxesOptions.md#tiplength)

***

### tips?

> `optional` **tips**: `boolean`

Defined in: [mobjects/graphing/Axes.ts:34](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L34)

Whether to include arrow tips on axes. Default: true

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`tips`](AxesOptions.md#tips)

***

### xAxisConfig?

> `optional` **xAxisConfig**: `Partial`\<[`NumberLineOptions`](NumberLineOptions.md)\>

Defined in: [mobjects/graphing/Axes.ts:30](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L30)

Configuration specific to x-axis (overrides axisConfig)

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`xAxisConfig`](AxesOptions.md#xaxisconfig)

***

### xLength?

> `optional` **xLength**: `number`

Defined in: [mobjects/graphing/Axes.ts:22](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L22)

Visual length of the x-axis. Default: 10

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`xLength`](AxesOptions.md#xlength)

***

### xRange?

> `optional` **xRange**: \[`number`, `number`, `number`\] \| \[`number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:18](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L18)

X-axis range as [min, max] or [min, max, step]. Default: [-5, 5, 1]

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`xRange`](AxesOptions.md#xrange)

***

### yAxisConfig?

> `optional` **yAxisConfig**: `Partial`\<[`NumberLineOptions`](NumberLineOptions.md)\>

Defined in: [mobjects/graphing/Axes.ts:32](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L32)

Configuration specific to y-axis (overrides axisConfig)

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`yAxisConfig`](AxesOptions.md#yaxisconfig)

***

### yLength?

> `optional` **yLength**: `number`

Defined in: [mobjects/graphing/Axes.ts:24](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L24)

Visual length of the y-axis. Default: 6

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`yLength`](AxesOptions.md#ylength)

***

### yRange?

> `optional` **yRange**: \[`number`, `number`, `number`\] \| \[`number`, `number`\]

Defined in: [mobjects/graphing/Axes.ts:20](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/graphing/Axes.ts#L20)

Y-axis range as [min, max] or [min, max, step]. Default: [-3, 3, 1]

#### Inherited from

[`AxesOptions`](AxesOptions.md).[`yRange`](AxesOptions.md#yrange)
