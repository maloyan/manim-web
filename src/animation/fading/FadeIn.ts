/**
 * FadeIn animation - fades a mobject from transparent to opaque.
 * Supports optional shift: the mobject starts displaced by `shift`
 * and slides to its target position while fading in.
 */

import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

export class FadeIn extends Animation {
  private _shift: [number, number, number] | null;
  private _startX: number = 0;
  private _startY: number = 0;
  private _startZ: number = 0;
  private _targetX: number = 0;
  private _targetY: number = 0;
  private _targetZ: number = 0;

  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    super(mobject, options);
    this._shift = options.shift ?? null;
  }

  /**
   * Set up the animation - start with opacity 0 and optional position shift
   */
  override begin(): void {
    super.begin();

    // Store the target (final) position
    this._targetX = this.mobject.position.x;
    this._targetY = this.mobject.position.y;
    this._targetZ = this.mobject.position.z;

    // Start fully transparent
    this.mobject.opacity = 0;

    // Apply shift: start at target - shift, animate towards target
    // (matches Python Manim: mobject starts displaced opposite to shift direction)
    if (this._shift) {
      this._startX = this._targetX - this._shift[0];
      this._startY = this._targetY - this._shift[1];
      this._startZ = this._targetZ - this._shift[2];
      this.mobject.position.set(this._startX, this._startY, this._startZ);
    }
  }

  /**
   * Interpolate opacity from 0 to 1 and position from start to target
   */
  interpolate(alpha: number): void {
    this.mobject.opacity = alpha;

    if (this._shift) {
      this.mobject.position.set(
        this._startX + (this._targetX - this._startX) * alpha,
        this._startY + (this._targetY - this._startY) * alpha,
        this._startZ + (this._targetZ - this._startZ) * alpha,
      );
    }
  }

  /**
   * Ensure the mobject is fully visible and at target position
   */
  override finish(): void {
    this.mobject.opacity = 1;
    if (this._shift) {
      this.mobject.position.set(this._targetX, this._targetY, this._targetZ);
    }
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
