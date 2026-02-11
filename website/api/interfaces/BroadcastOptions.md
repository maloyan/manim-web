# Interface: BroadcastOptions

Defined in: [animation/utility/index.ts:287](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/utility/index.ts#L287)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### color?

> `optional` **color**: `string`

Defined in: [animation/utility/index.ts:289](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/utility/index.ts#L289)

Color of the broadcast rings. Default: YELLOW

***

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### lagRatio?

> `optional` **lagRatio**: `number`

Defined in: [animation/utility/index.ts:297](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/utility/index.ts#L297)

Time offset between rings (0-1). Default: 0.3

***

### maxRadius?

> `optional` **maxRadius**: `number`

Defined in: [animation/utility/index.ts:293](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/utility/index.ts#L293)

Maximum radius the rings expand to. Default: 2

***

### numRings?

> `optional` **numRings**: `number`

Defined in: [animation/utility/index.ts:291](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/utility/index.ts#L291)

Number of rings to broadcast. Default: 3

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`rateFunc`](AnimationOptions.md#ratefunc)

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/Animation.ts#L17)

Shift direction for fade animations

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`shift`](AnimationOptions.md#shift)

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [animation/utility/index.ts:295](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/utility/index.ts#L295)

Stroke width of rings. Default: DEFAULT_STROKE_WIDTH
