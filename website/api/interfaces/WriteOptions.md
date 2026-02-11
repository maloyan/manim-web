# Interface: WriteOptions

Defined in: [animation/creation/Create.ts:417](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/creation/Create.ts#L417)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### lagRatio?

> `optional` **lagRatio**: `number`

Defined in: [animation/creation/Create.ts:419](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/creation/Create.ts#L419)

Stagger between characters, default 0.05

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`rateFunc`](AnimationOptions.md#ratefunc)

***

### remover?

> `optional` **remover**: `boolean`

Defined in: [animation/creation/Create.ts:423](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/creation/Create.ts#L423)

Remove after animation, default false

***

### reverse?

> `optional` **reverse**: `boolean`

Defined in: [animation/creation/Create.ts:421](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/creation/Create.ts#L421)

Write in reverse (right to left), default false

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/Animation.ts#L17)

Shift direction for fade animations

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`shift`](AnimationOptions.md#shift)

***

### strokeRatio?

> `optional` **strokeRatio**: `number`

Defined in: [animation/creation/Create.ts:425](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/creation/Create.ts#L425)

Ratio of animation time spent on stroke drawing vs cross-fade (default 0.7 = 70% stroke, 30% crossfade)

***

### useSkeletonStroke?

> `optional` **useSkeletonStroke**: `boolean`

Defined in: [animation/creation/Create.ts:432](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/creation/Create.ts#L432)

When true, the Write animation uses the glyph's skeleton (medial axis)
for stroke drawing, producing natural center-line pen strokes instead
of perimeter outlines. Requires glyphs to be loaded with
`useSkeletonStroke: true`. Default: false (uses outline strokes).
