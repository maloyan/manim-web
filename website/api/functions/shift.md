# Function: shift()

> **shift**(`mobject`, `direction`, `options?`): [`Shift`](../classes/Shift.md)

Defined in: [animation/movement/Shift.ts:74](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/Shift.ts#L74)

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
