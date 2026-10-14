# Cradle, disk, spring and pendulum: equations of motion

Code: `src/mobjects/physics/cradleSystem.ts`. Tests: `src/mobjects/physics/cradleSystem.test.ts`.

## 1. What the schematic shows

A curved rigid rocker M is a thick circular arc. It tilts by the angle theta from the vertical.
A rigid disk sits inside the arc and rolls on the inner surface without slipping.
Two identical linear springs hold the rocker. Their ground anchors are a distance d_s on each side.
A pendulum linkage hangs below the ground line. It has three rods and two point masses.
Gravity points down.

The picture does not fix every degree of freedom. Section 2 lists each assumption.

## 2. Assumptions

1. **Pivot.** The cradle turns about a fixed pivot at the center of its arc. It does not translate.
   This is the simplest choice that keeps theta as the only cradle coordinate. The springs then work as a torsion spring.
   The cradle is "suspended" by the springs only in this sense.
2. **Planar motion.** All bodies move in one vertical plane.
3. **Cradle mass.** The cradle is a uniform annular sector with total mass M, inner radius R_i, outer radius R_o and half opening beta_s.
4. **Rolling.** The disk is a solid uniform disk of mass m_r and radius r. It rolls without slipping on the inner arc.
   The contact is a two sided (bilateral) constraint. The model does not check that the normal force stays positive.
   The model does not check that the disk stays between the arm tips. Choose initial values that keep both conditions true.
5. **Spring ends.** Each spring joins a fixed ground anchor Q to the outer arm tip P of the cradle.
   The right anchor is at (+d_s, -h) and the left anchor is at (-d_s, -h). The point (0, 0) is the pivot.
   The distance h is `groundDrop`. The springs are linear in length. Their rest length is the length at theta = 0, unless set.
6. **Pendulum attachment.** The pendulum hangs from the bottom point of the outer arc, A = R_o (sin theta, -cos theta).
   This point moves with the cradle, so the two subsystems are coupled.
7. **Pendulum rods.** There are three uniform rods with lengths l_1, l_2, l_3 and mass per length mu.
   The rod angles beta_1, beta_2, beta_3 are absolute angles from straight down.
   (A relative joint angle would give the same physics. Absolute angles keep M(q) simple.)
   Mass per length must be above 0. A massless rod chain makes M(q) singular at the hanging pose.
8. **Point masses.** Two point masses m_p sit on a massless axle at the tip of rod 3.
   The axle is perpendicular to rod 3. The masses are at distance w_p / 2 on each side of the tip, so they are w_p apart.
9. **Ground.** The ground line is only a drawing. The pendulum passes through it without contact.
10. **Damping.** Default damping is 0. With damping c the model adds the force -c q' on each coordinate.

## 3. Generalized coordinates

Angles are counter clockwise and measured from straight down. Let n(a) = (sin a, -cos a). Then n(a) rotates counter clockwise with a.

| Symbol | Meaning |
|---|---|
| theta | Tilt of the cradle |
| alpha | Contact angle of the disk, measured in the cradle frame. The absolute angle of the disk center is theta + alpha |
| beta_1, beta_2, beta_3 | Absolute angles of rods 1, 2, 3 |

So q = (theta, alpha, beta_1, beta_2, beta_3). There are 5 coordinates.
A system without the disk drops alpha. A system without the pendulum drops beta_1 to beta_3.

### Rolling constraint

The disk center is c = (R_i - r) n(theta + alpha). The contact point on the cradle moves with speed R_i theta' along the tangent.
The contact point on the disk moves with speed (R_i - r)(theta' + alpha') + r omega along the same tangent, where omega is the disk spin rate.
No slip means these two speeds are equal:

    omega = theta' - ((R_i - r) / r) alpha'

This is the time derivative of a function of q, so the constraint is holonomic. The spin angle is

    phi = (theta - theta_0) - ((R_i - r) / r) (alpha - alpha_0)

and phi = 0 at t = 0. The angle phi is not a coordinate. It adds no degree of freedom and needs no Lagrange multiplier.
The test `keeps the no slip constraint at every step` checks the contact point speeds by central differences of the poses.

## 4. Bodies and kinetic energy

Each body b has a mass m_b, a moment of inertia I_b about its center of mass, a center of mass r_b(q) and a spin rate s_b . q'.

| Body | Mass | I about COM | Center of mass | Spin rate |
|---|---|---|---|---|
| Cradle | M | M (R_o^2 + R_i^2) / 2 - M rho^2 | rho n(theta) | theta' |
| Disk | m_r | m_r r^2 / 2 | (R_i - r) n(theta + alpha) | theta' - ((R_i - r) / r) alpha' |
| Rod i | mu l_i | mu l_i^3 / 12 | A + sum over j < i of l_j n(beta_j) + (l_i / 2) n(beta_i) | beta_i' |
| Point mass +/- | m_p | 0 | A + sum of l_j n(beta_j) +/- (w_p / 2) n(beta_3 + pi/2) | none |

The distance from the pivot to the cradle center of mass is

    rho = (2 sin(beta_s) / (3 beta_s)) (R_o^3 - R_i^3) / (R_o^2 - R_i^2)

The inertia about the pivot of an annular sector does not depend on its opening: I_pivot = M (R_o^2 + R_i^2) / 2.
The code uses I_pivot - M rho^2 about the center of mass. The parallel axis theorem then gives I_pivot back.

Let J_b = d r_b / d q (a 2 by n matrix). Then the kinetic energy is

    T = sum over b of [ (1/2) m_b |J_b q'|^2 + (1/2) I_b (s_b . q')^2 ] = (1/2) q'^T M(q) q'

    M(q) = sum over b of [ m_b J_b^T J_b + I_b s_b s_b^T ]

## 5. Potential energy

Gravity: V_g = g sum over b of m_b y_b, with y_b the second component of r_b.

Springs. For the side e = +1 (right) and e = -1 (left):

    P_e = R_o n(theta + e beta_s)          (arm tip)
    Q_e = (e d_s, -h)                      (ground anchor)
    s_e = |P_e - Q_e|                      (spring length)
    V_s = sum over e of (1/2) k (s_e - L_0)^2

The total is V = V_g + V_s. The Lagrangian is L = T - V.

## 6. Euler Lagrange equations

The equation for each coordinate q_i is

    d/dt (dT/dq'_i) - dT/dq_i + dV/dq_i = Q_i

where Q_i is the damping force -c q'_i.

Each body has T_b = (1/2) m_b q'^T J_b^T J_b q'. Take the derivative:

    d/dt (dT_b/dq') = m_b J_b^T J_b q'' + m_b (Jdot_b^T J_b + J_b^T Jdot_b) q'

The term dT_b/dq_i equals m_b (J_b q')^T (dJ_b / dq_i) q'. The mixed second derivatives of r_b are symmetric:
d J_jk / d q_i = d J_ji / d q_k. So the term (Jdot_b^T J_b q')_i equals dT_b/dq_i / m_b, and these two terms cancel.
What remains is m_b J_b^T (Jdot_b q'). The Euler Lagrange equation for a rigid body with a spin rate linear in q' is therefore

    M(q) q'' = -dV/dq - c q' - sum over b of m_b J_b^T a_b

    a_b = Jdot_b q' = sum over i, j of (d^2 r_b / dq_i dq_j) q'_i q'_j

The bias a_b is the acceleration of the body center when q'' = 0. This is exact. The spin rates are linear in q', so they add no bias.

### Exact derivatives of the positions

Every position is a sum of terms radius * n(a_t) with a_t = offset + sum of coef_i q_i. Let w_t = sum of coef_i q'_i. Then

    d r_t / d q_i = radius coef_i (cos a_t, sin a_t)
    bias term     = radius w_t^2 (-sin a_t, cos a_t)

The code uses these two formulas. It does not use numerical differentiation.

### Spring and gravity forces

    -dV_g/dq_i = -g sum over b of m_b J_b[y, i]

    -dV_s/dtheta = -k sum over e of (s_e - L_0) (ds_e / dtheta)

    ds_e / dtheta = (P_e - Q_e) . R_o (cos(theta + e beta_s), sin(theta + e beta_s)) / s_e

The springs depend on theta only.

## 7. Numerical method

State x = (q, q'). At each step the code builds M(q) and the right side, solves M q'' = rhs by Gauss elimination
with partial pivoting (n is 5 at most), and advances x with the classical RK4 scheme.
RK4 is not symplectic. The energy drift is the integrator error. It falls as dt^4 (see section 8).

## 8. Correctness gates (all in the test file)

Parameters: R_i = 1, R_o = 1.3, beta_s = 1 rad, M = 2, m_r = 0.5, r = 0.25, k = 40, d_s = 1.8, h = 2.2, g = 9.81,
l = (0.5, 0.4, 0.3), mu = 0.2, m_p = 0.3, w_p = 0.5. Start state: theta = 0.3, alpha = 0.2, beta = (0.2, -0.3, 0.4),
q' = (0.5, -0.4, 0.3, -0.2, 0.1).

| Gate | Result measured on 2026-10-14 |
|---|---|
| Euler Lagrange residual from T and V by finite differences (independent of the EOM code path) | below 5e-5 on all 5 coordinates (test tolerance) |
| Energy, no damping, dt = 0.0005, 40000 steps (20 s) | worst drift 1.68e-6 J. Relative to the total energy: 4.5e-8. Relative to the excitation energy of 4.51 J: 3.7e-7 |
| Energy, dt = 0.002 and 0.001 and 0.0005, 20 s | worst drift 1.2e-3, 2.2e-5, 1.7e-6. It falls with the step size, so it is integrator error |
| Equilibrium: start at q = 0 with zero speed | the generalized forces are below 1e-12 and the state stays below 1e-10 after 5000 steps |
| Reduction: rocker and springs only | numeric period 1.362878 s. Analytic 1.362898 s. Error 1.4e-5 |
| Reduction: disk in a bowl, springs very stiff (k = 1e5) | numeric period 2.127814 s. Analytic 2.127755 s. Error 2.8e-5 |
| No slip: largest contact point speed difference over 2000 steps | 3.0e-10 m/s |

### Analytic formulas used in the reductions

Rocker and springs only (no disk, no pendulum). The small oscillation period is T = 2 pi sqrt(I_pivot / k_eff) with

    k_eff = k_spring + M g rho
    k_spring = 2 k R_o^2 (d_s cos(beta_s) - h sin(beta_s))^2 / s_0^2
    s_0 = |P_e - Q_e| at theta = 0

Disk in a fixed bowl. A solid disk rolling without slipping in a fixed circular bowl has the small oscillation period
T = 2 pi sqrt(1.5 (R_i - r) / g). The very stiff springs hold the cradle still.

## 9. Open points

- The model does not model loss of contact between the disk and the arc, or the disk leaving the arc end.
- The pivot assumption removes translation of the cradle. A free cradle would add two coordinates (x, y).
  The code structure (polar terms and a Jacobian per body) would extend to that case.
- The rod angles are absolute. The drawing labels beta_1, beta_2, beta_3 as joint angles. The numbers differ by a fixed change of variables.
