/**
 * 3D vector and basic geometry helpers.
 *
 * This module is the single source of truth for low-level 3-vector math
 * (dot, cross, length, normalize, perpendicular, orthonormal frame). Every
 * call site in the codebase should use these helpers instead of inlining
 * component arithmetic — see AGENTS.md > "Geometry conventions".
 *
 * Also re-exports a few py2ts-era helpers (`addVec`, `subVec`, `scaleVec`,
 * `linspace`) which the Python → TypeScript converter emits.
 */

import type { Vector3Tuple } from '../core/MobjectTypes';

/**
 * Scale a direction vector by a scalar.
 *
 * @param scalar - The scalar multiplier
 * @param vec - The direction vector [x, y, z]
 * @returns Scaled vector as [x * scalar, y * scalar, z * scalar]
 *
 * @example
 * ```ts
 * scaleVec(2, LEFT)  // [-2, 0, 0]
 * scaleVec(1.5, UP)  // [0, 1.5, 0]
 * ```
 */
export function scaleVec(scalar: number, vec: Vector3Tuple): Vector3Tuple {
  return [vec[0] * scalar, vec[1] * scalar, vec[2] * scalar];
}

/**
 * Add two or more vectors component-wise.
 *
 * @param vecs - Two or more vectors to add
 * @returns Sum vector as [sum_x, sum_y, sum_z]
 *
 * @example
 * ```ts
 * addVec(LEFT, UP)       // [-1, 1, 0]
 * addVec(scaleVec(2, RIGHT), scaleVec(3, DOWN))  // [2, -3, 0]
 * ```
 */
export function addVec(...vecs: Vector3Tuple[]): Vector3Tuple {
  let x = 0,
    y = 0,
    z = 0;
  for (const v of vecs) {
    x += v[0];
    y += v[1];
    z += v[2];
  }
  return [x, y, z];
}

/**
 * Subtract one vector from another (a - b).
 *
 * @param a - The vector to subtract from
 * @param b - The vector to subtract
 * @returns Difference vector as [a_x - b_x, a_y - b_y, a_z - b_z]
 *
 * @example
 * ```ts
 * subVec([4, 3, 0], [1, 0, 0])  // [3, 3, 0]
 * ```
 */
export function subVec(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/**
 * 3D dot product (a · b). Accepts plain number arrays so callers that use
 * `number[]` (e.g. internal helpers in `math.ts`) can share the same impl.
 *
 * Missing components default to `0` so 2D points (`[x, y]`) are handled.
 */
export function dotVec(a: ArrayLike<number>, b: ArrayLike<number>): number {
  return (a[0] ?? 0) * (b[0] ?? 0) + (a[1] ?? 0) * (b[1] ?? 0) + (a[2] ?? 0) * (b[2] ?? 0);
}

/**
 * 3D cross product (a × b). Right-handed:
 *   x = a.y*b.z − a.z*b.y, y = a.z*b.x − a.x*b.z, z = a.x*b.y − a.y*b.x.
 */
export function crossVec(a: ArrayLike<number>, b: ArrayLike<number>): Vector3Tuple {
  const ax = a[0] ?? 0;
  const ay = a[1] ?? 0;
  const az = a[2] ?? 0;
  const bx = b[0] ?? 0;
  const by = b[1] ?? 0;
  const bz = b[2] ?? 0;
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

/**
 * Euclidean length |v|. Missing components default to `0`.
 */
export function lengthVec(v: ArrayLike<number>): number {
  const x = v[0] ?? 0;
  const y = v[1] ?? 0;
  const z = v[2] ?? 0;
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Return `v` normalised to unit length. If `|v|` is below `eps` the supplied
 * `fallback` is returned (default `[0, 0, 0]`); the caller decides whether to
 * treat that as an error.
 */
export function normalizeVec(
  v: ArrayLike<number>,
  fallback: Vector3Tuple = [0, 0, 0],
  eps = 1e-15,
): Vector3Tuple {
  const len = lengthVec(v);
  if (len < eps) return fallback;
  return [(v[0] ?? 0) / len, (v[1] ?? 0) / len, (v[2] ?? 0) / len];
}

/**
 * Return a unit vector perpendicular to `n`.
 *
 * Picked by Gram–Schmidt against whichever world basis vector has the
 * smallest |dot(n, e_i)|, then normalized. This is coordinate-free in
 * spirit — it never uses a hard "is the input close to Z?" branch — but it
 * does pick from the world basis, so the result can change discontinuously
 * very near a tie. Treat as "give me *some* perpendicular unit vector"
 * rather than a temporally-stable frame.
 */
export function unitPerpendicularTo(n: Vector3Tuple, eps = 1e-12): Vector3Tuple {
  // Normalize first so the projection-removal step below
  // (`basis - (basis·u) u`) is correct regardless of the input's magnitude.
  const u = normalizeVec(n, [1, 0, 0], eps);

  const ax = Math.abs(u[0]);
  const ay = Math.abs(u[1]);
  const az = Math.abs(u[2]);

  let basis: Vector3Tuple;
  if (ax <= ay && ax <= az) basis = [1, 0, 0];
  else if (ay <= az) basis = [0, 1, 0];
  else basis = [0, 0, 1];

  const d = dotVec(basis, u);
  const p: Vector3Tuple = [basis[0] - d * u[0], basis[1] - d * u[1], basis[2] - d * u[2]];
  return normalizeVec(p, [0, 0, 1], eps);
}

/**
 * Build a right-handed orthonormal frame `{u, v, n}` around the given
 * normal. `n` is normalised; `u = unitPerpendicularTo(n)`; `v = n × u`.
 *
 * Use this instead of writing axis-equal-to-Z special cases in caller code.
 */
export function orthonormalFrame(normal: Vector3Tuple): {
  u: Vector3Tuple;
  v: Vector3Tuple;
  n: Vector3Tuple;
} {
  const n = normalizeVec(normal, [0, 0, 1]);
  const u = unitPerpendicularTo(n);
  const v = crossVec(n, u);
  return { u, v, n };
}

/**
 * 2D orientation predicate (signed twice-area of triangle o-a-b).
 * Positive: counter-clockwise. Negative: clockwise. Zero: collinear.
 *
 * Mathematically this is the z-component of the cross product of
 * (a-o) and (b-o) — kept as its own helper because it is an orientation
 * test, not a general vector operation.
 */
export function orientation2D(
  o: ArrayLike<number>,
  a: ArrayLike<number>,
  b: ArrayLike<number>,
): number {
  return (
    ((a[0] ?? 0) - (o[0] ?? 0)) * ((b[1] ?? 0) - (o[1] ?? 0)) -
    ((a[1] ?? 0) - (o[1] ?? 0)) * ((b[0] ?? 0) - (o[0] ?? 0))
  );
}

/**
 * Create an array of evenly spaced values (NumPy linspace equivalent).
 *
 * @param start - Start value
 * @param stop - End value (inclusive)
 * @param num - Number of points to generate
 * @returns Array of `num` evenly spaced values from `start` to `stop`
 *
 * @example
 * ```ts
 * linspace(0, 10, 5)  // [0, 2.5, 5, 7.5, 10]
 * linspace(0, 1, 3)   // [0, 0.5, 1]
 * ```
 */
export function linspace(start: number, stop: number, num: number): number[] {
  if (num <= 1) return num === 1 ? [start] : [];
  return Array.from({ length: num }, (_, i) => start + ((stop - start) * i) / (num - 1));
}
