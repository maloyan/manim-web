# Interface: Camera3DOptions

Defined in: [core/Camera.ts:6](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L6)

Options for configuring a Camera3D.

## Extended by

- [`CameraFrameOptions`](CameraFrameOptions.md)

## Properties

### far?

> `optional` **far**: `number`

Defined in: [core/Camera.ts:12](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L12)

Far clipping plane. Defaults to 1000.

***

### fov?

> `optional` **fov**: `number`

Defined in: [core/Camera.ts:8](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L8)

Field of view in degrees. Defaults to 45.

***

### lookAt?

> `optional` **lookAt**: \[`number`, `number`, `number`\]

Defined in: [core/Camera.ts:16](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L16)

Initial look-at target [x, y, z]. Defaults to origin [0, 0, 0].

***

### near?

> `optional` **near**: `number`

Defined in: [core/Camera.ts:10](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L10)

Near clipping plane. Defaults to 0.1.

***

### position?

> `optional` **position**: \[`number`, `number`, `number`\]

Defined in: [core/Camera.ts:14](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Camera.ts#L14)

Initial camera position [x, y, z]. Defaults to [0, 0, 10].
