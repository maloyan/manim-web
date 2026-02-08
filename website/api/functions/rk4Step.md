# Function: rk4Step()

> **rk4Step**(`f`, `t`, `y`, `h`): `number`[]

Defined in: [utils/ode.ts:63](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/ode.ts#L63)

Perform a single RK4 integration step.

Advances the state y at time t by one step of size h using the
classical 4th-order Runge-Kutta method.

## Parameters

### f

[`ODEFunction`](../type-aliases/ODEFunction.md)

The ODE function dy/dt = f(t, y)

### t

`number`

Current time

### y

`number`[]

Current state vector

### h

`number`

Step size

## Returns

`number`[]

The new state vector at time t + h
