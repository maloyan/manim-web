# Function: complexHomotopy()

> **complexHomotopy**(`mobject`, `complexFunc`, `options?`): [`ComplexHomotopy`](../classes/ComplexHomotopy.md)

Defined in: [animation/movement/Homotopy.ts:510](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/movement/Homotopy.ts#L510)

Create a ComplexHomotopy animation for a mobject.

## Parameters

### mobject

[`Mobject`](../classes/Mobject.md)

The mobject to transform

### complexFunc

[`ComplexHomotopyFunction`](../type-aliases/ComplexHomotopyFunction.md)

The complex homotopy function (z, t) => z'

### options?

`Omit`\<[`ComplexHomotopyOptions`](../interfaces/ComplexHomotopyOptions.md), `"complexFunc"`\>

Animation options (duration, rateFunc)

## Returns

[`ComplexHomotopy`](../classes/ComplexHomotopy.md)
