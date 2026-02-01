# Type Alias: ODEFunction()

> **ODEFunction** = (`t`, `y`) => `number`[]

Defined in: [utils/ode.ts:16](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/utils/ode.ts#L16)

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
