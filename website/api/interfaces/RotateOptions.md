# Interface: RotateOptions

Defined in: [animation/movement/Rotate.ts:9](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/movement/Rotate.ts#L9)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### aboutPoint?

> `optional` **aboutPoint**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [animation/movement/Rotate.ts:15](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/movement/Rotate.ts#L15)

Point to rotate about, defaults to mobject center

***

### angle

> **angle**: `number`

Defined in: [animation/movement/Rotate.ts:11](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/movement/Rotate.ts#L11)

Angle to rotate in radians

***

### axis?

> `optional` **axis**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [animation/movement/Rotate.ts:13](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/movement/Rotate.ts#L13)

Axis of rotation [x, y, z], defaults to Z axis [0, 0, 1]

***

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`rateFunc`](AnimationOptions.md#ratefunc)

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L17)

Shift direction for fade animations

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`shift`](AnimationOptions.md#shift)
