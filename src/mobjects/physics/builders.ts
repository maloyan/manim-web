/**
 * Convenience builders for common physics setups.
 *
 * A {@link pendulum} is one bob body held by a rigid distance constraint to a
 * fixed pivot. A {@link springChain} is a row of bodies linked by springs,
 * optionally hung from a fixed anchor. Both return a ready
 * {@link PhysicsWorld}; the bodies are reachable through `getBodies()`.
 */

import { Mobject } from '../../core/Mobject';
import { PhysicsWorld } from './PhysicsWorld';
import { DistanceConstraint, SpringConstraint } from './constraints';
import { Vec2 } from './vec2';

/** Options for {@link pendulum}. */
export interface PendulumOptions {
  /** Fixed pivot point `[x, y]`. Default: `[0, 2]`. */
  pivot?: Vec2;
  /** Rod length from the pivot to the bob. Default: 2. */
  length?: number;
  /** Bob mass. Default: 1. */
  mass?: number;
  /** Start angle in radians from straight down. Default: `Math.PI / 4`. */
  angle?: number;
  /** Bob radius. Default: 0.2. */
  radius?: number;
  /** Gravity `[x, y]`. Default: `[0, -9.8]`. */
  gravity?: Vec2;
  /** Mobject to attach to the bob. Default: none. */
  bob?: Mobject;
}

/**
 * Build a pendulum: a bob body pinned to a fixed pivot by a rigid distance
 * constraint. The bob starts at `angle` from straight down and swings under
 * gravity while the constraint holds it a near-constant `length` from the
 * pivot.
 */
export function pendulum(options: PendulumOptions = {}): PhysicsWorld {
  const {
    pivot = [0, 2],
    length = 2,
    mass = 1,
    angle = Math.PI / 4,
    radius = 0.2,
    gravity = [0, -9.8],
    bob,
  } = options;

  const world = new PhysicsWorld({ gravity });
  const start: Vec2 = [pivot[0] + Math.sin(angle) * length, pivot[1] - Math.cos(angle) * length];
  const body = world.addBody({
    position: start,
    mass,
    shape: { kind: 'circle', radius },
    mobject: bob,
  });
  world.addConstraint(new DistanceConstraint(body, [pivot[0], pivot[1]], length));
  return world;
}

/** Options for {@link springChain}. */
export interface SpringChainOptions {
  /** First link position `[x, y]`. Default: `[0, 3]`. */
  start?: Vec2;
  /** Number of bodies in the chain. Default: 4. */
  count?: number;
  /** Rest length between neighboring links. Default: 1. */
  spacing?: number;
  /** Mass of each body. Default: 1. */
  mass?: number;
  /** Spring stiffness. Default: 40. */
  stiffness?: number;
  /** Spring damping. Default: 2. */
  damping?: number;
  /** Gravity `[x, y]`. Default: `[0, -9.8]`. */
  gravity?: Vec2;
  /** Pin the first link to a fixed anchor at `start`. Default: true. */
  anchored?: boolean;
  /** Seeded horizontal jitter on the start positions. Default: 0. */
  jitter?: number;
  /** Seed for the jitter PRNG. Default: 0. */
  seed?: number;
  /** Mobjects to attach to the links, in order. Default: none. */
  mobjects?: Mobject[];
}

/**
 * Build a vertical chain of bodies linked by springs, hanging downward from
 * `start`. With `anchored`, the top link is pinned to a fixed point, so the
 * chain hangs and sways; without it, the whole chain is free.
 */
export function springChain(options: SpringChainOptions = {}): PhysicsWorld {
  const {
    start = [0, 3],
    count = 4,
    spacing = 1,
    mass = 1,
    stiffness = 40,
    damping = 2,
    gravity = [0, -9.8],
    anchored = true,
    jitter = 0,
    seed = 0,
    mobjects = [],
  } = options;

  const world = new PhysicsWorld({ gravity, seed });
  const bodies = [];
  for (let i = 0; i < count; i++) {
    const offset = jitter === 0 ? 0 : (world.random() * 2 - 1) * jitter;
    const position: Vec2 = [start[0] + offset, start[1] - i * spacing];
    bodies.push(
      world.addBody({
        position,
        mass,
        shape: { kind: 'circle', radius: 0.15 },
        mobject: mobjects[i],
      }),
    );
  }

  if (anchored && bodies.length > 0) {
    world.addConstraint(
      new SpringConstraint(bodies[0], [start[0], start[1]], 0, { stiffness, damping }),
    );
  }
  for (let i = 0; i < bodies.length - 1; i++) {
    world.addConstraint(
      new SpringConstraint(bodies[i], bodies[i + 1], spacing, { stiffness, damping }),
    );
  }
  return world;
}
