# Interface: PointCloudDotOptions

Defined in: [mobjects/point/index.ts:667](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/point/index.ts#L667)

Options for creating a PointCloudDot

## Properties

### center?

> `optional` **center**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/point/index.ts:669](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/point/index.ts#L669)

Center position [x, y, z]. Default: [0, 0, 0]

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/point/index.ts:675](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/point/index.ts#L675)

Color as CSS color string. Default: white (#FFFFFF)

***

### distribution?

> `optional` **distribution**: `"uniform"` \| `"gaussian"`

Defined in: [mobjects/point/index.ts:681](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/point/index.ts#L681)

Spread pattern: 'uniform' for even distribution, 'gaussian' for center-heavy. Default: 'gaussian'

***

### numParticles?

> `optional` **numParticles**: `number`

Defined in: [mobjects/point/index.ts:673](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/point/index.ts#L673)

Number of particles. Default: 50

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [mobjects/point/index.ts:677](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/point/index.ts#L677)

Opacity from 0 to 1. Default: 1

***

### particleSize?

> `optional` **particleSize**: `number`

Defined in: [mobjects/point/index.ts:679](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/point/index.ts#L679)

Size of each particle in pixels. Default: 4

***

### radius?

> `optional` **radius**: `number`

Defined in: [mobjects/point/index.ts:671](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/mobjects/point/index.ts#L671)

Radius of the dot. Default: 0.08
