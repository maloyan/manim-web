/**
 * LaggedStart - plays animations with staggered starts.
 */

import { Animation } from './Animation';
import { AnimationGroup, AnimationGroupOptions } from './AnimationGroup';

export interface LaggedStartOptions extends AnimationGroupOptions {
  /**
   * Lag ratio between animation starts.
   * Default is 0.2 (20% overlap between consecutive animations).
   * 0 = all parallel, 1 = sequential (no overlap).
   */
  lagRatio?: number;
}

/**
 * Create a LaggedStart animation group.
 * Each animation starts lagRatio * singleDuration after the previous.
 *
 * @param animations Array of animations to stagger
 * @param options Options including lagRatio (default 0.2)
 */
export function laggedStart(
  animations: Animation[],
  options?: LaggedStartOptions
): AnimationGroup {
  return new AnimationGroup(animations, {
    ...options,
    lagRatio: options?.lagRatio ?? 0.2
  });
}

/**
 * LaggedStart class for cases where class instantiation is preferred.
 */
export class LaggedStart extends AnimationGroup {
  constructor(animations: Animation[], options: LaggedStartOptions = {}) {
    super(animations, {
      ...options,
      lagRatio: options.lagRatio ?? 0.2
    });
  }
}
