# Function: scaleVec()

> **scaleVec**(`scalar`, `vec`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [utils/vectors.ts:24](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/vectors.ts#L24)

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
