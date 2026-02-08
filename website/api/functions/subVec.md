# Function: subVec()

> **subVec**(`a`, `b`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [utils/vectors.ts:62](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/vectors.ts#L62)

Subtract one vector from another (a - b).

## Parameters

### a

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

The vector to subtract from

### b

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

The vector to subtract

## Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Difference vector as [a_x - b_x, a_y - b_y, a_z - b_z]

## Example

```ts
subVec([4, 3, 0], [1, 0, 0])  // [3, 3, 0]
```
