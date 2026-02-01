# Function: homotopy()

> **homotopy**(`mobject`, `homotopyFunc`, `options?`): [`Homotopy`](../classes/Homotopy.md)

Defined in: [animation/movement/Homotopy.ts:496](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/movement/Homotopy.ts#L496)

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
