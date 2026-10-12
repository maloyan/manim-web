/**
 * A particle system with an emitter, for motion graphics such as explosions,
 * sparks, flow fields and physics demos. Unlike {@link PointCloudDot} and other
 * static point clouds, this mobject emits particles over time, integrates their
 * motion under forces, ages them, and removes them when they die.
 *
 * The simulation is deterministic. A fixed `seed` reproduces the exact same
 * particle evolution, which makes renders reproducible and the behavior
 * testable without a GPU. Rendering reuses the {@link PMobject} point buffer:
 * each living particle becomes one rendered point with an interpolated color.
 */

import { Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';
import { interpolateColor } from '../../utils/color';
import { interpolateColorOklab } from '../../utils/oklab';
import { PMobject } from '../point/PMobject';

/**
 * A `mulberry32` PRNG. One seed produces a deterministic stream of 0..1 floats.
 * A local copy keeps the simulation self-contained, as {@link VectorField} does.
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

/** Linear interpolation from `a` to `b` at fraction `t`. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** External forces applied to every particle each step. */
export interface ParticleForces {
  /** Constant acceleration [x, y, z] in units/sec^2. Default: [0, 0, 0]. */
  gravity?: Vector3Tuple;
  /**
   * Velocity damping per second, from 0 (none) to 1 (full stop in one second).
   * Each step scales velocity by `1 - drag * dt`. Default: 0.
   */
  drag?: number;
}

/**
 * A snapshot of one living particle, returned by {@link ParticleSystem.getParticles}.
 * The arrays are copies, so a caller cannot mutate the internal state.
 */
export interface ParticleSnapshot {
  /** Current position [x, y, z]. */
  position: Vector3Tuple;
  /** Current velocity [x, y, z] in units/sec. */
  velocity: Vector3Tuple;
  /** Age in seconds since the particle was spawned. */
  age: number;
  /** Total lifetime in seconds. The particle dies when `age > lifetime`. */
  lifetime: number;
  /** Current size, interpolated from `startSize` to `endSize` over the life. */
  size: number;
  /** Current color, interpolated from `startColor` to `endColor` over the life. */
  color: string;
}

/** Options for creating a {@link ParticleSystem}. */
export interface ParticleSystemOptions {
  /** Particles emitted per second. Default: 20. */
  spawnRate?: number;
  /** Maximum living particles. Emission stops at the cap. Default: 500. */
  maxParticles?: number;
  /** Base lifetime in seconds. Default: 2. */
  lifetime?: number;
  /** Random +/- lifetime variation in seconds. Default: 0. */
  lifetimeSpread?: number;
  /** Emitter origin [x, y, z]. Default: [0, 0, 0]. */
  position?: Vector3Tuple;
  /** Random +/- spawn offset per axis from the origin. Default: [0, 0, 0]. */
  positionSpread?: Vector3Tuple;
  /** Initial velocity [x, y, z] in units/sec. Default: [0, 1, 0]. */
  velocity?: Vector3Tuple;
  /** Random +/- velocity variation per axis. Default: [0, 0, 0]. */
  velocitySpread?: Vector3Tuple;
  /** Forces applied each step. Default: none. */
  forces?: ParticleForces;
  /** Size at birth. Default: 8. */
  startSize?: number;
  /** Size at death. Default: 0. */
  endSize?: number;
  /** Color at birth. Default: white. */
  startColor?: string;
  /** Color at death. Default: white. */
  endColor?: string;
  /** Interpolate color in Oklab space for a smoother blend. Default: false. */
  useOklab?: boolean;
  /** Seed for the deterministic PRNG. Default: 0. */
  seed?: number;
}

/** Internal mutable particle record. */
interface Particle {
  position: Vector3Tuple;
  velocity: Vector3Tuple;
  age: number;
  lifetime: number;
  size: number;
  color: string;
}

/**
 * ParticleSystem - an emitter that spawns, integrates, ages and culls particles.
 *
 * Add it to a scene and the render loop calls {@link update} each frame, which
 * advances the simulation by `dt`. Call {@link step} to advance it manually,
 * for tests or offline renders.
 *
 * @example
 * ```typescript
 * const fountain = new ParticleSystem({
 *   spawnRate: 60,
 *   lifetime: 1.5,
 *   velocity: [0, 4, 0],
 *   velocitySpread: [1, 0.5, 1],
 *   forces: { gravity: [0, -9.8, 0] },
 *   startColor: '#ffcc00',
 *   endColor: '#ff0033',
 *   seed: 7,
 * });
 * scene.add(fountain);
 * ```
 */
export class ParticleSystem extends PMobject {
  private _spawnRate: number;
  private readonly _maxParticles: number;
  private readonly _lifetime: number;
  private readonly _lifetimeSpread: number;
  private readonly _origin: Vector3Tuple;
  private readonly _positionSpread: Vector3Tuple;
  private readonly _velocity: Vector3Tuple;
  private readonly _velocitySpread: Vector3Tuple;
  private readonly _gravity: Vector3Tuple;
  private readonly _drag: number;
  private readonly _startSize: number;
  private readonly _endSize: number;
  private readonly _startColor: string;
  private readonly _endColor: string;
  private readonly _useOklab: boolean;
  private _seed: number;

  /** Living particles, oldest first. */
  private _particles: Particle[] = [];
  /** Fractional carry so a low `spawnRate * dt` still emits over several steps. */
  private _spawnCarry = 0;
  /** The deterministic PRNG, re-created from the seed on {@link reset}. */
  private _rng: () => number;

  constructor(options: ParticleSystemOptions = {}) {
    const {
      spawnRate = 20,
      maxParticles = 500,
      lifetime = 2,
      lifetimeSpread = 0,
      position = [0, 0, 0],
      positionSpread = [0, 0, 0],
      velocity = [0, 1, 0],
      velocitySpread = [0, 0, 0],
      forces = {},
      startSize = 8,
      endSize = 0,
      startColor = WHITE,
      endColor = WHITE,
      useOklab = false,
      seed = 0,
    } = options;

    super({ color: startColor, pointSize: startSize });

    this._spawnRate = spawnRate;
    this._maxParticles = maxParticles;
    this._lifetime = lifetime;
    this._lifetimeSpread = lifetimeSpread;
    this._origin = [...position];
    this._positionSpread = [...positionSpread];
    this._velocity = [...velocity];
    this._velocitySpread = [...velocitySpread];
    this._gravity = forces.gravity ? [...forces.gravity] : [0, 0, 0];
    this._drag = forces.drag ?? 0;
    this._startSize = startSize;
    this._endSize = endSize;
    this._startColor = startColor;
    this._endColor = endColor;
    this._useOklab = useOklab;
    this._seed = seed;
    this._rng = mulberry32(seed);

    // The scene render loop calls update(dt), which runs this updater.
    this.addUpdater((_, dt) => this.step(dt));
  }

  /** The seed that drives the deterministic PRNG. */
  get seed(): number {
    return this._seed;
  }

  /**
   * Set the seed and restart the PRNG from it. Does not remove living particles;
   * call {@link reset} for a full restart.
   */
  set seed(value: number) {
    this._seed = value;
    this._rng = mulberry32(value);
  }

  /** Set the emission rate in particles per second. */
  setSpawnRate(rate: number): this {
    this._spawnRate = Math.max(0, rate);
    return this;
  }

  /** The current emission rate in particles per second. */
  getSpawnRate(): number {
    return this._spawnRate;
  }

  /** The number of living particles. */
  getLivingCount(): number {
    return this._particles.length;
  }

  /**
   * Snapshots of all living particles, oldest first. The returned records are
   * copies, so mutating them does not change the simulation.
   */
  getParticles(): ParticleSnapshot[] {
    return this._particles.map((p) => ({
      position: [...p.position] as Vector3Tuple,
      velocity: [...p.velocity] as Vector3Tuple,
      age: p.age,
      lifetime: p.lifetime,
      size: p.size,
      color: p.color,
    }));
  }

  /**
   * Remove every particle and restart the PRNG from the seed. After a reset, the
   * same sequence of {@link step} calls reproduces the same evolution as a fresh
   * system with the same seed.
   */
  reset(): this {
    this._particles = [];
    this._spawnCarry = 0;
    this._rng = mulberry32(this._seed);
    this._syncParticlesToPoints();
    return this;
  }

  /**
   * Advance the simulation by `dt` seconds. The step spawns new particles for the
   * elapsed time, integrates position and velocity under the forces, ages every
   * particle, and removes those whose age passes their lifetime.
   *
   * @param dt - Elapsed time in seconds. Values <= 0 are ignored.
   */
  step(dt: number): this {
    if (dt <= 0) return this;
    this._spawn(dt);
    this._integrate(dt);
    this._cull();
    this._syncParticlesToPoints();
    return this;
  }

  /** Emit `floor(spawnRate * dt + carry)` particles, up to the cap. */
  private _spawn(dt: number): void {
    this._spawnCarry += this._spawnRate * dt;
    const toSpawn = Math.floor(this._spawnCarry);
    this._spawnCarry -= toSpawn;
    for (let i = 0; i < toSpawn; i++) {
      if (this._particles.length >= this._maxParticles) break;
      this._particles.push(this._makeParticle());
    }
  }

  /** Build one particle at the emitter, with seeded spread on spawn values. */
  private _makeParticle(): Particle {
    const position: Vector3Tuple = [
      this._origin[0] + this._spread(this._positionSpread[0]),
      this._origin[1] + this._spread(this._positionSpread[1]),
      this._origin[2] + this._spread(this._positionSpread[2]),
    ];
    const velocity: Vector3Tuple = [
      this._velocity[0] + this._spread(this._velocitySpread[0]),
      this._velocity[1] + this._spread(this._velocitySpread[1]),
      this._velocity[2] + this._spread(this._velocitySpread[2]),
    ];
    const lifetime = Math.max(1e-6, this._lifetime + this._spread(this._lifetimeSpread));
    return {
      position,
      velocity,
      age: 0,
      lifetime,
      size: this._startSize,
      color: this._startColor,
    };
  }

  /** A seeded random offset in the range [-amount, amount]. */
  private _spread(amount: number): number {
    if (amount === 0) return 0;
    return (this._rng() * 2 - 1) * amount;
  }

  /**
   * Semi-implicit Euler integration. For each particle, apply gravity and drag to
   * the velocity, move by the new velocity, then age it and update its size and
   * color from the age fraction.
   */
  private _integrate(dt: number): void {
    const dragFactor = Math.max(0, 1 - this._drag * dt);
    for (const p of this._particles) {
      p.velocity[0] = (p.velocity[0] + this._gravity[0] * dt) * dragFactor;
      p.velocity[1] = (p.velocity[1] + this._gravity[1] * dt) * dragFactor;
      p.velocity[2] = (p.velocity[2] + this._gravity[2] * dt) * dragFactor;
      p.position[0] += p.velocity[0] * dt;
      p.position[1] += p.velocity[1] * dt;
      p.position[2] += p.velocity[2] * dt;
      p.age += dt;
      const t = Math.min(1, p.age / p.lifetime);
      p.size = lerp(this._startSize, this._endSize, t);
      p.color = this._useOklab
        ? interpolateColorOklab(this._startColor, this._endColor, t)
        : interpolateColor(this._startColor, this._endColor, t);
    }
  }

  /** Remove particles whose age has passed their lifetime. Order is preserved. */
  private _cull(): void {
    this._particles = this._particles.filter((p) => p.age <= p.lifetime);
  }

  /** Mirror the living particles into the PMobject point buffer for rendering. */
  private _syncParticlesToPoints(): void {
    this._points = this._particles.map((p) => ({
      position: [...p.position] as Vector3Tuple,
      color: p.color,
      opacity: this._opacity,
    }));
    this._markDirty();
  }

  /** An empty system has no living particles, so skip the bounding box. */
  override isEmpty(): boolean {
    return this._particles.length === 0;
  }

  override copy(): ParticleSystem {
    const copy = new ParticleSystem({
      spawnRate: this._spawnRate,
      maxParticles: this._maxParticles,
      lifetime: this._lifetime,
      lifetimeSpread: this._lifetimeSpread,
      position: this._origin,
      positionSpread: this._positionSpread,
      velocity: this._velocity,
      velocitySpread: this._velocitySpread,
      forces: { gravity: this._gravity, drag: this._drag },
      startSize: this._startSize,
      endSize: this._endSize,
      startColor: this._startColor,
      endColor: this._endColor,
      useOklab: this._useOklab,
      seed: this._seed,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
