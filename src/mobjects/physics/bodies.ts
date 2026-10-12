/**
 * Rigid bodies for the 2D physics solver.
 *
 * A {@link Body} holds the motion state (position, velocity, mass) and a
 * shape. The solver in {@link PhysicsWorld} owns the integration; a body only
 * stores its own state and a few shape queries (radius, axis-aligned bounds).
 *
 * A body may be attached to a repo {@link Mobject} (a Circle, Dot or Polygon).
 * When it is, the world moves that mobject to the body position on every step,
 * so a scene renders the simulation without any extra wiring.
 */

import { Mobject } from '../../core/Mobject';
import { Vec2, cloneVec2 } from './vec2';

/** A circle shape with a radius, centered on the body position. */
export interface CircleShape {
  kind: 'circle';
  /** Radius in scene units. */
  radius: number;
}

/** A convex polygon shape, as vertices relative to the body position. */
export interface PolygonShape {
  kind: 'polygon';
  /** Vertices in local space, measured from the body position. */
  vertices: Vec2[];
}

/** The collision shape of a {@link Body}. */
export type BodyShape = CircleShape | PolygonShape;

/** Options for {@link Body}. */
export interface BodyOptions {
  /** Start position `[x, y]`. Default: `[0, 0]`. */
  position?: Vec2;
  /** Start velocity `[x, y]` in units/sec. Default: `[0, 0]`. */
  velocity?: Vec2;
  /** Mass in arbitrary units. Ignored when `isStatic` is true. Default: 1. */
  mass?: number;
  /** Bounciness from 0 (no bounce) to 1 (elastic). Default: 0.5. */
  restitution?: number;
  /** A static body never moves and has infinite mass. Default: false. */
  isStatic?: boolean;
  /** Collision shape. Default: a circle of radius 0.5. */
  shape?: BodyShape;
  /**
   * Scale on the world gravity for this body, so a body can ignore gravity
   * (0) or feel more or less than the rest. Default: 1.
   */
  gravityScale?: number;
  /** A mobject to move to the body position on each step. Default: none. */
  mobject?: Mobject;
}

/** A snapshot of a body position and velocity, used to restore state. */
interface BodySnapshot {
  position: Vec2;
  velocity: Vec2;
}

/**
 * A rigid body in the physics world.
 *
 * The body is the single source of truth for its motion. An attached mobject
 * follows the body, never the other way around.
 *
 * @example
 * ```typescript
 * const ball = new Body({
 *   position: [0, 3],
 *   shape: { kind: 'circle', radius: 0.2 },
 *   restitution: 0.8,
 * });
 * ```
 */
export class Body {
  /** Current position `[x, y]`. */
  position: Vec2;
  /** Current velocity `[x, y]` in units/sec. */
  velocity: Vec2;
  /** Force accumulator for the current step, cleared after integration. */
  force: Vec2 = [0, 0];
  /** Mass in arbitrary units. A static body reports `Infinity`. */
  readonly mass: number;
  /** Inverse mass. Zero for a static body, which disables all motion. */
  readonly invMass: number;
  /** Bounciness from 0 to 1. */
  readonly restitution: number;
  /** Whether the body is static (never moves). */
  readonly isStatic: boolean;
  /** The collision shape. */
  readonly shape: BodyShape;
  /** Per-body scale on the world gravity. */
  readonly gravityScale: number;
  /** The attached mobject, or null. */
  mobject: Mobject | null;
  /** The z of the attached mobject at attach time, kept on every move. */
  readonly z: number;

  private readonly _initial: BodySnapshot;

  constructor(options: BodyOptions = {}) {
    const {
      position = [0, 0],
      velocity = [0, 0],
      mass = 1,
      restitution = 0.5,
      isStatic = false,
      shape = { kind: 'circle', radius: 0.5 },
      gravityScale = 1,
      mobject,
    } = options;

    this.position = cloneVec2(position);
    this.velocity = cloneVec2(velocity);
    this.isStatic = isStatic;
    const effectiveMass = isStatic || mass <= 0 ? Infinity : mass;
    this.mass = effectiveMass;
    this.invMass = effectiveMass === Infinity ? 0 : 1 / effectiveMass;
    this.restitution = restitution;
    this.shape = shape;
    this.gravityScale = gravityScale;
    this.mobject = mobject ?? null;
    this.z = mobject ? mobject.getCenter()[2] : 0;

    this._initial = {
      position: cloneVec2(this.position),
      velocity: cloneVec2(this.velocity),
    };
  }

  /** The circle radius, or 0 for a polygon body. */
  get radius(): number {
    return this.shape.kind === 'circle' ? this.shape.radius : 0;
  }

  /** Add a force `[x, y]` to the accumulator for the current step. */
  applyForce(f: Vec2): this {
    this.force[0] += f[0];
    this.force[1] += f[1];
    return this;
  }

  /**
   * The axis-aligned bounds as `[minX, minY, maxX, maxY]` in world space.
   * A circle uses its radius; a polygon uses its vertex extent.
   */
  aabb(): [number, number, number, number] {
    if (this.shape.kind === 'circle') {
      const r = this.shape.radius;
      return [
        this.position[0] - r,
        this.position[1] - r,
        this.position[0] + r,
        this.position[1] + r,
      ];
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const v of this.shape.vertices) {
      const x = this.position[0] + v[0];
      const y = this.position[1] + v[1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    return [minX, minY, maxX, maxY];
  }

  /** Restore the position and velocity recorded when the body was created. */
  reset(): this {
    this.position = cloneVec2(this._initial.position);
    this.velocity = cloneVec2(this._initial.velocity);
    this.force = [0, 0];
    return this;
  }
}
