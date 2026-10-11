/**
 * `prefers-reduced-motion` support for manim-web — an opt-in accessibility
 * capability.
 *
 * Some viewers set their operating system to reduce motion (vestibular
 * disorders, migraine triggers). When the app opts in with
 * {@link setReducedMotion} AND the OS reports
 * `(prefers-reduced-motion: reduce)`, animations collapse their run time so
 * the scene jumps to its final state instead of playing.
 *
 * The capability is off by default, so it never changes default playback.
 * Every DOM access is guarded, so importing or calling this module is safe in
 * Node / SSR / test environments where `window.matchMedia` does not exist.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** The reduced-motion setting. */
export interface ReducedMotionOptions {
  /** Whether reduced motion is honored at all. Default `false`. */
  enabled: boolean;
  /** Run time in seconds to collapse animations to when active. Default `0`. */
  runTime: number;
}

const DEFAULT_STATE: ReducedMotionOptions = { enabled: false, runTime: 0 };

let state: ReducedMotionOptions = { ...DEFAULT_STATE };

/**
 * Whether the operating system asks for reduced motion.
 *
 * Returns `false` in any environment without a working `window.matchMedia`,
 * and never throws.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches === true;
  } catch {
    return false;
  }
}

/**
 * Opt in to (or out of) reduced-motion handling.
 *
 * Pass a boolean to toggle only `enabled`, or a partial options object to also
 * set the collapsed `runTime`. A non-finite or negative `runTime` clamps to 0.
 */
export function setReducedMotion(options: boolean | Partial<ReducedMotionOptions>): void {
  const patch: Partial<ReducedMotionOptions> =
    typeof options === 'boolean' ? { enabled: options } : options;
  const next: ReducedMotionOptions = { ...state, ...patch };
  if (!Number.isFinite(next.runTime) || next.runTime < 0) {
    next.runTime = 0;
  }
  state = next;
}

/** Whether reduced-motion handling is currently opted in. */
export function isReducedMotionEnabled(): boolean {
  return state.enabled;
}

/** The run time (seconds) animations collapse to when reduced motion is active. */
export function getReducedMotionRunTime(): number {
  return state.runTime;
}

/** Restore the default setting (disabled, run time 0). */
export function resetReducedMotion(): void {
  state = { ...DEFAULT_STATE };
}

/**
 * Whether animations should be reduced right now: opted in via
 * {@link setReducedMotion} AND the OS prefers reduced motion.
 */
export function shouldReduceMotion(): boolean {
  return state.enabled && prefersReducedMotion();
}

/**
 * The effective run time for an animation: the collapsed run time when
 * {@link shouldReduceMotion} is true, otherwise the requested value unchanged.
 */
export function reducedRunTime(requestedRunTime: number): number {
  return shouldReduceMotion() ? state.runTime : requestedRunTime;
}

/** The minimal shape {@link applyReducedMotion} needs: a writable `duration`. */
interface DurationBearing {
  duration: number;
}

/**
 * Collapse the `duration` of each animation to the configured run time when
 * {@link shouldReduceMotion} is true. Does nothing otherwise.
 *
 * `duration` is defined as read-only on the animation type, so it is
 * overridden through `Object.defineProperty` (the same mechanism the scene
 * uses for timestamped playback).
 *
 * @returns `true` when durations were collapsed, `false` when left unchanged.
 */
export function applyReducedMotion<T extends DurationBearing>(
  animations: ReadonlyArray<T>,
): boolean {
  if (!shouldReduceMotion()) {
    return false;
  }
  for (const animation of animations) {
    Object.defineProperty(animation, 'duration', {
      value: state.runTime,
      writable: true,
      configurable: true,
    });
  }
  return true;
}
