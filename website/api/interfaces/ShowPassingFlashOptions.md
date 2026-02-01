# Interface: ShowPassingFlashOptions

Defined in: [animation/indication/ShowPassingFlash.ts:18](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/ShowPassingFlash.ts#L18)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### color?

> `optional` **color**: `string`

Defined in: [animation/indication/ShowPassingFlash.ts:20](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/ShowPassingFlash.ts#L20)

Color of the flash. Default: YELLOW

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

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [animation/indication/ShowPassingFlash.ts:24](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/ShowPassingFlash.ts#L24)

Stroke width of the flash. Default: DEFAULT_STROKE_WIDTH * 1.5

***

### timeWidth?

> `optional` **timeWidth**: `number`

Defined in: [animation/indication/ShowPassingFlash.ts:22](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/indication/ShowPassingFlash.ts#L22)

Width of the flash as a proportion of the path (0-1). Default: 0.2
