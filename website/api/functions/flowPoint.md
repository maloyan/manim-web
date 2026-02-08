# Function: flowPoint()

> **flowPoint**(`vectorField`, `start`, `time`, `numSteps`): \[`number`, `number`, `number`\]

Defined in: [utils/ode.ts:192](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/ode.ts#L192)

Flow a 3D point along an autonomous vector field for a given duration.

This is a convenience wrapper around solveIVP for the common case of
flowing a point through a time-independent vector field:
  dp/dt = vectorField(p)

## Parameters

### vectorField

[`VectorFieldFunction3D`](../type-aliases/VectorFieldFunction3D.md)

The vector field function (point) => velocity

### start

\[`number`, `number`, `number`\]

Starting point [x, y, z]

### time

`number`

Duration to flow (can be negative for backward flow)

### numSteps

`number` = `100`

Number of integration steps (default: 100)

## Returns

\[`number`, `number`, `number`\]

The final position [x, y, z]

## Example

```typescript
// Circular flow: dp/dt = [-y, x, 0]
const end = flowPoint(
  ([x, y, z]) => [-y, x, 0],
  [1, 0, 0],
  Math.PI / 2  // quarter turn
);
// end should be close to [0, 1, 0]
```
