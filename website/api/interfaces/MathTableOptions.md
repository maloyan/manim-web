# Interface: MathTableOptions

Defined in: [mobjects/table/Table.ts:592](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L592)

Options for creating a MathTable

## Extends

- `Omit`\<[`TableOptions`](TableOptions.md), `"data"` \| `"rowLabels"` \| `"colLabels"`\>

## Properties

### arrangeInRowsFirst?

> `optional` **arrangeInRowsFirst**: `boolean`

Defined in: [mobjects/table/Table.ts:41](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L41)

Whether to arrange entries in rows. Default: true

#### Inherited from

[`TableOptions`](TableOptions.md).[`arrangeInRowsFirst`](TableOptions.md#arrangeinrowsfirst)

***

### backgroundFillOpacity?

> `optional` **backgroundFillOpacity**: `number`

Defined in: [mobjects/table/Table.ts:47](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L47)

Background fill opacity. Default: 0

#### Inherited from

[`TableOptions`](TableOptions.md).[`backgroundFillOpacity`](TableOptions.md#backgroundfillopacity)

***

### backgroundStrokeColor?

> `optional` **backgroundStrokeColor**: `string`

Defined in: [mobjects/table/Table.ts:45](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L45)

Background color for cells. Default: transparent

#### Inherited from

[`TableOptions`](TableOptions.md).[`backgroundStrokeColor`](TableOptions.md#backgroundstrokecolor)

***

### colLabels?

> `optional` **colLabels**: `string`[]

Defined in: [mobjects/table/Table.ts:598](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L598)

Column labels as LaTeX strings

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/table/Table.ts:602](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L602)

Color for all entries. Default: WHITE

***

### data

> **data**: `string`[][]

Defined in: [mobjects/table/Table.ts:594](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L594)

2D array of LaTeX strings

***

### entriesColor?

> `optional` **entriesColor**: `string`

Defined in: [mobjects/table/Table.ts:43](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L43)

Color for all entries. If set, overrides individual colors

#### Inherited from

[`TableOptions`](TableOptions.md).[`entriesColor`](TableOptions.md#entriescolor)

***

### fontSize?

> `optional` **fontSize**: `number`

Defined in: [mobjects/table/Table.ts:600](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L600)

Font size for MathTex entries. Default: 36

***

### hBuff?

> `optional` **hBuff**: `number`

Defined in: [mobjects/table/Table.ts:35](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L35)

Horizontal buffer between cells. Default: 0.5

#### Inherited from

[`TableOptions`](TableOptions.md).[`hBuff`](TableOptions.md#hbuff)

***

### includeOuterLines?

> `optional` **includeOuterLines**: `boolean`

Defined in: [mobjects/table/Table.ts:31](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L31)

Whether to include outer lines around the table. Default: true

#### Inherited from

[`TableOptions`](TableOptions.md).[`includeOuterLines`](TableOptions.md#includeouterlines)

***

### lineColor?

> `optional` **lineColor**: `string`

Defined in: [mobjects/table/Table.ts:37](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L37)

Color of the grid lines. Default: WHITE

#### Inherited from

[`TableOptions`](TableOptions.md).[`lineColor`](TableOptions.md#linecolor)

***

### lineStrokeWidth?

> `optional` **lineStrokeWidth**: `number`

Defined in: [mobjects/table/Table.ts:39](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L39)

Stroke width of grid lines. Default: 2

#### Inherited from

[`TableOptions`](TableOptions.md).[`lineStrokeWidth`](TableOptions.md#linestrokewidth)

***

### position?

> `optional` **position**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/table/Table.ts:49](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L49)

Starting position. Default: ORIGIN

#### Inherited from

[`TableOptions`](TableOptions.md).[`position`](TableOptions.md#position)

***

### rowLabels?

> `optional` **rowLabels**: `string`[]

Defined in: [mobjects/table/Table.ts:596](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L596)

Row labels as LaTeX strings

***

### topLeftEntry?

> `optional` **topLeftEntry**: [`Mobject`](../classes/Mobject.md)

Defined in: [mobjects/table/Table.ts:29](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L29)

Top-left element when both row and column labels exist

#### Inherited from

[`TableOptions`](TableOptions.md).[`topLeftEntry`](TableOptions.md#topleftentry)

***

### vBuff?

> `optional` **vBuff**: `number`

Defined in: [mobjects/table/Table.ts:33](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/table/Table.ts#L33)

Vertical buffer between cells. Default: 0.3

#### Inherited from

[`TableOptions`](TableOptions.md).[`vBuff`](TableOptions.md#vbuff)
