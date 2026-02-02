# Function: succession()

> **succession**(`animations`, `options?`): [`AnimationGroup`](../classes/AnimationGroup.md)

Defined in: [animation/Succession.ts:17](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Succession.ts#L17)

Create a Succession animation group.
Animations play one after another with no overlap (lagRatio = 1).

## Parameters

### animations

[`Animation`](../classes/Animation.md)[]

Array of animations to play in sequence

### options?

[`SuccessionOptions`](../interfaces/SuccessionOptions.md)

Animation options (rateFunc)

## Returns

[`AnimationGroup`](../classes/AnimationGroup.md)
