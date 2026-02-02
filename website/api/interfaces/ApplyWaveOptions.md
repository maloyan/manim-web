# Interface: ApplyWaveOptions

Defined in: [animation/indication/ApplyWave.ts:16](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/ApplyWave.ts#L16)

## Extends

- [`AnimationOptions`](AnimationOptions.md)

## Properties

### amplitude?

> `optional` **amplitude**: `number`

Defined in: [animation/indication/ApplyWave.ts:20](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/ApplyWave.ts#L20)

Amplitude of the wave. Default: 0.2

***

### direction?

> `optional` **direction**: [`WaveDirection`](../type-aliases/WaveDirection.md)

Defined in: [animation/indication/ApplyWave.ts:18](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/ApplyWave.ts#L18)

Direction of the wave. Default: 'horizontal'

***

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`duration`](AnimationOptions.md#duration)

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`rateFunc`](AnimationOptions.md#ratefunc)

***

### ripples?

> `optional` **ripples**: `boolean`

Defined in: [animation/indication/ApplyWave.ts:26](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/ApplyWave.ts#L26)

Ripple out from center instead of linear wave. Default: false

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L17)

Shift direction for fade animations

#### Inherited from

[`AnimationOptions`](AnimationOptions.md).[`shift`](AnimationOptions.md#shift)

***

### speed?

> `optional` **speed**: `number`

Defined in: [animation/indication/ApplyWave.ts:24](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/ApplyWave.ts#L24)

Speed multiplier for wave propagation. Default: 1

***

### wavelength?

> `optional` **wavelength**: `number`

Defined in: [animation/indication/ApplyWave.ts:22](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/indication/ApplyWave.ts#L22)

Number of wave cycles. Default: 1.5
