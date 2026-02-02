# Interface: DecimalTableOptions

Defined in: [mobjects/table/Table.ts:773](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L773)

Options for creating a DecimalTable

## Extends

- `Omit`\<[`TableOptions`](TableOptions.md), `"data"` \| `"rowLabels"` \| `"colLabels"`\>

## Properties

### arrangeInRowsFirst?

> `optional` **arrangeInRowsFirst**: `boolean`

Defined in: [mobjects/table/Table.ts:41](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L41)

Whether to arrange entries in rows. Default: true

#### Inherited from

[`TableOptions`](TableOptions.md).[`arrangeInRowsFirst`](TableOptions.md#arrangeinrowsfirst)

***

### backgroundFillOpacity?

> `optional` **backgroundFillOpacity**: `number`

Defined in: [mobjects/table/Table.ts:47](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L47)

Background fill opacity. Default: 0

#### Inherited from

[`TableOptions`](TableOptions.md).[`backgroundFillOpacity`](TableOptions.md#backgroundfillopacity)

***

### backgroundStrokeColor?

> `optional` **backgroundStrokeColor**: `string`

Defined in: [mobjects/table/Table.ts:45](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L45)

Background color for cells. Default: transparent

#### Inherited from

[`TableOptions`](TableOptions.md).[`backgroundStrokeColor`](TableOptions.md#backgroundstrokecolor)

***

### colLabels?

> `optional` **colLabels**: `number`[]

Defined in: [mobjects/table/Table.ts:779](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L779)

Column labels as decimal numbers

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/table/Table.ts:785](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L785)

Color for all entries. Default: WHITE

***

### data

> **data**: `number`[][]

Defined in: [mobjects/table/Table.ts:775](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L775)

2D array of decimal numbers

***

### entriesColor?

> `optional` **entriesColor**: `string`

Defined in: [mobjects/table/Table.ts:43](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L43)

Color for all entries. If set, overrides individual colors

#### Inherited from

[`TableOptions`](TableOptions.md).[`entriesColor`](TableOptions.md#entriescolor)

***

### fontSize?

> `optional` **fontSize**: `number`

Defined in: [mobjects/table/Table.ts:783](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L783)

Font size. Default: 36

***

### hBuff?

> `optional` **hBuff**: `number`

Defined in: [mobjects/table/Table.ts:35](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L35)

Horizontal buffer between cells. Default: 0.5

#### Inherited from

[`TableOptions`](TableOptions.md).[`hBuff`](TableOptions.md#hbuff)

***

### includeOuterLines?

> `optional` **includeOuterLines**: `boolean`

Defined in: [mobjects/table/Table.ts:31](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L31)

Whether to include outer lines around the table. Default: true

#### Inherited from

[`TableOptions`](TableOptions.md).[`includeOuterLines`](TableOptions.md#includeouterlines)

***

### lineColor?

> `optional` **lineColor**: `string`

Defined in: [mobjects/table/Table.ts:37](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L37)

Color of the grid lines. Default: WHITE

#### Inherited from

[`TableOptions`](TableOptions.md).[`lineColor`](TableOptions.md#linecolor)

***

### lineStrokeWidth?

> `optional` **lineStrokeWidth**: `number`

Defined in: [mobjects/table/Table.ts:39](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L39)

Stroke width of grid lines. Default: 2

#### Inherited from

[`TableOptions`](TableOptions.md).[`lineStrokeWidth`](TableOptions.md#linestrokewidth)

***

### numDecimalPlaces?

> `optional` **numDecimalPlaces**: `number`

Defined in: [mobjects/table/Table.ts:781](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L781)

Number of decimal places. Default: 2

***

### position?

> `optional` **position**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/table/Table.ts:49](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L49)

Starting position. Default: ORIGIN

#### Inherited from

[`TableOptions`](TableOptions.md).[`position`](TableOptions.md#position)

***

### rowLabels?

> `optional` **rowLabels**: `number`[]

Defined in: [mobjects/table/Table.ts:777](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L777)

Row labels as decimal numbers

***

### topLeftEntry?

> `optional` **topLeftEntry**: [`Mobject`](../classes/Mobject.md)

Defined in: [mobjects/table/Table.ts:29](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L29)

Top-left element when both row and column labels exist

#### Inherited from

[`TableOptions`](TableOptions.md).[`topLeftEntry`](TableOptions.md#topleftentry)

***

### vBuff?

> `optional` **vBuff**: `number`

Defined in: [mobjects/table/Table.ts:33](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/table/Table.ts#L33)

Vertical buffer between cells. Default: 0.3

#### Inherited from

[`TableOptions`](TableOptions.md).[`vBuff`](TableOptions.md#vbuff)
