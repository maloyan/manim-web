/**
 * LaggedStartMap - applies an animation class to multiple mobjects with staggered starts.
 *
 * This is a convenience function that creates animations from an animation class
 * and applies them to an array of mobjects with lagged timing.
 */

import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { AnimationGroup, AnimationGroupOptions } from '../AnimationGroup';

/**
 * Type for an animation constructor that takes a mobject and options.
 */
export type AnimationClass<T extends AnimationOptions = AnimationOptions> = new (
  mobject: Mobject,
  options?: T
) => Animation;

export interface LaggedStartMapOptions<T extends AnimationOptions = AnimationOptions>
  extends AnimationGroupOptions {
  /**
   * Lag ratio between animation starts.
   * Default is 0.2 (20% overlap between consecutive animations).
   * 0 = all parallel, 1 = sequential (no overlap).
   */
  lagRatio?: number;

  /**
   * Options to pass to each animation instance.
   */
  animOptions?: T;
}

/**
 * Create a LaggedStartMap animation group.
 * Applies an animation class to each mobject with staggered start times.
 *
 * @param AnimClass The animation class to instantiate (e.g., FadeIn, Create)
 * @param mobjects Array of mobjects to animate
 * @param options Options including lagRatio and animation-specific options
 *
 * @example
 * ```typescript
 * // Fade in each letter one by one
 * laggedStartMap(FadeIn, textMobject.children, { lagRatio: 0.1 })
 *
 * // Create shapes with custom duration
 * laggedStartMap(Create, shapes, {
 *   lagRatio: 0.2,
 *   animOptions: { duration: 0.5 }
 * })
 * ```
 */
export function laggedStartMap<T extends AnimationOptions = AnimationOptions>(
  AnimClass: AnimationClass<T>,
  mobjects: Mobject[],
  options?: LaggedStartMapOptions<T>
): AnimationGroup {
  const { lagRatio = 0.2, animOptions, ...groupOptions } = options ?? {};

  // Create an animation instance for each mobject
  const animations = mobjects.map(
    (mobject) => new AnimClass(mobject, animOptions)
  );

  return new AnimationGroup(animations, {
    ...groupOptions,
    lagRatio
  });
}

/**
 * LaggedStartMap class for cases where class instantiation is preferred.
 */
export class LaggedStartMap<
  T extends AnimationOptions = AnimationOptions
> extends AnimationGroup {
  constructor(
    AnimClass: AnimationClass<T>,
    mobjects: Mobject[],
    options: LaggedStartMapOptions<T> = {}
  ) {
    const { lagRatio = 0.2, animOptions, ...groupOptions } = options;

    // Create an animation instance for each mobject
    const animations = mobjects.map(
      (mobject) => new AnimClass(mobject, animOptions)
    );

    super(animations, {
      ...groupOptions,
      lagRatio
    });
  }
}
