# Type Alias: VectorFieldFunction3D()

> **VectorFieldFunction3D** = (`point`) => \[`number`, `number`, `number`\]

Defined in: [utils/ode.ts:25](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/ode.ts#L25)

An autonomous vector field function: dy/dt = f(y).
This is the common case for phase flows where the field does not
depend on time explicitly.

## Parameters

### point

\[`number`, `number`, `number`\]

Current position as [x, y, z]

## Returns

\[`number`, `number`, `number`\]

Velocity vector [vx, vy, vz]
