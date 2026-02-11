# Interface: IVPResult

Defined in: [utils/ode.ts:42](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/ode.ts#L42)

Result of solving an IVP.

## Properties

### t

> **t**: `number`

Defined in: [utils/ode.ts:46](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/ode.ts#L46)

Final time

***

### trajectory

> **trajectory**: `object`[]

Defined in: [utils/ode.ts:48](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/ode.ts#L48)

Trajectory of [t, y] pairs (only populated if recordTrajectory is true)

#### t

> **t**: `number`

#### y

> **y**: `number`[]

***

### y

> **y**: `number`[]

Defined in: [utils/ode.ts:44](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/ode.ts#L44)

Final state vector
