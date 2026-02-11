# Function: smoothedVectorizedHomotopy()

> **smoothedVectorizedHomotopy**(`mobject`, `homotopyFunc`, `options?`): [`SmoothedVectorizedHomotopy`](../classes/SmoothedVectorizedHomotopy.md)

Defined in: [animation/movement/Homotopy.ts:524](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/movement/Homotopy.ts#L524)

Create a SmoothedVectorizedHomotopy animation for a VMobject.

## Parameters

### mobject

[`VMobject`](../classes/VMobject.md)

The VMobject to transform

### homotopyFunc

[`HomotopyFunction`](../type-aliases/HomotopyFunction.md)

The homotopy function (x, y, z, t) => [x', y', z']

### options?

`Omit`\<[`SmoothedVectorizedHomotopyOptions`](../interfaces/SmoothedVectorizedHomotopyOptions.md), `"homotopyFunc"`\>

Animation options (duration, rateFunc)

## Returns

[`SmoothedVectorizedHomotopy`](../classes/SmoothedVectorizedHomotopy.md)
