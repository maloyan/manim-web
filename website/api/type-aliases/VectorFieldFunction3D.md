# Type Alias: VectorFieldFunction3D()

> **VectorFieldFunction3D** = (`point`) => \[`number`, `number`, `number`\]

Defined in: [utils/ode.ts:25](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/utils/ode.ts#L25)

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
