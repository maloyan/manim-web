/**
 * `fAlways` and `always` — re-apply a mobject method on every frame.
 *
 * Manim CE exposes `f_always(mob.method, *getters)` and `always(mob.method,
 * *args)`. CE recovers the receiver from a bound method via Python's
 * `method.__self__`. A JavaScript method reference loses its `this`, so that
 * signature cannot work in TypeScript.
 *
 * The TS-idiomatic adaptation passes the mobject and the method NAME. Indexing
 * `mob[methodName]` keeps `this` bound to `mob` on every call. The method name
 * is typed so only method-valued keys of the mobject are accepted.
 *
 * - `fAlways(mob, name, ...getters)` calls `mob[name](...getters.map(g => g()))`
 *   each frame, so the arguments track the live getter values.
 * - `always(mob, name, ...args)` calls `mob[name](...args)` each frame with
 *   fixed arguments.
 *
 * Both return `mob` for chaining.
 */

import { Mobject } from '../core/Mobject';

/** A method value resolved by name, called with the mobject as `this`. */
type ResolvedMethod = (...args: unknown[]) => unknown;

/**
 * The keys of `M` whose values are methods.
 *
 * Used to constrain `methodName` so only callable members of a mobject are
 * accepted. The predicate uses `never[]` parameters so a method with concrete
 * parameter types (for example `setX(x: number)`) still matches.
 */
export type MethodKeys<M> = {
  [K in keyof M]: M[K] extends (...args: never[]) => unknown ? K : never;
}[keyof M];

/**
 * Re-apply a mobject method each frame with arguments from live getters.
 *
 * Adds an updater that calls `mob[methodName]` with the current value of each
 * getter. Use it to continually set a property from a value that changes over
 * time, for example a `ValueTracker`.
 *
 * @param mob - The mobject that owns the method.
 * @param methodName - The name of a method on `mob`.
 * @param argGetters - Zero or more getters; each is called every frame.
 * @returns `mob`, for chaining.
 *
 * @example
 * ```typescript
 * const tracker = new ValueTracker(0);
 * fAlways(dot, 'setX', () => tracker.getValue());
 * // Each frame: dot.setX(tracker.getValue()).
 * ```
 */
export function fAlways<M extends Mobject>(
  mob: M,
  methodName: MethodKeys<M>,
  ...argGetters: Array<() => unknown>
): M {
  mob.addUpdater(() => {
    const method = mob[methodName] as unknown as ResolvedMethod;
    method.apply(
      mob,
      argGetters.map((g) => g()),
    );
  });
  return mob;
}

/**
 * Re-apply a mobject method each frame with fixed arguments.
 *
 * Adds an updater that calls `mob[methodName]` with the same arguments on every
 * frame. Use it to keep a property pinned to a fixed value against other
 * updaters that would change it.
 *
 * @param mob - The mobject that owns the method.
 * @param methodName - The name of a method on `mob`.
 * @param args - Zero or more fixed arguments, re-applied every frame.
 * @returns `mob`, for chaining.
 *
 * @example
 * ```typescript
 * always(dot, 'setX', 2);
 * // Each frame: dot.setX(2).
 * ```
 */
export function always<M extends Mobject>(
  mob: M,
  methodName: MethodKeys<M>,
  ...args: unknown[]
): M {
  mob.addUpdater(() => {
    const method = mob[methodName] as unknown as ResolvedMethod;
    method.apply(mob, args);
  });
  return mob;
}

/**
 * Assert that `(mob, methodName)` names a method of a Mobject (CE
 * `assert_is_mobject_method`).
 *
 * CE takes one bound method and recovers the receiver from `method.__self__`.
 * A JavaScript method reference loses its `this`, so this repo validates the
 * `(mobject, methodName)` pair that `always` / `fAlways` already accept. The
 * check throws a clear `Error` when `mob` is not a `Mobject`, or when
 * `mob[methodName]` is not a function.
 *
 * @param mob - The value that must be a `Mobject`.
 * @param methodName - The name that must resolve to a method on `mob`.
 * @throws Error when `mob` is not a `Mobject` or `methodName` is not a method.
 *
 * @example
 * ```typescript
 * assertIsMobjectMethod(dot, 'setX'); // ok
 * assertIsMobjectMethod(dot, 'nope'); // throws
 * ```
 */
export function assertIsMobjectMethod(mob: unknown, methodName: string): void {
  if (!(mob instanceof Mobject)) {
    const got = mob === null ? 'null' : typeof mob;
    throw new Error(`assertIsMobjectMethod: expected a Mobject, got ${got}`);
  }
  const candidate = (mob as unknown as Record<string, unknown>)[methodName];
  if (typeof candidate !== 'function') {
    throw new Error(
      `assertIsMobjectMethod: "${methodName}" is not a method of ${mob.constructor.name}`,
    );
  }
}
