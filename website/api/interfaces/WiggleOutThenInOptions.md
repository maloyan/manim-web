# Interface: WiggleOutThenInOptions

Defined in: [animation/indication/WiggleOutThenIn.ts:26](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/WiggleOutThenIn.ts#L26)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### nWiggles?

> `optional` **nWiggles**: `number`

Defined in: [animation/indication/WiggleOutThenIn.ts:32](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/WiggleOutThenIn.ts#L32)

Number of rotation oscillations. Default: 6

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`rateFunc`](AnimationOptions.md#ratefunc)

***

### rotationAngle?

> `optional` **rotationAngle**: `number`

Defined in: [animation/indication/WiggleOutThenIn.ts:30](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/WiggleOutThenIn.ts#L30)

Maximum rotation angle in radians. Default: 0.01 * TAU (~3.6 degrees)

***

### rotationAxis?

> `optional` **rotationAxis**: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [animation/indication/WiggleOutThenIn.ts:34](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/WiggleOutThenIn.ts#L34)

Axis to rotate about. Default: [0, 0, 1] (Z axis)

***

### scaleValue?

> `optional` **scaleValue**: `number`

Defined in: [animation/indication/WiggleOutThenIn.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/WiggleOutThenIn.ts#L28)

Peak scale factor. Default: 1.1

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L17)

Shift direction for fade animations

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`shift`](AnimationOptions.md#shift)
