# Interface: NewtonFractalOptions

Defined in: [mobjects/fractals/NewtonFractal.ts:14](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L14)

Options for creating a NewtonFractal visualization

## Properties

### center?

> `optional` **center**: \[`number`, `number`\]

Defined in: [mobjects/fractals/NewtonFractal.ts:20](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L20)

Center of the view in the complex plane [re, im]. Default: [0, 0]

***

### coefficients?

> `optional` **coefficients**: `number`[]

Defined in: [mobjects/fractals/NewtonFractal.ts:30](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L30)

Polynomial coefficients in ascending degree order.
e.g. [-1, 0, 0, 1] represents z^3 - 1  (coeff[0]*z^0 + ... + coeff[3]*z^3).
Default: [-1, 0, 0, 1]  (z^3 - 1)

***

### height?

> `optional` **height**: `number`

Defined in: [mobjects/fractals/NewtonFractal.ts:18](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L18)

Height of the render plane in world units. Default: 6

***

### lightness?

> `optional` **lightness**: `number`

Defined in: [mobjects/fractals/NewtonFractal.ts:36](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L36)

Root color lightness (0-1). Default: 0.5

***

### maxIterations?

> `optional` **maxIterations**: `number`

Defined in: [mobjects/fractals/NewtonFractal.ts:24](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L24)

Maximum iteration count. Default: 40

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [mobjects/fractals/NewtonFractal.ts:38](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L38)

Opacity (0-1). Default: 1

***

### saturation?

> `optional` **saturation**: `number`

Defined in: [mobjects/fractals/NewtonFractal.ts:34](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L34)

Root color saturation (0-1). Default: 0.85

***

### tolerance?

> `optional` **tolerance**: `number`

Defined in: [mobjects/fractals/NewtonFractal.ts:32](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L32)

Convergence threshold. Default: 1e-6

***

### width?

> `optional` **width**: `number`

Defined in: [mobjects/fractals/NewtonFractal.ts:16](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L16)

Width of the render plane in world units. Default: 8

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [mobjects/fractals/NewtonFractal.ts:22](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/mobjects/fractals/NewtonFractal.ts#L22)

Zoom level (higher = more zoomed in). Default: 1
