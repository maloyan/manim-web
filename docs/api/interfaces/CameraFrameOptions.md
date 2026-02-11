# Interface: CameraFrameOptions

Defined in: [core/CameraFrame.ts:29](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/CameraFrame.ts#L29)

Options for creating a CameraFrame.

## Extends

- [`Camera3DOptions`](Camera3DOptions.md)

## Properties

### distance?

> `optional` **distance**: `number`

Defined in: [core/CameraFrame.ts:37](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/CameraFrame.ts#L37)

Initial distance from the look-at target. Defaults to 10.

***

### far?

> `optional` **far**: `number`

Defined in: [core/Camera.ts:13](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Camera.ts#L13)

Far clipping plane. Defaults to 1000.

#### Inherited from

[`Camera3DOptions`](Camera3DOptions.md).[`far`](Camera3DOptions.md#far)

***

### fov?

> `optional` **fov**: `number`

Defined in: [core/Camera.ts:9](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Camera.ts#L9)

Field of view in degrees. Defaults to 45.

#### Inherited from

[`Camera3DOptions`](Camera3DOptions.md).[`fov`](Camera3DOptions.md#fov)

***

### gamma?

> `optional` **gamma**: `number`

Defined in: [core/CameraFrame.ts:35](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/CameraFrame.ts#L35)

Initial gamma (roll) angle in radians. Defaults to 0.

***

### lookAt?

> `optional` **lookAt**: \[`number`, `number`, `number`\]

Defined in: [core/Camera.ts:17](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Camera.ts#L17)

Initial look-at target [x, y, z]. Defaults to origin [0, 0, 0].

#### Inherited from

[`Camera3DOptions`](Camera3DOptions.md).[`lookAt`](Camera3DOptions.md#lookat)

***

### near?

> `optional` **near**: `number`

Defined in: [core/Camera.ts:11](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Camera.ts#L11)

Near clipping plane. Defaults to 0.1.

#### Inherited from

[`Camera3DOptions`](Camera3DOptions.md).[`near`](Camera3DOptions.md#near)

***

### phi?

> `optional` **phi**: `number`

Defined in: [core/CameraFrame.ts:33](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/CameraFrame.ts#L33)

Initial phi (polar) angle in radians. Defaults to PI/4.

***

### position?

> `optional` **position**: \[`number`, `number`, `number`\]

Defined in: [core/Camera.ts:15](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Camera.ts#L15)

Initial camera position [x, y, z]. Defaults to [0, 0, 10].

#### Inherited from

[`Camera3DOptions`](Camera3DOptions.md).[`position`](Camera3DOptions.md#position)

***

### theta?

> `optional` **theta**: `number`

Defined in: [core/CameraFrame.ts:31](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/CameraFrame.ts#L31)

Initial theta (azimuthal) angle in radians. Defaults to -PI/2.
