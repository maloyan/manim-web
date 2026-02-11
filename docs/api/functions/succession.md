# Function: succession()

> **succession**(`animations`, `options?`): [`AnimationGroup`](../classes/AnimationGroup.md)

Defined in: [animation/Succession.ts:17](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/Succession.ts#L17)

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
