/**
 * ODE (Ordinary Differential Equation) solvers for numerical integration.
 *
 * Provides Runge-Kutta 4th order (RK4) integration for systems of the form:
 *   dy/dt = f(t, y)
 *
 * Supports scalar and vector-valued state variables (2D and 3D).
 */

/**
 * A function defining the right-hand side of an ODE system: dy/dt = f(t, y).
 * @param t - Current time
 * @param y - Current state vector
 * @returns The derivative dy/dt at (t, y)
 */
export type ODEFunction = (t: number, y: number[]) => number[];

/**
 * An autonomous vector field function: dy/dt = f(y).
 * This is the common case for phase flows where the field does not
 * depend on time explicitly.
 * @param point - Current position as [x, y, z]
 * @returns Velocity vector [vx, vy, vz]
 */
export type VectorFieldFunction3D = (point: [number, number, number]) => [number, number, number];

/**
 * Options for the IVP (Initial Value Problem) solver.
 */
export interface SolveIVPOptions {
  /** Fixed step size. If not provided, defaults to (tEnd - t0) / numSteps. */
  stepSize?: number;
  /** Number of integration steps (used when stepSize is not provided). Default: 100 */
  numSteps?: number;
  /** Whether to record the full trajectory or only return the final state. Default: false */
  recordTrajectory?: boolean;
}

/**
 * Result of solving an IVP.
 */
export interface IVPResult {
  /** Final state vector */
  y: number[];
  /** Final time */
  t: number;
  /** Trajectory of [t, y] pairs (only populated if recordTrajectory is true) */
  trajectory: { t: number; y: number[] }[];
}

/**
 * Perform a single RK4 integration step.
 *
 * Advances the state y at time t by one step of size h using the
 * classical 4th-order Runge-Kutta method.
 *
 * @param f - The ODE function dy/dt = f(t, y)
 * @param t - Current time
 * @param y - Current state vector
 * @param h - Step size
 * @returns The new state vector at time t + h
 */
export function rk4Step(f: ODEFunction, t: number, y: number[], h: number): number[] {
  const n = y.length;

  // k1 = f(t, y)
  const k1 = f(t, y);

  // k2 = f(t + h/2, y + h/2 * k1)
  const yTemp2 = new Array(n);
  for (let i = 0; i < n; i++) {
    yTemp2[i] = y[i] + 0.5 * h * k1[i];
  }
  const k2 = f(t + 0.5 * h, yTemp2);

  // k3 = f(t + h/2, y + h/2 * k2)
  const yTemp3 = new Array(n);
  for (let i = 0; i < n; i++) {
    yTemp3[i] = y[i] + 0.5 * h * k2[i];
  }
  const k3 = f(t + 0.5 * h, yTemp3);

  // k4 = f(t + h, y + h * k3)
  const yTemp4 = new Array(n);
  for (let i = 0; i < n; i++) {
    yTemp4[i] = y[i] + h * k3[i];
  }
  const k4 = f(t + h, yTemp4);

  // y_next = y + (h/6) * (k1 + 2*k2 + 2*k3 + k4)
  const yNext = new Array(n);
  for (let i = 0; i < n; i++) {
    yNext[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }

  return yNext;
}

/**
 * Solve an initial value problem (IVP) using RK4 integration.
 *
 * Integrates dy/dt = f(t, y) from t0 to tEnd starting at y0.
 *
 * @param f - The ODE function dy/dt = f(t, y)
 * @param t0 - Initial time
 * @param y0 - Initial state vector
 * @param tEnd - Final time
 * @param options - Solver options (stepSize, numSteps, recordTrajectory)
 * @returns The solution at tEnd (and optionally the full trajectory)
 *
 * @example
 * ```typescript
 * // Solve a simple harmonic oscillator: x'' = -x
 * // Written as a system: y = [x, v], dy/dt = [v, -x]
 * const result = solveIVP(
 *   (t, y) => [y[1], -y[0]],
 *   0,           // t0
 *   [1, 0],      // y0 = [x0, v0]
 *   2 * Math.PI,  // tEnd (one full period)
 *   { numSteps: 1000 }
 * );
 * // result.y should be close to [1, 0]
 * ```
 */
export function solveIVP(
  f: ODEFunction,
  t0: number,
  y0: number[],
  tEnd: number,
  options: SolveIVPOptions = {}
): IVPResult {
  const { recordTrajectory = false } = options;

  let numSteps: number;
  let h: number;

  if (options.stepSize !== undefined) {
    h = options.stepSize;
    numSteps = Math.max(1, Math.ceil(Math.abs(tEnd - t0) / Math.abs(h)));
    // Adjust h to land exactly on tEnd
    h = (tEnd - t0) / numSteps;
  } else {
    numSteps = options.numSteps ?? 100;
    h = (tEnd - t0) / numSteps;
  }

  const trajectory: { t: number; y: number[] }[] = [];

  let t = t0;
  let y = [...y0];

  if (recordTrajectory) {
    trajectory.push({ t, y: [...y] });
  }

  for (let step = 0; step < numSteps; step++) {
    y = rk4Step(f, t, y, h);
    t = t0 + (step + 1) * h; // Use multiplication to avoid floating-point drift

    if (recordTrajectory) {
      trajectory.push({ t, y: [...y] });
    }
  }

  return { y, t, trajectory };
}

/**
 * Flow a 3D point along an autonomous vector field for a given duration.
 *
 * This is a convenience wrapper around solveIVP for the common case of
 * flowing a point through a time-independent vector field:
 *   dp/dt = vectorField(p)
 *
 * @param vectorField - The vector field function (point) => velocity
 * @param start - Starting point [x, y, z]
 * @param time - Duration to flow (can be negative for backward flow)
 * @param numSteps - Number of integration steps (default: 100)
 * @returns The final position [x, y, z]
 *
 * @example
 * ```typescript
 * // Circular flow: dp/dt = [-y, x, 0]
 * const end = flowPoint(
 *   ([x, y, z]) => [-y, x, 0],
 *   [1, 0, 0],
 *   Math.PI / 2  // quarter turn
 * );
 * // end should be close to [0, 1, 0]
 * ```
 */
export function flowPoint(
  vectorField: VectorFieldFunction3D,
  start: [number, number, number],
  time: number,
  numSteps: number = 100
): [number, number, number] {
  if (time === 0) {
    return [...start] as [number, number, number];
  }

  const steps = Math.max(1, Math.ceil(Math.abs(time) * numSteps));

  // Wrap the autonomous vector field as a time-dependent ODE
  const f: ODEFunction = (_t: number, y: number[]) => {
    const v = vectorField([y[0], y[1], y[2]]);
    return [v[0], v[1], v[2]];
  };

  const result = solveIVP(f, 0, start, time, { numSteps: steps });
  return [result.y[0], result.y[1], result.y[2]];
}

/**
 * Flow a 3D point along an autonomous vector field and return the full trajectory.
 *
 * @param vectorField - The vector field function (point) => velocity
 * @param start - Starting point [x, y, z]
 * @param time - Duration to flow
 * @param numSteps - Number of integration steps (default: 100)
 * @returns Array of points along the trajectory
 *
 * @example
 * ```typescript
 * // Get trajectory for a spiral flow
 * const trajectory = flowPointTrajectory(
 *   ([x, y, z]) => [-y - 0.1*x, x - 0.1*y, 0],
 *   [1, 0, 0],
 *   10,
 *   500
 * );
 * ```
 */
export function flowPointTrajectory(
  vectorField: VectorFieldFunction3D,
  start: [number, number, number],
  time: number,
  numSteps: number = 100
): [number, number, number][] {
  if (time === 0) {
    return [[...start] as [number, number, number]];
  }

  const steps = Math.max(1, Math.ceil(Math.abs(time) * numSteps));

  const f: ODEFunction = (_t: number, y: number[]) => {
    const v = vectorField([y[0], y[1], y[2]]);
    return [v[0], v[1], v[2]];
  };

  const result = solveIVP(f, 0, start, time, {
    numSteps: steps,
    recordTrajectory: true,
  });

  return result.trajectory.map(({ y }) => [y[0], y[1], y[2]] as [number, number, number]);
}
