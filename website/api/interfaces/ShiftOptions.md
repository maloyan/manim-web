# Interface: ShiftOptions

Defined in: [animation/movement/Shift.ts:9](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Shift.ts#L9)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### direction

> **direction**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [animation/movement/Shift.ts:11](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Shift.ts#L11)

Direction/delta to move [dx, dy, dz]

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
