# Function: homotopy()

> **homotopy**(`mobject`, `homotopyFunc`, `options?`): [`Homotopy`](../classes/Homotopy.md)

Defined in: [animation/movement/Homotopy.ts:496](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/movement/Homotopy.ts#L496)

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
