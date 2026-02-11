# Function: solveIVP()

> **solveIVP**(`f`, `t0`, `y0`, `tEnd`, `options`): [`IVPResult`](../interfaces/IVPResult.md)

Defined in: [utils/ode.ts:125](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/utils/ode.ts#L125)

Solve an initial value problem (IVP) using RK4 integration.

Integrates dy/dt = f(t, y) from t0 to tEnd starting at y0.

## Parameters

### f

[`ODEFunction`](../type-aliases/ODEFunction.md)

The ODE function dy/dt = f(t, y)

### t0

`number`

Initial time

### y0

`number`[]

Initial state vector

### tEnd

`number`

Final time

### options

[`SolveIVPOptions`](../interfaces/SolveIVPOptions.md) = `{}`

Solver options (stepSize, numSteps, recordTrajectory)

## Returns

[`IVPResult`](../interfaces/IVPResult.md)

The solution at tEnd (and optionally the full trajectory)

## Example

```typescript
// Solve a simple harmonic oscillator: x'' = -x
// Written as a system: y = [x, v], dy/dt = [v, -x]
const result = solveIVP(
  (t, y) => [y[1], -y[0]],
  0,           // t0
  [1, 0],      // y0 = [x0, v0]
  2 * Math.PI,  // tEnd (one full period)
  { numSteps: 1000 }
);
// result.y should be close to [1, 0]
```
