# Interface: FlashOptions

Defined in: [animation/indication/Flash.ts:16](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/indication/Flash.ts#L16)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### color?

> `optional` **color**: `string`

Defined in: [animation/indication/Flash.ts:18](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/indication/Flash.ts#L18)

Color of the flash lines. Default: YELLOW

***

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### flashRadius?

> `optional` **flashRadius**: `number`

Defined in: [animation/indication/Flash.ts:22](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/indication/Flash.ts#L22)

Maximum radius the flash extends to. Default: 1

***

### innerRadius?

> `optional` **innerRadius**: `number`

Defined in: [animation/indication/Flash.ts:26](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/indication/Flash.ts#L26)

Starting radius (from center). Default: 0

***

### lineWidth?

> `optional` **lineWidth**: `number`

Defined in: [animation/indication/Flash.ts:24](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/indication/Flash.ts#L24)

Width of flash lines. Default: DEFAULT_STROKE_WIDTH

***

### numLines?

> `optional` **numLines**: `number`

Defined in: [animation/indication/Flash.ts:20](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/indication/Flash.ts#L20)

Number of flash lines. Default: 8

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`rateFunc`](AnimationOptions.md#ratefunc)

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/Animation.ts#L17)

Shift direction for fade animations

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`shift`](AnimationOptions.md#shift)
