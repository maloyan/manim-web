# Interface: SliderConfig

Defined in: [interaction/Controls.ts:33](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Controls.ts#L33)

Configuration for a slider control.

## Properties

### label

> **label**: `string`

Defined in: [interaction/Controls.ts:35](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Controls.ts#L35)

Label text displayed above the slider.

***

### max

> **max**: `number`

Defined in: [interaction/Controls.ts:39](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Controls.ts#L39)

Maximum value.

***

### min

> **min**: `number`

Defined in: [interaction/Controls.ts:37](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Controls.ts#L37)

Minimum value.

***

### onChange()

> **onChange**: (`value`) => `void`

Defined in: [interaction/Controls.ts:45](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Controls.ts#L45)

Callback when value changes.

#### Parameters

##### value

`number`

#### Returns

`void`

***

### step?

> `optional` **step**: `number`

Defined in: [interaction/Controls.ts:43](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Controls.ts#L43)

Step increment. Defaults to (max-min)/100.

***

### value?

> `optional` **value**: `number`

Defined in: [interaction/Controls.ts:41](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Controls.ts#L41)

Initial value. Defaults to min.
