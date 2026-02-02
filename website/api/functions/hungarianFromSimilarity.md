# Function: hungarianFromSimilarity()

> **hungarianFromSimilarity**(`similarityMatrix`, `threshold`): [`HungarianResult`](../interfaces/HungarianResult.md)

Defined in: [utils/hungarian.ts:199](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/utils/hungarian.ts#L199)

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
