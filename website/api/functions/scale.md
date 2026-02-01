# Function: scale()

> **scale**(`mobject`, `factor`, `options?`): [`Scale`](../classes/Scale.md)

Defined in: [animation/movement/Scale.ts:136](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/movement/Scale.ts#L136)

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
