# Interface: HungarianResult

Defined in: [utils/hungarian.ts:17](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/hungarian.ts#L17)

Result of the Hungarian algorithm.

## Properties

### assignedCols

> **assignedCols**: `Set`\<`number`\>

Defined in: [utils/hungarian.ts:32](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/hungarian.ts#L32)

Set of column indices that are assigned (not dummy)

***

### assignedRows

> **assignedRows**: `Set`\<`number`\>

Defined in: [utils/hungarian.ts:29](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/hungarian.ts#L29)

Set of row indices that are assigned (not dummy)

***

### assignments

> **assignments**: `number`[]

Defined in: [utils/hungarian.ts:23](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/hungarian.ts#L23)

Optimal row-to-column assignments.
assignments[i] = j means row i is assigned to column j.
assignments[i] = -1 means row i is unassigned (when cols < rows after filtering dummies).

***

### totalCost

> **totalCost**: `number`

Defined in: [utils/hungarian.ts:26](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/hungarian.ts#L26)

Total cost of the optimal assignment
