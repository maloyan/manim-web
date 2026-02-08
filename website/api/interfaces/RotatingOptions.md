# Interface: RotatingOptions

Defined in: [animation/utility/index.ts:163](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/utility/index.ts#L163)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### aboutPoint?

> `optional` **aboutPoint**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [animation/utility/index.ts:169](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/utility/index.ts#L169)

Point to rotate about. Default: mobject center

***

### angle?

> `optional` **angle**: `number`

Defined in: [animation/utility/index.ts:165](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/utility/index.ts#L165)

Total angle to rotate in radians. Default: 2*PI (full revolution, matching Manim's TAU)

***

### axis?

> `optional` **axis**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [animation/utility/index.ts:167](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/utility/index.ts#L167)

Axis of rotation [x, y, z]. Default: Z axis [0, 0, 1]

***

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`rateFunc`](AnimationOptions.md#ratefunc)

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L17)

Shift direction for fade animations

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`shift`](AnimationOptions.md#shift)
