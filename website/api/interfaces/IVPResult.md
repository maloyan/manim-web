# Interface: IVPResult

Defined in: [utils/ode.ts:42](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L42)

Result of solving an IVP.

## Properties

### t

> **t**: `number`

Defined in: [utils/ode.ts:46](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L46)

Final time

***

### trajectory

> **trajectory**: `object`[]

Defined in: [utils/ode.ts:48](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L48)

Trajectory of [t, y] pairs (only populated if recordTrajectory is true)

#### t

> **t**: `number`

#### y

> **y**: `number`[]

***

### y

> **y**: `number`[]

Defined in: [utils/ode.ts:44](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L44)

Final state vector
