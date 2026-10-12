/**
 * Minimal 2D vector helpers for the self-contained physics solver.
 *
 * The physics world runs in the XY plane. A {@link Vec2} is a plain `[x, y]`
 * tuple, so it stays cheap to copy and compare in tests. Every helper is pure
 * and returns a new value, which keeps the solver deterministic and easy to
 * reason about.
 */

/** A 2D vector or point as an `[x, y]` tuple. */
export type Vec2 = [number, number];

/** Return a fresh copy of `v`. */
export function cloneVec2(v: Vec2): Vec2 {
  return [v[0], v[1]];
}

/** Return the dot product `a . b`. */
export function dotVec2(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

/** Return the distance between points `a` and `b`. */
export function distanceVec2(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
