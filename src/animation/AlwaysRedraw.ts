/**
 * `alwaysRedraw` — a mobject that rebuilds itself every frame.
 *
 * Mirrors Manim CE `always_redraw`: it calls the factory once to get the
 * initial mobject, then adds an updater that calls the factory again each
 * frame and `become()`s the result. Use it when a mobject must track another
 * mobject or value that changes over time.
 *
 * Note on `f_always` / `always`: Manim CE recovers the receiver from a bound
 * method via `method.__self__`. JavaScript method references lose their `this`,
 * so the CE signatures (`always(mob.method, getter)`) cannot be implemented
 * cleanly or safely in TypeScript. They are intentionally omitted here;
 * `alwaysRedraw` plus `mob.addUpdater(...)` cover the same need without the
 * fragile binding.
 */

import { Mobject } from '../core/Mobject';

/**
 * Create a mobject that redraws itself on every frame.
 *
 * @param fn - Factory that returns the mobject for the current frame.
 * @returns The mobject, with an updater that rebuilds it each frame.
 *
 * @example
 * ```typescript
 * const label = alwaysRedraw(() => new Text(`x = ${dot.getCenter()[0].toFixed(2)}`));
 * scene.add(label);
 * ```
 */
export function alwaysRedraw(fn: () => Mobject): Mobject {
  const mobject = fn();
  mobject.addUpdater((m) => {
    m.become(fn());
  });
  return mobject;
}
