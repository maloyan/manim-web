/**
 * FadeOut animation - fades a mobject from opaque to transparent.
 */

import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

export class FadeOut extends Animation {
  private _initialOpacity: number = 1;

  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    super(mobject, options);
  }

  /**
   * Set up the animation - store the initial opacity
   */
  override begin(): void {
    super.begin();
    // Store the initial opacity to fade from
    this._initialOpacity = this.mobject.opacity;
  }

  /**
   * Interpolate the opacity from initial to 0
   */
  interpolate(alpha: number): void {
    this.mobject.opacity = this._initialOpacity * (1 - alpha);
  }

  /**
   * Ensure the mobject is fully transparent at the end
   */
  override finish(): void {
    this.mobject.opacity = 0;
    super.finish();
  }
}

/**
 * Create a FadeOut animation for a mobject.
 * @param mobject The mobject to fade out
 * @param options Animation options (duration, rateFunc)
 */
export function fadeOut(mobject: Mobject, options?: AnimationOptions): FadeOut {
  return new FadeOut(mobject, options);
}
