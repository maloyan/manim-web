# Function: homotopy()

> **homotopy**(`mobject`, `homotopyFunc`, `options?`): [`Homotopy`](../classes/Homotopy.md)

Defined in: [animation/movement/Homotopy.ts:496](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Homotopy.ts#L496)

Create a Homotopy animation for a mobject.

## Parameters

### mobject

[`Mobject`](../classes/Mobject.md)

The mobject to transform

### homotopyFunc

[`HomotopyFunction`](../type-aliases/HomotopyFunction.md)

The homotopy function (x, y, z, t) => [x', y', z']

### options?

`Omit`\<[`HomotopyOptions`](../interfaces/HomotopyOptions.md), `"homotopyFunc"`\>

Animation options (duration, rateFunc)

## Returns

[`Homotopy`](../classes/Homotopy.md)
