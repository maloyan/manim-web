# Interface: Camera3DOptions

Defined in: [core/Camera.ts:7](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Camera.ts#L7)

Options for configuring a Camera3D.

## Extended by

- [`CameraFrameOptions`](CameraFrameOptions.md)

## Properties

### far?

> `optional` **far**: `number`

Defined in: [core/Camera.ts:13](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Camera.ts#L13)

Far clipping plane. Defaults to 1000.

***

### fov?

> `optional` **fov**: `number`

Defined in: [core/Camera.ts:9](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Camera.ts#L9)

Field of view in degrees. Defaults to 45.

***

### lookAt?

> `optional` **lookAt**: \[`number`, `number`, `number`\]

Defined in: [core/Camera.ts:17](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Camera.ts#L17)

Initial look-at target [x, y, z]. Defaults to origin [0, 0, 0].

***

### near?

> `optional` **near**: `number`

Defined in: [core/Camera.ts:11](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Camera.ts#L11)

Near clipping plane. Defaults to 0.1.

***

### position?

> `optional` **position**: \[`number`, `number`, `number`\]

Defined in: [core/Camera.ts:15](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Camera.ts#L15)

Initial camera position [x, y, z]. Defaults to [0, 0, 10].
