# Function: updateFromAlphaFunc()

> **updateFromAlphaFunc**(`mobject`, `func`, `options?`): [`UpdateFromAlphaFunc`](../classes/UpdateFromAlphaFunc.md)

Defined in: [animation/UpdateFromAlphaFunc.ts:50](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/UpdateFromAlphaFunc.ts#L50)

Factory function to create an UpdateFromAlphaFunc animation.

## Parameters

### mobject

[`Mobject`](../classes/Mobject.md)

The mobject to animate

### func

(`mobject`, `alpha`) => `void`

Function called with (mobject, alpha) each frame

### options?

[`AnimationOptions`](../interfaces/AnimationOptions.md)

Animation options (duration, rateFunc, etc.)

## Returns

[`UpdateFromAlphaFunc`](../classes/UpdateFromAlphaFunc.md)

A new UpdateFromAlphaFunc animation
