# Function: hungarianFromSimilarity()

> **hungarianFromSimilarity**(`similarityMatrix`, `threshold`): [`HungarianResult`](../interfaces/HungarianResult.md)

Defined in: [utils/hungarian.ts:199](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/hungarian.ts#L199)

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
