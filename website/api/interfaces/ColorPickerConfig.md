# Interface: ColorPickerConfig

Defined in: [interaction/Controls.ts:73](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/interaction/Controls.ts#L73)

Configuration for a color picker control.

## Properties

### label

> **label**: `string`

Defined in: [interaction/Controls.ts:75](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/interaction/Controls.ts#L75)

Label text displayed above the color picker.

***

### onChange()

> **onChange**: (`color`) => `void`

Defined in: [interaction/Controls.ts:79](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/interaction/Controls.ts#L79)

Callback when color changes.

#### Parameters

##### color

`string`

#### Returns

`void`

***

### value?

> `optional` **value**: `string`

Defined in: [interaction/Controls.ts:77](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/interaction/Controls.ts#L77)

Initial color value. Defaults to '#ffffff'.
