# Interface: TableOptions

Defined in: [mobjects/table/Table.ts:21](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L21)

Options for creating a Table

## Extended by

- [`MobjectTableOptions`](MobjectTableOptions.md)

## Properties

### arrangeInRowsFirst?

> `optional` **arrangeInRowsFirst**: `boolean`

Defined in: [mobjects/table/Table.ts:41](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L41)

Whether to arrange entries in rows. Default: true

***

### backgroundFillOpacity?

> `optional` **backgroundFillOpacity**: `number`

Defined in: [mobjects/table/Table.ts:47](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L47)

Background fill opacity. Default: 0

***

### backgroundStrokeColor?

> `optional` **backgroundStrokeColor**: `string`

Defined in: [mobjects/table/Table.ts:45](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L45)

Background color for cells. Default: transparent

***

### colLabels?

> `optional` **colLabels**: [`Mobject`](../classes/Mobject.md)[]

Defined in: [mobjects/table/Table.ts:27](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L27)

Column labels to display on top

***

### data

> **data**: [`Mobject`](../classes/Mobject.md)[][]

Defined in: [mobjects/table/Table.ts:23](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L23)

2D array of mobjects to display in the table

***

### entriesColor?

> `optional` **entriesColor**: `string`

Defined in: [mobjects/table/Table.ts:43](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L43)

Color for all entries. If set, overrides individual colors

***

### hBuff?

> `optional` **hBuff**: `number`

Defined in: [mobjects/table/Table.ts:35](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L35)

Horizontal buffer between cells. Default: 0.5

***

### includeOuterLines?

> `optional` **includeOuterLines**: `boolean`

Defined in: [mobjects/table/Table.ts:31](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L31)

Whether to include outer lines around the table. Default: true

***

### lineColor?

> `optional` **lineColor**: `string`

Defined in: [mobjects/table/Table.ts:37](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L37)

Color of the grid lines. Default: WHITE

***

### lineStrokeWidth?

> `optional` **lineStrokeWidth**: `number`

Defined in: [mobjects/table/Table.ts:39](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L39)

Stroke width of grid lines. Default: 2

***

### position?

> `optional` **position**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/table/Table.ts:49](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L49)

Starting position. Default: ORIGIN

***

### rowLabels?

> `optional` **rowLabels**: [`Mobject`](../classes/Mobject.md)[]

Defined in: [mobjects/table/Table.ts:25](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L25)

Row labels to display on the left side

***

### topLeftEntry?

> `optional` **topLeftEntry**: [`Mobject`](../classes/Mobject.md)

Defined in: [mobjects/table/Table.ts:29](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L29)

Top-left element when both row and column labels exist

***

### vBuff?

> `optional` **vBuff**: `number`

Defined in: [mobjects/table/Table.ts:33](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/mobjects/table/Table.ts#L33)

Vertical buffer between cells. Default: 0.3
