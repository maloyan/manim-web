# Function: flowPointTrajectory()

> **flowPointTrajectory**(`vectorField`, `start`, `time`, `numSteps`): \[`number`, `number`, `number`\][]

Defined in: [utils/ode.ts:234](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L234)

Flow a 3D point along an autonomous vector field and return the full trajectory.

## Parameters

### vectorField

[`VectorFieldFunction3D`](../type-aliases/VectorFieldFunction3D.md)

The vector field function (point) => velocity

### start

\[`number`, `number`, `number`\]

Starting point [x, y, z]

### time

`number`

Duration to flow

### numSteps

`number` = `100`

Number of integration steps (default: 100)

## Returns

\[`number`, `number`, `number`\][]

Array of points along the trajectory

## Example

```typescript
// Get trajectory for a spiral flow
const trajectory = flowPointTrajectory(
  ([x, y, z]) => [-y - 0.1*x, x - 0.1*y, 0],
  [1, 0, 0],
  10,
  500
);
```
