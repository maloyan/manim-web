# Interface: AnimationOptions

Defined in: [animation/Animation.ts:11](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L11)

## Extended by

- [`WriteOptions`](WriteOptions.md)
- [`AddTextLetterByLetterOptions`](AddTextLetterByLetterOptions.md)
- [`FadeToColorOptions`](FadeToColorOptions.md)
- [`RotateOptions`](RotateOptions.md)
- [`ScaleOptions`](ScaleOptions.md)
- [`ShiftOptions`](ShiftOptions.md)
- [`MoveAlongPathOptions`](MoveAlongPathOptions.md)
- [`HomotopyOptions`](HomotopyOptions.md)
- [`ComplexHomotopyOptions`](ComplexHomotopyOptions.md)
- [`SmoothedVectorizedHomotopyOptions`](SmoothedVectorizedHomotopyOptions.md)
- [`PhaseFlowOptions`](PhaseFlowOptions.md)
- [`RotatingOptions`](RotatingOptions.md)
- [`BroadcastOptions`](BroadcastOptions.md)
- [`IndicateOptions`](IndicateOptions.md)
- [`FlashOptions`](FlashOptions.md)
- [`CircumscribeOptions`](CircumscribeOptions.md)
- [`WiggleOptions`](WiggleOptions.md)
- [`ShowPassingFlashOptions`](ShowPassingFlashOptions.md)
- [`ApplyWaveOptions`](ApplyWaveOptions.md)
- [`FocusOnOptions`](FocusOnOptions.md)
- [`PulseOptions`](PulseOptions.md)
- [`ShowCreationThenDestructionOptions`](ShowCreationThenDestructionOptions.md)
- [`WiggleOutThenInOptions`](WiggleOutThenInOptions.md)

## Properties

### duration?

> `optional` **duration**: `number`

Defined in: [animation/Animation.ts:13](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L13)

Duration of the animation in seconds (default: 1)

***

### rateFunc?

> `optional` **rateFunc**: [`RateFunction`](../type-aliases/RateFunction.md)

Defined in: [animation/Animation.ts:15](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L15)

Rate function controlling the animation's pacing (default: smooth)

***

### shift?

> `optional` **shift**: \[`number`, `number`, `number`\]

Defined in: [animation/Animation.ts:17](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Animation.ts#L17)

Shift direction for fade animations
