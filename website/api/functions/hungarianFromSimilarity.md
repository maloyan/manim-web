# Function: hungarianFromSimilarity()

> **hungarianFromSimilarity**(`similarityMatrix`, `threshold`): [`HungarianResult`](../interfaces/HungarianResult.md)

Defined in: [utils/hungarian.ts:199](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/hungarian.ts#L199)

Convenience function to find the optimal matching given a similarity matrix.
Converts similarities (higher = better) to costs (lower = better) and
runs the Hungarian algorithm.

## Parameters

### similarityMatrix

`number`[][]

n x m matrix where higher values mean better matches

### threshold

`number` = `0`

Minimum similarity to consider a valid match (default: 0).
                   Pairs below this threshold are treated as unmatched.

## Returns

[`HungarianResult`](../interfaces/HungarianResult.md)

HungarianResult with optimal assignments
