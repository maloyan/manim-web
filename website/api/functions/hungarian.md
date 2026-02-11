# Function: hungarian()

> **hungarian**(`costMatrix`): [`HungarianResult`](../interfaces/HungarianResult.md)

Defined in: [utils/hungarian.ts:59](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/utils/hungarian.ts#L59)

Solve the assignment problem using the Hungarian (Kuhn-Munkres) algorithm.

Given an n x m cost matrix, finds the optimal one-to-one assignment of
rows to columns that minimizes total cost.

Implementation uses the successive shortest path formulation with
potential functions (Jonker-Volgenant style) for O(n^3) performance.

## Parameters

### costMatrix

`number`[][]

n x m matrix where costMatrix[i][j] is the cost
                    of assigning row i to column j

## Returns

[`HungarianResult`](../interfaces/HungarianResult.md)

HungarianResult with optimal assignments and metadata

## Example

```typescript
const cost = [
  [10, 5, 13],
  [3, 7, 15],
  [8, 12, 11],
];
const result = hungarian(cost);
// result.assignments might be [1, 0, 2] with totalCost = 5+3+11 = 19
```
