# Function: complexHomotopy()

> **complexHomotopy**(`mobject`, `complexFunc`, `options?`): [`ComplexHomotopy`](../classes/ComplexHomotopy.md)

Defined in: [animation/movement/Homotopy.ts:510](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/movement/Homotopy.ts#L510)

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
