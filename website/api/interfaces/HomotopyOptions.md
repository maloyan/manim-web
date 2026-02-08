# Interface: HomotopyOptions

Defined in: [animation/movement/Homotopy.ts:44](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L44)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### homotopyFunc

> **homotopyFunc**: [`HomotopyFunction`](../type-aliases/HomotopyFunction.md)

Defined in: [animation/movement/Homotopy.ts:46](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L46)

The homotopy function to apply

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
