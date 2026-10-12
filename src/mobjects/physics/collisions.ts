/**
 * Collision detection and impulse resolution for the physics world.
 *
 * The solver handles two cases, which cover a ball in a box and balls that
 * knock into each other:
 *
 * - A body against the world bounds (floor, ceiling and side walls).
 * - A circle against another circle.
 *
 * Both cases separate the overlap by position and then apply an impulse along
 * the contact normal, scaled by the restitution, so momentum is conserved and
 * a bounce loses energy by the restitution factor.
 *
 * Polygon-polygon collision is out of scope; a polygon body still collides
 * with the bounds through its axis-aligned box.
 */

import { Body } from './bodies';

/**
 * The rectangular bounds of the world. Any side left `undefined` is open, so
 * a body passes through it freely.
 */
export interface Bounds {
  /** Left wall x, or undefined for an open left side. */
  minX?: number;
  /** Floor y, or undefined for an open bottom. */
  minY?: number;
  /** Right wall x, or undefined for an open right side. */
  maxX?: number;
  /** Ceiling y, or undefined for an open top. */
  maxY?: number;
}

/**
 * Push `body` back inside `bounds` and reflect the velocity that drove it out,
 * scaled by the body restitution. A static body is never moved.
 */
export function resolveBounds(body: Body, bounds: Bounds): void {
  if (body.isStatic) return;
  const e = body.restitution;
  const [minX, minY, maxX, maxY] = body.aabb();

  if (bounds.minY !== undefined && minY < bounds.minY) {
    body.position[1] += bounds.minY - minY;
    if (body.velocity[1] < 0) body.velocity[1] = -body.velocity[1] * e;
  }
  if (bounds.maxY !== undefined && maxY > bounds.maxY) {
    body.position[1] -= maxY - bounds.maxY;
    if (body.velocity[1] > 0) body.velocity[1] = -body.velocity[1] * e;
  }
  if (bounds.minX !== undefined && minX < bounds.minX) {
    body.position[0] += bounds.minX - minX;
    if (body.velocity[0] < 0) body.velocity[0] = -body.velocity[0] * e;
  }
  if (bounds.maxX !== undefined && maxX > bounds.maxX) {
    body.position[0] -= maxX - bounds.maxX;
    if (body.velocity[0] > 0) body.velocity[0] = -body.velocity[0] * e;
  }
}

/**
 * Resolve a collision between two circle bodies. Does nothing when either body
 * is not a circle, when they do not overlap, or when both are static.
 *
 * The step separates the overlap by inverse mass, then applies an impulse
 * along the contact normal with restitution `min(a, b)`.
 */
export function resolveCircleCircle(a: Body, b: Body): void {
  if (a.shape.kind !== 'circle' || b.shape.kind !== 'circle') return;

  const totalInv = a.invMass + b.invMass;
  if (totalInv === 0) return;

  const dx = b.position[0] - a.position[0];
  const dy = b.position[1] - a.position[1];
  const dist = Math.hypot(dx, dy);
  const rSum = a.shape.radius + b.shape.radius;
  if (dist === 0 || dist >= rSum) return;

  const nx = dx / dist;
  const ny = dy / dist;

  // Separate the overlap by inverse mass so a heavy body barely moves.
  const penetration = rSum - dist;
  a.position[0] -= nx * penetration * (a.invMass / totalInv);
  a.position[1] -= ny * penetration * (a.invMass / totalInv);
  b.position[0] += nx * penetration * (b.invMass / totalInv);
  b.position[1] += ny * penetration * (b.invMass / totalInv);

  // Impulse along the normal; skip when the bodies already separate.
  const velAlong = (b.velocity[0] - a.velocity[0]) * nx + (b.velocity[1] - a.velocity[1]) * ny;
  if (velAlong > 0) return;

  const e = Math.min(a.restitution, b.restitution);
  const j = (-(1 + e) * velAlong) / totalInv;
  a.velocity[0] -= nx * j * a.invMass;
  a.velocity[1] -= ny * j * a.invMass;
  b.velocity[0] += nx * j * b.invMass;
  b.velocity[1] += ny * j * b.invMass;
}
