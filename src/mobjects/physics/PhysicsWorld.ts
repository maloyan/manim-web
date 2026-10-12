/**
 * A compact, self-contained 2D rigid-body physics world.
 *
 * The world holds {@link Body} objects and {@link Constraint} objects and
 * advances them with semi-implicit (symplectic) Euler integration. It mirrors
 * {@link ParticleSystem}: a fixed `seed` drives a `mulberry32` PRNG, so the
 * simulation is deterministic and reproducible without a GPU, and an updater
 * added in the constructor steps the world from the scene render loop.
 *
 * Each body can carry a repo mobject (a Circle, Dot or Polygon). The world
 * adds that mobject as a child and moves it to the body position on every
 * step, so adding the world to a scene renders the simulation.
 *
 * There is no heavy physics dependency. The solver is a few hundred lines of
 * plain math, split across sibling files (vec2, bodies, constraints,
 * collisions, builders).
 *
 * @example
 * ```typescript
 * const world = new PhysicsWorld({ gravity: [0, -9.8], bounds: { minY: -3 } });
 * const ball = world.addBody({
 *   position: [0, 2],
 *   restitution: 0.8,
 *   shape: { kind: 'circle', radius: 0.2 },
 *   mobject: new Dot({ point: [0, 2, 0] }),
 * });
 * scene.add(world);
 * ```
 */

import { Group } from '../../core/Group';
import { Mobject } from '../../core/Mobject';
import { Body, BodyOptions } from './bodies';
import { Constraint } from './constraints';
import { Bounds, resolveBounds, resolveCircleCircle } from './collisions';
import { Vec2 } from './vec2';

/**
 * A `mulberry32` PRNG. One seed produces a deterministic stream of 0..1
 * floats. A local copy keeps the world self-contained, as
 * {@link ParticleSystem} does.
 */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Options for a {@link PhysicsWorld}. */
export interface PhysicsWorldOptions {
  /** Global acceleration `[x, y]` in units/sec^2. Default: `[0, -9.8]`. */
  gravity?: Vec2;
  /** World bounds for wall collisions. Default: open on every side. */
  bounds?: Bounds;
  /** Constraint position-solver iterations per step. Default: 4. */
  iterations?: number;
  /** Seed for the deterministic PRNG. Default: 0. */
  seed?: number;
}

/**
 * A 2D rigid-body physics world. See the file overview for the model and an
 * example.
 */
export class PhysicsWorld extends Group {
  private readonly _bodies: Body[] = [];
  private readonly _constraints: Constraint[] = [];
  private _gravity: Vec2;
  private _bounds: Bounds;
  private readonly _iterations: number;
  private _seed: number;
  private _rng: () => number;

  constructor(options: PhysicsWorldOptions = {}) {
    super();
    const { gravity = [0, -9.8], bounds = {}, iterations = 4, seed = 0 } = options;
    this._gravity = [gravity[0], gravity[1]];
    this._bounds = { ...bounds };
    this._iterations = Math.max(1, Math.floor(iterations));
    this._seed = seed;
    this._rng = mulberry32(seed);

    // The scene render loop calls update(dt), which runs this updater.
    this.addUpdater((_, dt) => this.step(dt));
  }

  /** The seed that drives the deterministic PRNG. */
  get seed(): number {
    return this._seed;
  }

  /** The current global gravity `[x, y]`. */
  getGravity(): Vec2 {
    return [this._gravity[0], this._gravity[1]];
  }

  /** Set the global gravity `[x, y]`. */
  setGravity(gravity: Vec2): this {
    this._gravity = [gravity[0], gravity[1]];
    return this;
  }

  /** Set the world bounds for wall collisions. */
  setBounds(bounds: Bounds): this {
    this._bounds = { ...bounds };
    return this;
  }

  /** The next deterministic random float in `[0, 1)`. */
  random(): number {
    return this._rng();
  }

  /**
   * Add a body to the world. Accepts a {@link Body} or plain options. If the
   * body carries a mobject, it is added as a child so the scene renders it.
   *
   * @returns The body that was added, for building constraints.
   */
  addBody(bodyOrOptions: Body | BodyOptions): Body {
    const body = bodyOrOptions instanceof Body ? bodyOrOptions : new Body(bodyOrOptions);
    this._bodies.push(body);
    if (body.mobject) this.add(body.mobject);
    return body;
  }

  /** Add a constraint to the world. @returns The constraint, for chaining. */
  addConstraint<T extends Constraint>(constraint: T): T {
    this._constraints.push(constraint);
    return constraint;
  }

  /** All bodies, in insertion order. The array is a copy; the bodies are live. */
  getBodies(): Body[] {
    return [...this._bodies];
  }

  /** The body at `index`, or undefined. */
  getBody(index: number): Body | undefined {
    return this._bodies[index];
  }

  /** All constraints, in insertion order. The array is a copy. */
  getConstraints(): Constraint[] {
    return [...this._constraints];
  }

  /**
   * Advance the simulation by `dt` seconds with semi-implicit Euler:
   * accumulate forces, integrate velocity then position, solve constraint
   * positions, resolve collisions, and move the attached mobjects.
   *
   * @param dt - Elapsed time in seconds. Values <= 0 are ignored.
   */
  step(dt: number): this {
    if (dt <= 0) return this;
    this._accumulateForces();
    this._integrate(dt);
    this._solveConstraints();
    this._resolveCollisions();
    this._syncMobjects();
    return this;
  }

  /** Add gravity and spring forces to every body for this step. */
  private _accumulateForces(): void {
    for (const body of this._bodies) {
      if (body.invMass === 0) continue;
      body.force[0] += this._gravity[0] * body.gravityScale * body.mass;
      body.force[1] += this._gravity[1] * body.gravityScale * body.mass;
    }
    for (const constraint of this._constraints) {
      constraint.accumulateForces?.();
    }
  }

  /** Semi-implicit Euler: velocity from force, then position from velocity. */
  private _integrate(dt: number): void {
    for (const body of this._bodies) {
      if (body.invMass === 0) {
        body.force[0] = 0;
        body.force[1] = 0;
        continue;
      }
      body.velocity[0] += body.force[0] * body.invMass * dt;
      body.velocity[1] += body.force[1] * body.invMass * dt;
      body.position[0] += body.velocity[0] * dt;
      body.position[1] += body.velocity[1] * dt;
      body.force[0] = 0;
      body.force[1] = 0;
    }
  }

  /** Run the position solver for each constraint, several iterations. */
  private _solveConstraints(): void {
    for (let i = 0; i < this._iterations; i++) {
      for (const constraint of this._constraints) {
        constraint.solvePositions?.();
      }
    }
  }

  /** Resolve every body against the bounds and every circle pair. */
  private _resolveCollisions(): void {
    for (const body of this._bodies) {
      resolveBounds(body, this._bounds);
    }
    for (let i = 0; i < this._bodies.length; i++) {
      for (let j = i + 1; j < this._bodies.length; j++) {
        resolveCircleCircle(this._bodies[i], this._bodies[j]);
      }
    }
  }

  /** Move each attached mobject to its body position, keeping its z. */
  private _syncMobjects(): void {
    for (const body of this._bodies) {
      if (body.mobject && !body.mobject.isEmpty()) {
        body.mobject.moveTo([body.position[0], body.position[1], body.z]);
      }
    }
  }

  /**
   * Restore every body to its initial state and restart the PRNG from the
   * seed. After a reset, the same sequence of {@link step} calls reproduces
   * the same evolution.
   */
  reset(): this {
    for (const body of this._bodies) body.reset();
    this._rng = mulberry32(this._seed);
    this._syncMobjects();
    return this;
  }

  override copy(): PhysicsWorld {
    const world = new PhysicsWorld({
      gravity: this._gravity,
      bounds: this._bounds,
      iterations: this._iterations,
      seed: this._seed,
    });
    const map = new Map<Body, Body>();
    for (const body of this._bodies) {
      const cloned = world.addBody(this._cloneBody(body));
      map.set(body, cloned);
    }
    for (const constraint of this._constraints) {
      world.addConstraint(constraint.clone(map));
    }
    this._copyBaseAttributesInto(world, { copyChildren: false });
    return world;
  }

  /** Build a new body with the same state and a copied mobject. */
  private _cloneBody(body: Body): Body {
    const mobject: Mobject | undefined = body.mobject ? body.mobject.copy() : undefined;
    const shape =
      body.shape.kind === 'circle'
        ? { kind: 'circle' as const, radius: body.shape.radius }
        : {
            kind: 'polygon' as const,
            vertices: body.shape.vertices.map((v): Vec2 => [v[0], v[1]]),
          };
    return new Body({
      position: [body.position[0], body.position[1]],
      velocity: [body.velocity[0], body.velocity[1]],
      mass: body.mass,
      restitution: body.restitution,
      isStatic: body.isStatic,
      shape,
      gravityScale: body.gravityScale,
      mobject,
    });
  }
}
