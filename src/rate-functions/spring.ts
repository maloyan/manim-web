/**
 * Spring physics rate function.
 *
 * Simulates a damped harmonic oscillator that starts at 0 and settles at 1.
 * The curve may overshoot 1 before it settles, like a real spring.
 *
 * The function is deterministic: it has no time-based side effects and the
 * same options always produce the same curve.
 */

import type { RateFunction } from './index';

/**
 * Options for the spring rate function.
 *
 * Use either the physical model (stiffness, damping, mass) or the simpler
 * bounce model. If bounce is set, it wins over stiffness and damping.
 */
export interface SpringOptions {
  /** Spring constant. Higher is tighter. Default 100. */
  stiffness?: number;
  /** Damping (friction) coefficient. Higher settles faster. Default 10. */
  damping?: number;
  /** Mass on the spring. Higher is slower. Default 1. */
  mass?: number;
  /**
   * Bounce in [0, 1). 0 gives no overshoot. Values near 1 give large
   * overshoot. If set, this replaces stiffness and damping.
   */
  bounce?: number;
  /**
   * Settle threshold used to map physical time into [0, 1].
   * The spring reaches this distance from 1 at t = 1. Default 0.005.
   */
  restThreshold?: number;
}

const DEFAULT_STIFFNESS = 100;
const DEFAULT_DAMPING = 10;
const DEFAULT_MASS = 1;
const DEFAULT_REST_THRESHOLD = 0.005;

const clamp = (value: number, low: number, high: number): number => {
  return Math.max(low, Math.min(high, value));
};

/**
 * Compute the natural frequency and damping ratio from the options.
 */
const resolveSpring = (options: SpringOptions): { omega0: number; zeta: number } => {
  if (options.bounce !== undefined) {
    // bounce = 0 gives a critically damped spring (no overshoot).
    // bounce near 1 gives an almost undamped spring (large overshoot).
    const bounce = clamp(options.bounce, 0, 0.99);
    // omega0 cancels out after time normalization, so any positive value works.
    return { omega0: 10, zeta: 1 - bounce };
  }

  const stiffness = options.stiffness ?? DEFAULT_STIFFNESS;
  const damping = options.damping ?? DEFAULT_DAMPING;
  const mass = options.mass ?? DEFAULT_MASS;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  return { omega0, zeta };
};

/**
 * Build the physical position function. Equilibrium is 1, start is 0,
 * initial velocity is 0. Input is physical time in seconds.
 */
const buildPosition = (omega0: number, zeta: number): ((tau: number) => number) => {
  if (zeta < 1 - 1e-6) {
    // Underdamped: oscillates and overshoots.
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const factor = (zeta * omega0) / omegaD;
    return (tau: number): number => {
      const envelope = Math.exp(-zeta * omega0 * tau);
      const displacement = -envelope * (Math.cos(omegaD * tau) + factor * Math.sin(omegaD * tau));
      return 1 + displacement;
    };
  }

  if (zeta <= 1 + 1e-6) {
    // Critically damped: fastest settle with no overshoot.
    return (tau: number): number => {
      return 1 - Math.exp(-omega0 * tau) * (1 + omega0 * tau);
    };
  }

  // Overdamped: slow, no overshoot.
  const root = omega0 * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * omega0 + root;
  const r2 = -zeta * omega0 - root;
  const a = r2 / (r1 - r2);
  const b = -1 - a;
  return (tau: number): number => {
    return 1 + a * Math.exp(r1 * tau) + b * Math.exp(r2 * tau);
  };
};

/**
 * The slowest decay rate of the spring. Used to size the settle time.
 */
const decayRate = (omega0: number, zeta: number): number => {
  if (zeta <= 1 + 1e-6) {
    return zeta * omega0;
  }
  const root = omega0 * Math.sqrt(zeta * zeta - 1);
  // The slower of the two roots governs how long the spring takes to settle.
  return zeta * omega0 - root;
};

/**
 * Create a damped spring rate function.
 *
 * The returned function maps t in [0, 1] to a value that starts at 0 and
 * settles at 1. With an underdamped spring the value overshoots 1 first.
 *
 * @example
 * const bouncy = spring({ bounce: 0.6 });
 * bouncy(0); // 0
 * bouncy(1); // 1
 */
export const spring = (options: SpringOptions = {}): RateFunction => {
  const { omega0, zeta } = resolveSpring(options);
  const threshold = options.restThreshold ?? DEFAULT_REST_THRESHOLD;
  const position = buildPosition(omega0, zeta);
  const rate = decayRate(omega0, zeta);
  // Physical time at which the spring sits within `threshold` of 1.
  const settleTime = -Math.log(threshold) / rate;

  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return position(t * settleTime);
  };
};
