# Type Alias: ODEFunction()

> **ODEFunction** = (`t`, `y`) => `number`[]

Defined in: [utils/ode.ts:16](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/utils/ode.ts#L16)

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
