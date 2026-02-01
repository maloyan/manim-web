# Interface: WiggleOptions

Defined in: [animation/indication/Wiggle.ts:13](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/Wiggle.ts#L13)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### aboutPoint?

> `optional` **aboutPoint**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [animation/indication/Wiggle.ts:23](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/Wiggle.ts#L23)

Point to wiggle about. Default: mobject center

***

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### nWiggles?

> `optional` **nWiggles**: `number`

Defined in: [animation/indication/Wiggle.ts:17](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/Wiggle.ts#L17)

Number of wiggles. Default: 6

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`rateFunc`](AnimationOptions.md#ratefunc)

***

### rotationAngle?

> `optional` **rotationAngle**: `number`

Defined in: [animation/indication/Wiggle.ts:15](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/Wiggle.ts#L15)

Maximum rotation angle in radians. Default: PI/12 (15 degrees)

***

### rotationAxis?

> `optional` **rotationAxis**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [animation/indication/Wiggle.ts:21](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/Wiggle.ts#L21)

Axis to rotate about. Default: [0, 0, 1] (Z axis)

***

### scaleFactor?

> `optional` **scaleFactor**: `number`

Defined in: [animation/indication/Wiggle.ts:19](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/Wiggle.ts#L19)

Scale factor at peak of wiggle. Default: 1.1

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Animation.ts#L17)

Shift direction for fade animations

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`shift`](AnimationOptions.md#shift)
