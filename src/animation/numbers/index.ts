/**
 * Number-related animations for animating DecimalNumber values.
 *
 * This module provides animations specifically designed for DecimalNumber mobjects,
 * allowing smooth value transitions with proper formatting updates.
 */

import { Animation, AnimationOptions } from '../Animation';
import { DecimalNumber } from '../../mobjects/text/DecimalNumber';

/**
 * Options for ChangingDecimal animation
 */
export interface ChangingDecimalOptions extends AnimationOptions {
  /** Starting value (default: current DecimalNumber value) */
  startValue?: number;
  /** Ending value (required) */
  endValue: number;
  /** Whether to suspend updating the DecimalNumber display during animation (default: false) */
  suspendMobjectUpdating?: boolean;
}

/**
 * ChangingDecimal - Animate a DecimalNumber's value changing from start to end.
 *
 * This animation smoothly interpolates between two numeric values, updating
 * the DecimalNumber's display on each frame. The number formatting (decimal places,
 * sign, commas) is preserved throughout the animation.
 *
 * @example
 * ```typescript
 * // Create a decimal number starting at 0
 * const num = new DecimalNumber({ value: 0, numDecimalPlaces: 2 });
 *
 * // Animate from 0 to 100
 * timeline.add(new ChangingDecimal(num, { endValue: 100 }));
 *
 * // Animate from a specific start value
 * timeline.add(new ChangingDecimal(num, {
 *   startValue: 50,
 *   endValue: 200,
 *   duration: 2
 * }));
 * ```
 */
export class ChangingDecimal extends Animation {
  /** The DecimalNumber being animated */
  readonly decimalNumber: DecimalNumber;

  /** Starting value for the animation */
  private _startValue: number;

  /** Ending value for the animation */
  private _endValue: number;

  /** Whether to suspend mobject updating during animation */
  private _suspendMobjectUpdating: boolean;

  constructor(decimalNumber: DecimalNumber, options: ChangingDecimalOptions) {
    super(decimalNumber, options);

    this.decimalNumber = decimalNumber;
    this._startValue = options.startValue ?? decimalNumber.getValue();
    this._endValue = options.endValue;
    this._suspendMobjectUpdating = options.suspendMobjectUpdating ?? false;
  }

  /**
   * Called when the animation starts.
   * Captures the current value if no explicit start value was provided.
   */
  override begin(): void {
    super.begin();
    // If no explicit start value was provided, use current value at animation start
    if (this._startValue === undefined) {
      this._startValue = this.decimalNumber.getValue();
    }
  }

  /**
   * Interpolate the decimal value at the given alpha.
   * @param alpha - Progress from 0 (start) to 1 (end), after rate function applied
   */
  interpolate(alpha: number): void {
    if (this._suspendMobjectUpdating) {
      return;
    }

    const currentValue = this._startValue + (this._endValue - this._startValue) * alpha;
    this.decimalNumber.setValue(currentValue);
  }

  /**
   * Called when the animation ends.
   * Ensures the final value is set exactly.
   */
  override finish(): void {
    // Ensure we end at exactly the target value
    this.decimalNumber.setValue(this._endValue);
    super.finish();
  }

  /**
   * Get the start value of the animation
   */
  getStartValue(): number {
    return this._startValue;
  }

  /**
   * Get the end value of the animation
   */
  getEndValue(): number {
    return this._endValue;
  }
}

/**
 * Options for ChangeDecimalToValue animation
 */
export interface ChangeDecimalToValueOptions extends AnimationOptions {
  /** Target value to animate to (required) */
  targetValue: number;
  /** Whether to suspend updating the DecimalNumber display during animation (default: false) */
  suspendMobjectUpdating?: boolean;
}

/**
 * ChangeDecimalToValue - Animate a DecimalNumber to a specific target value.
 *
 * This is a convenience animation that automatically uses the DecimalNumber's
 * current value as the starting point. It's equivalent to ChangingDecimal
 * with startValue set to the current value.
 *
 * @example
 * ```typescript
 * // Create a decimal number at 42
 * const num = new DecimalNumber({ value: 42 });
 *
 * // Animate to 100 (starts from current value 42)
 * timeline.add(new ChangeDecimalToValue(num, { targetValue: 100 }));
 *
 * // With custom duration and rate function
 * timeline.add(new ChangeDecimalToValue(num, {
 *   targetValue: 0,
 *   duration: 2,
 *   rateFunc: easeInOut
 * }));
 * ```
 */
export class ChangeDecimalToValue extends Animation {
  /** The DecimalNumber being animated */
  readonly decimalNumber: DecimalNumber;

  /** Starting value (captured at animation begin) */
  private _startValue: number;

  /** Target value for the animation */
  private _targetValue: number;

  /** Whether to suspend mobject updating during animation */
  private _suspendMobjectUpdating: boolean;

  constructor(decimalNumber: DecimalNumber, options: ChangeDecimalToValueOptions) {
    super(decimalNumber, options);

    this.decimalNumber = decimalNumber;
    this._startValue = decimalNumber.getValue();
    this._targetValue = options.targetValue;
    this._suspendMobjectUpdating = options.suspendMobjectUpdating ?? false;
  }

  /**
   * Called when the animation starts.
   * Captures the current value as the starting point.
   */
  override begin(): void {
    super.begin();
    // Capture current value at animation start time
    this._startValue = this.decimalNumber.getValue();
  }

  /**
   * Interpolate the decimal value at the given alpha.
   * @param alpha - Progress from 0 (start) to 1 (end), after rate function applied
   */
  interpolate(alpha: number): void {
    if (this._suspendMobjectUpdating) {
      return;
    }

    const currentValue = this._startValue + (this._targetValue - this._startValue) * alpha;
    this.decimalNumber.setValue(currentValue);
  }

  /**
   * Called when the animation ends.
   * Ensures the final value is set exactly.
   */
  override finish(): void {
    // Ensure we end at exactly the target value
    this.decimalNumber.setValue(this._targetValue);
    super.finish();
  }

  /**
   * Get the start value of the animation
   */
  getStartValue(): number {
    return this._startValue;
  }

  /**
   * Get the target value of the animation
   */
  getTargetValue(): number {
    return this._targetValue;
  }
}

/**
 * Factory function to create a ChangingDecimal animation.
 * @param decimalNumber - The DecimalNumber to animate
 * @param options - Animation options including start and end values
 * @returns A new ChangingDecimal animation
 */
export function changingDecimal(
  decimalNumber: DecimalNumber,
  options: ChangingDecimalOptions
): ChangingDecimal {
  return new ChangingDecimal(decimalNumber, options);
}

/**
 * Factory function to create a ChangeDecimalToValue animation.
 * @param decimalNumber - The DecimalNumber to animate
 * @param options - Animation options including target value
 * @returns A new ChangeDecimalToValue animation
 */
export function changeDecimalToValue(
  decimalNumber: DecimalNumber,
  options: ChangeDecimalToValueOptions
): ChangeDecimalToValue {
  return new ChangeDecimalToValue(decimalNumber, options);
}

export default ChangingDecimal;
