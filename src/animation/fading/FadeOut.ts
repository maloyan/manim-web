/**
 * FadeOut animation - fades a mobject from opaque to transparent.
 * Supports optional shift: the mobject slides in the shift direction
 * while fading out.
 */

import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

export class FadeOut extends Animation {
  private _initialOpacity: number = 1;
  private _shift: [number, number, number] | null;
  private _startX: number = 0;
  private _startY: number = 0;
  private _startZ: number = 0;
  private _endX: number = 0;
  private _endY: number = 0;
  private _endZ: number = 0;

  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    super(mobject, options);
    this.remover = true;
    this._shift = options.shift ?? null;
  }

  /**
   * Set up the animation - store initial opacity and position
   */
  override begin(): void {
    super.begin();
    this._initialOpacity = this.mobject.opacity;

    // Store start position
    this._startX = this.mobject.position.x;
    this._startY = this.mobject.position.y;
    this._startZ = this.mobject.position.z;

    // Compute end position (start + shift)
    if (this._shift) {
      this._endX = this._startX + this._shift[0];
      this._endY = this._startY + this._shift[1];
      this._endZ = this._startZ + this._shift[2];
    }
  }

  /**
   * Interpolate opacity from initial to 0 and position from start to end
   */
  interpolate(alpha: number): void {
    this.mobject.opacity = this._initialOpacity * (1 - alpha);

    if (this._shift) {
      this.mobject.position.set(
        this._startX + (this._endX - this._startX) * alpha,
        this._startY + (this._endY - this._startY) * alpha,
        this._startZ + (this._endZ - this._startZ) * alpha,
      );
    }
  }

  /**
   * Ensure the mobject is fully transparent at the end
   */
  override finish(): void {
    this.mobject.opacity = 0;
    if (this._shift) {
      this.mobject.position.set(this._endX, this._endY, this._endZ);
    }
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
