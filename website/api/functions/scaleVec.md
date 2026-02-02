# Function: scaleVec()

> **scaleVec**(`scalar`, `vec`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [utils/vectors.ts:24](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/vectors.ts#L24)

Scale a direction vector by a scalar.

## Parameters

### scalar

`number`

The scalar multiplier

### vec

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

The direction vector [x, y, z]

## Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Scaled vector as [x * scalar, y * scalar, z * scalar]

## Example

```ts
scaleVec(2, LEFT)  // [-2, 0, 0]
scaleVec(1.5, UP)  // [0, 1.5, 0]
```
