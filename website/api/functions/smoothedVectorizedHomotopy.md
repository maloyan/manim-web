# Function: smoothedVectorizedHomotopy()

> **smoothedVectorizedHomotopy**(`mobject`, `homotopyFunc`, `options?`): [`SmoothedVectorizedHomotopy`](../classes/SmoothedVectorizedHomotopy.md)

Defined in: [animation/movement/Homotopy.ts:524](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/movement/Homotopy.ts#L524)

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
