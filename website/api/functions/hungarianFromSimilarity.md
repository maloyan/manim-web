# Function: hungarianFromSimilarity()

> **hungarianFromSimilarity**(`similarityMatrix`, `threshold`): [`HungarianResult`](../interfaces/HungarianResult.md)

Defined in: [utils/hungarian.ts:199](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/hungarian.ts#L199)

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
