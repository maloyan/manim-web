/**
 * Succession - plays animations one after another (sequential).
 */

import { Animation } from './Animation';
import { AnimationGroup, AnimationGroupOptions } from './AnimationGroup';

export interface SuccessionOptions extends Omit<AnimationGroupOptions, 'lagRatio'> {}

/**
 * Create a Succession animation group.
 * Animations play one after another with no overlap (lagRatio = 1).
 *
 * @param animations Array of animations to play in sequence
 * @param options Animation options (rateFunc)
 */
export function succession(
  animations: Animation[],
  options?: SuccessionOptions
): AnimationGroup {
  return new AnimationGroup(animations, {
    ...options,
    lagRatio: 1
  });
}

/**
 * Succession class for cases where class instantiation is preferred.
 */
export class Succession extends AnimationGroup {
  constructor(animations: Animation[], options: SuccessionOptions = {}) {
    super(animations, {
      ...options,
      lagRatio: 1
    });
  }
}
