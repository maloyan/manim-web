# Interface: PointLightOptions

Defined in: [core/Lighting.ts:30](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Lighting.ts#L30)

Options for configuring a point light.

## Properties

### castShadow?

> `optional` **castShadow**: `boolean`

Defined in: [core/Lighting.ts:42](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Lighting.ts#L42)

Whether the light casts shadows. Defaults to false.

***

### color?

> `optional` **color**: `string`

Defined in: [core/Lighting.ts:32](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Lighting.ts#L32)

Light color. Defaults to '#ffffff'.

***

### decay?

> `optional` **decay**: `number`

Defined in: [core/Lighting.ts:40](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Lighting.ts#L40)

Light decay rate. Defaults to 2 (physically correct).

***

### distance?

> `optional` **distance**: `number`

Defined in: [core/Lighting.ts:38](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Lighting.ts#L38)

Maximum range of the light. Defaults to 0 (no limit).

***

### intensity?

> `optional` **intensity**: `number`

Defined in: [core/Lighting.ts:34](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Lighting.ts#L34)

Light intensity. Defaults to 1.

***

### position?

> `optional` **position**: \[`number`, `number`, `number`\]

Defined in: [core/Lighting.ts:36](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Lighting.ts#L36)

Light position [x, y, z]. Defaults to [0, 5, 0].
