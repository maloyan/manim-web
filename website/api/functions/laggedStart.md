# Function: laggedStart()

> **laggedStart**(`animations`, `options?`): [`AnimationGroup`](../classes/AnimationGroup.md)

Defined in: [animation/LaggedStart.ts:24](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/LaggedStart.ts#L24)

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
