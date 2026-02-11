# Function: shift()

> **shift**(`mobject`, `direction`, `options?`): [`Shift`](../classes/Shift.md)

Defined in: [animation/movement/Shift.ts:74](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/movement/Shift.ts#L74)

Create a Shift animation for a mobject.

## Parameters

### mobject

[`Mobject`](../classes/Mobject.md)

The mobject to shift

### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction/delta to move [dx, dy, dz]

### options?

`Omit`\<[`ShiftOptions`](../interfaces/ShiftOptions.md), `"direction"`\>

Animation options (duration, rateFunc)

## Returns

[`Shift`](../classes/Shift.md)
