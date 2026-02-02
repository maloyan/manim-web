# Interface: CircumscribeOptions

Defined in: [animation/indication/Circumscribe.ts:18](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/Circumscribe.ts#L18)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### buff?

> `optional` **buff**: `number`

Defined in: [animation/indication/Circumscribe.ts:24](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/Circumscribe.ts#L24)

Buffer space between mobject and shape. Default: 0.2

***

### color?

> `optional` **color**: `string`

Defined in: [animation/indication/Circumscribe.ts:22](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/Circumscribe.ts#L22)

Color of the circumscribe shape. Default: YELLOW

***

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### fadeOut?

> `optional` **fadeOut**: `boolean`

Defined in: [animation/indication/Circumscribe.ts:30](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/Circumscribe.ts#L30)

Whether to fade out after drawing. Default: true

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`rateFunc`](AnimationOptions.md#ratefunc)

***

### shape?

> `optional` **shape**: [`CircumscribeShape`](../type-aliases/CircumscribeShape.md)

Defined in: [animation/indication/Circumscribe.ts:20](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/Circumscribe.ts#L20)

Shape to draw around the mobject. Default: 'rectangle'

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L17)

Shift direction for fade animations

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`shift`](AnimationOptions.md#shift)

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Defined in: [animation/indication/Circumscribe.ts:26](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/Circumscribe.ts#L26)

Width of the shape stroke. Default: DEFAULT_STROKE_WIDTH

***

### timeWidth?

> `optional` **timeWidth**: `number`

Defined in: [animation/indication/Circumscribe.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/Circumscribe.ts#L28)

Time proportion to draw the shape (0-1). Default: 0.3
