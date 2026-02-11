# Function: scale()

> **scale**(`mobject`, `factor`, `options?`): [`Scale`](../classes/Scale.md)

Defined in: [animation/movement/Scale.ts:140](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/movement/Scale.ts#L140)

Create a Scale animation for a mobject.

## Parameters

### mobject

[`Mobject`](../classes/Mobject.md)

The mobject to scale

### factor

Scale factor (number for uniform, tuple for per-axis)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

### options?

`Omit`\<[`ScaleOptions`](../interfaces/ScaleOptions.md), `"scaleFactor"`\>

Animation options (duration, rateFunc, aboutPoint)

## Returns

[`Scale`](../classes/Scale.md)
