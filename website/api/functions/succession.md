# Function: succession()

> **succession**(`animations`, `options?`): [`AnimationGroup`](../classes/AnimationGroup.md)

Defined in: [animation/Succession.ts:17](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Succession.ts#L17)

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
