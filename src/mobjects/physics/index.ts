/**
 * 2D rigid-body physics: a compact, self-contained solver for gravity,
 * collisions, springs and pendulums. Bodies attach to repo mobjects (Circle,
 * Dot, Polygon) and move under the simulation, driven by an updater like
 * {@link ParticleSystem}. The simulation is deterministic from a seed.
 */

export { PhysicsWorld, type PhysicsWorldOptions } from './PhysicsWorld';
export {
  Body,
  type BodyOptions,
  type BodyShape,
  type CircleShape,
  type PolygonShape,
} from './bodies';
export {
  type Constraint,
  type Anchor,
  DistanceConstraint,
  type DistanceConstraintOptions,
  SpringConstraint,
  type SpringConstraintOptions,
} from './constraints';
export { type Bounds, resolveBounds, resolveCircleCircle } from './collisions';
export { pendulum, type PendulumOptions, springChain, type SpringChainOptions } from './builders';
export type { Vec2 } from './vec2';
