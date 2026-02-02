# Type Alias: ODEFunction()

> **ODEFunction** = (`t`, `y`) => `number`[]

Defined in: [utils/ode.ts:16](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/utils/ode.ts#L16)

A function defining the right-hand side of an ODE system: dy/dt = f(t, y).

## Parameters

### t

`number`

Current time

### y

`number`[]

Current state vector

## Returns

`number`[]

The derivative dy/dt at (t, y)
