# Function: updateFromFunc()

> **updateFromFunc**(`mobject`, `func`, `options?`): [`UpdateFromFunc`](../classes/UpdateFromFunc.md)

Defined in: [animation/UpdateFromFunc.ts:47](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/UpdateFromFunc.ts#L47)

Factory function to create an UpdateFromFunc animation.

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

[`UpdateFromFunc`](../classes/UpdateFromFunc.md)

A new UpdateFromFunc animation
