/**
 * FadeIn animation - fades a mobject from transparent to opaque.
 */

import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

export class FadeIn extends Animation {
  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    super(mobject, options);
  }

  /**
   * Set up the animation - start with opacity 0
   */
  override begin(): void {
    super.begin();
    // Start fully transparent
    this.mobject.opacity = 0;
  }

  /**
   * Interpolate the opacity from 0 to 1
   */
  interpolate(alpha: number): void {
    this.mobject.opacity = alpha;
  }

  /**
   * Ensure the mobject is fully visible at the end
   */
  override finish(): void {
    this.mobject.opacity = 1;
    super.finish();
  }
}

/**
 * Create a FadeIn animation for a mobject.
 * @param mobject The mobject to fade in
 * @param options Animation options (duration, rateFunc)
 */
export function fadeIn(mobject: Mobject, options?: AnimationOptions): FadeIn {
  return new FadeIn(mobject, options);
}
