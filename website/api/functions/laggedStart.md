# Function: laggedStart()

> **laggedStart**(`animations`, `options?`): [`AnimationGroup`](../classes/AnimationGroup.md)

Defined in: [animation/LaggedStart.ts:24](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/LaggedStart.ts#L24)

Create a LaggedStart animation group.
Each animation starts lagRatio * singleDuration after the previous.

## Parameters

### animations

[`Animation`](../classes/Animation.md)[]

Array of animations to stagger

### options?

[`LaggedStartOptions`](../interfaces/LaggedStartOptions.md)

Options including lagRatio (default 0.2)

## Returns

[`AnimationGroup`](../classes/AnimationGroup.md)
