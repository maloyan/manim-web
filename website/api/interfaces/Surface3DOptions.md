# Interface: Surface3DOptions

Defined in: [mobjects/three-d/Surface3D.ts:8](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L8)

Options for creating a Surface3D

## Properties

### center?

> `optional` **center**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/Surface3D.ts:20](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L20)

Center position [x, y, z]. Default: [0, 0, 0]

***

### checkerboardColors?

> `optional` **checkerboardColors**: \[`string`, `string`\]

Defined in: [mobjects/three-d/Surface3D.ts:30](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L30)

Two alternating colors for a checkerboard pattern on the surface, e.g. ['#E65A4C', '#CF5044'].

***

### color?

> `optional` **color**: `string`

Defined in: [mobjects/three-d/Surface3D.ts:22](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L22)

Color as CSS color string. Default: '#ffffff'

***

### doubleSided?

> `optional` **doubleSided**: `boolean`

Defined in: [mobjects/three-d/Surface3D.ts:28](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L28)

Whether to render both sides. Default: true

***

### func()

> **func**: (`u`, `v`) => [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/three-d/Surface3D.ts:10](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L10)

Parametric function (u, v) => [x, y, z]

#### Parameters

##### u

`number`

##### v

`number`

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [mobjects/three-d/Surface3D.ts:24](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L24)

Opacity from 0 to 1. Default: 1

***

### uRange?

> `optional` **uRange**: \[`number`, `number`\]

Defined in: [mobjects/three-d/Surface3D.ts:12](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L12)

U parameter range [min, max]. Default: [0, 1]

***

### uResolution?

> `optional` **uResolution**: `number`

Defined in: [mobjects/three-d/Surface3D.ts:16](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L16)

Number of segments in U direction. Default: 32

***

### vRange?

> `optional` **vRange**: \[`number`, `number`\]

Defined in: [mobjects/three-d/Surface3D.ts:14](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L14)

V parameter range [min, max]. Default: [0, 1]

***

### vResolution?

> `optional` **vResolution**: `number`

Defined in: [mobjects/three-d/Surface3D.ts:18](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L18)

Number of segments in V direction. Default: 32

***

### wireframe?

> `optional` **wireframe**: `boolean`

Defined in: [mobjects/three-d/Surface3D.ts:26](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/three-d/Surface3D.ts#L26)

Whether to render as wireframe. Default: false
