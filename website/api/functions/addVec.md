# Function: addVec()

> **addVec**(...`vecs`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [utils/vectors.ts:40](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/utils/vectors.ts#L40)

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
