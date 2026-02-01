# Interface: SpotLightOptions

Defined in: [core/Lighting.ts:48](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L48)

Options for configuring a spot light.

## Properties

### angle?

> `optional` **angle**: `number`

Defined in: [core/Lighting.ts:58](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L58)

Maximum angle of light dispersion from its direction (radians). Defaults to PI/3.

***

### castShadow?

> `optional` **castShadow**: `boolean`

Defined in: [core/Lighting.ts:64](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L64)

Whether the light casts shadows. Defaults to false.

***

### color?

> `optional` **color**: `string`

Defined in: [core/Lighting.ts:50](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L50)

Light color. Defaults to '#ffffff'.

***

### decay?

> `optional` **decay**: `number`

Defined in: [core/Lighting.ts:62](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L62)

Light decay rate. Defaults to 2 (physically correct).

***

### distance?

> `optional` **distance**: `number`

Defined in: [core/Lighting.ts:56](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L56)

Maximum range of the light. Defaults to 0 (no limit).

***

### intensity?

> `optional` **intensity**: `number`

Defined in: [core/Lighting.ts:52](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L52)

Light intensity. Defaults to 1.

***

### penumbra?

> `optional` **penumbra**: `number`

Defined in: [core/Lighting.ts:60](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L60)

Percent of the cone attenuated due to penumbra. Defaults to 0.

***

### position?

> `optional` **position**: \[`number`, `number`, `number`\]

Defined in: [core/Lighting.ts:54](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L54)

Light position [x, y, z]. Defaults to [0, 10, 0].

***

### target?

> `optional` **target**: \[`number`, `number`, `number`\]

Defined in: [core/Lighting.ts:66](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Lighting.ts#L66)

Target position for the light to point at [x, y, z]. Defaults to origin.
