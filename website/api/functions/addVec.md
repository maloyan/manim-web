# Function: addVec()

> **addVec**(...`vecs`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [utils/vectors.ts:40](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/vectors.ts#L40)

Add two or more vectors component-wise.

## Parameters

### vecs

...[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)[]

Two or more vectors to add

## Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Sum vector as [sum_x, sum_y, sum_z]

## Example

```ts
addVec(LEFT, UP)       // [-1, 1, 0]
addVec(scaleVec(2, RIGHT), scaleVec(3, DOWN))  // [2, -3, 0]
```
