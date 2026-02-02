# Interface: SolveIVPOptions

Defined in: [utils/ode.ts:30](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L30)

Options for the IVP (Initial Value Problem) solver.

## Properties

### numSteps?

> `optional` **numSteps**: `number`

Defined in: [utils/ode.ts:34](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L34)

Number of integration steps (used when stepSize is not provided). Default: 100

***

### recordTrajectory?

> `optional` **recordTrajectory**: `boolean`

Defined in: [utils/ode.ts:36](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L36)

Whether to record the full trajectory or only return the final state. Default: false

***

### stepSize?

> `optional` **stepSize**: `number`

Defined in: [utils/ode.ts:32](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L32)

Fixed step size. If not provided, defaults to (tEnd - t0) / numSteps.
