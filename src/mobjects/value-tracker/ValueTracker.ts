/**
 * ValueTracker - A mobject that tracks a numerical value that can be animated.
 *
 * ValueTrackers are invisible mobjects that hold a value which can be smoothly
 * animated using the standard animation system. Other mobjects can use updaters
 * to respond to changes in the ValueTracker's value.
 *
 * @example
 * ```typescript
 * // Create a tracker starting at 0
 * const tracker = new ValueTracker(0);
 *
 * // Create a dot that follows the tracker value on a number line
 * const dot = new Dot();
 * dot.addUpdater((d) => {
 *   d.moveTo(numberLine.numberToPoint(tracker.getValue()));
 * });
 *
 * // Animate the tracker from 0 to 5
 * timeline.add(tracker.animateTo(5, { duration: 2 }));
 * ```
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../../animation/Animation';

/**
 * Animation that smoothly changes a ValueTracker's value.
 */
class ValueTrackerAnimation extends Animation {
  private _tracker: ValueTracker;
  private _startValue: number;
  private _endValue: number;

  constructor(
    tracker: ValueTracker,
    endValue: number,
    options?: AnimationOptions
  ) {
    super(tracker, options);
    this._tracker = tracker;
    this._startValue = tracker.getValue();
    this._endValue = endValue;
  }

  override begin(): void {
    super.begin();
    // Capture the current value as start value when animation begins
    this._startValue = this._tracker.getValue();
  }

  interpolate(alpha: number): void {
    const value = this._startValue + (this._endValue - this._startValue) * alpha;
    this._tracker.setValue(value);
  }
}

/**
 * Options for creating a ValueTracker
 */
export interface ValueTrackerOptions {
  /** Initial value (default: 0) */
  value?: number;
}

/**
 * ValueTracker - Tracks a numerical value that can be animated.
 *
 * This is an invisible mobject designed to hold a single numerical value
 * that can be smoothly animated. It's commonly used with updaters to
 * create dynamic animations where multiple mobjects respond to a single
 * changing value.
 */
export class ValueTracker extends Mobject {
  /** The tracked value */
  private _value: number;

  /**
   * Create a new ValueTracker.
   * @param value - Initial value (default: 0)
   */
  constructor(value?: number);
  constructor(options?: ValueTrackerOptions);
  constructor(valueOrOptions?: number | ValueTrackerOptions) {
    super();

    if (valueOrOptions === undefined) {
      this._value = 0;
    } else if (typeof valueOrOptions === 'number') {
      this._value = valueOrOptions;
    } else {
      this._value = valueOrOptions.value ?? 0;
    }
  }

  /**
   * Get the current value.
   * @returns The current tracked value
   */
  getValue(): number {
    return this._value;
  }

  /**
   * Set the value directly (without animation).
   * @param value - The new value
   * @returns this for chaining
   */
  setValue(value: number): this {
    if (this._value !== value) {
      this._value = value;
      this._markDirty();
    }
    return this;
  }

  /**
   * Increment the value by a given amount.
   * @param amount - The amount to add (can be negative)
   * @returns this for chaining
   */
  incrementValue(amount: number): this {
    return this.setValue(this._value + amount);
  }

  /**
   * Create an animation that smoothly changes the value.
   * @param targetValue - The value to animate to
   * @param options - Animation options (duration, rateFunc, etc.)
   * @returns An animation that can be added to a timeline
   *
   * @example
   * ```typescript
   * // Animate from current value to 10 over 2 seconds
   * timeline.add(tracker.animateTo(10, { duration: 2 }));
   *
   * // Animate with custom rate function
   * timeline.add(tracker.animateTo(5, {
   *   duration: 1.5,
   *   rateFunc: easeInOut
   * }));
   * ```
   */
  animateTo(targetValue: number, options?: AnimationOptions): Animation {
    return new ValueTrackerAnimation(this, targetValue, options);
  }

  /**
   * Alias for animateTo - matches Manim's API.
   * @param targetValue - The value to animate to
   * @param options - Animation options
   * @returns An animation
   */
  animate(targetValue: number, options?: AnimationOptions): Animation {
    return this.animateTo(targetValue, options);
  }

  /**
   * Get the center position (returns origin since this is invisible).
   * @returns [0, 0, 0]
   */
  override getCenter(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Create a copy of this ValueTracker.
   * @returns A new ValueTracker with the same value
   */
  protected override _createCopy(): ValueTracker {
    return new ValueTracker(this._value);
  }

  /**
   * Create an empty Three.js object (ValueTracker is invisible).
   * @returns An empty THREE.Group
   */
  protected override _createThreeObject(): THREE.Object3D {
    // ValueTracker is invisible - return an empty group
    return new THREE.Group();
  }
}

/**
 * Complex number representation
 */
export interface Complex {
  /** Real part */
  re: number;
  /** Imaginary part */
  im: number;
}

/**
 * Animation that smoothly changes a ComplexValueTracker's value.
 */
class ComplexValueTrackerAnimation extends Animation {
  private _tracker: ComplexValueTracker;
  private _startValue: Complex;
  private _endValue: Complex;

  constructor(
    tracker: ComplexValueTracker,
    endValue: Complex,
    options?: AnimationOptions
  ) {
    super(tracker, options);
    this._tracker = tracker;
    this._startValue = { ...tracker.getValue() };
    this._endValue = { ...endValue };
  }

  override begin(): void {
    super.begin();
    // Capture the current value as start value when animation begins
    this._startValue = { ...this._tracker.getValue() };
  }

  interpolate(alpha: number): void {
    const re = this._startValue.re + (this._endValue.re - this._startValue.re) * alpha;
    const im = this._startValue.im + (this._endValue.im - this._startValue.im) * alpha;
    this._tracker.setValue({ re, im });
  }
}

/**
 * Options for creating a ComplexValueTracker
 */
export interface ComplexValueTrackerOptions {
  /** Initial complex value */
  value?: Complex;
}

/**
 * ComplexValueTracker - Tracks a complex number that can be animated.
 *
 * Similar to ValueTracker but for complex numbers. The value is stored
 * as {re, im} representing the real and imaginary parts.
 *
 * @example
 * ```typescript
 * // Create a tracker at 1 + 2i
 * const tracker = new ComplexValueTracker({ re: 1, im: 2 });
 *
 * // Create a dot that visualizes the complex number
 * const dot = new Dot();
 * dot.addUpdater((d) => {
 *   const z = tracker.getValue();
 *   d.moveTo([z.re, z.im, 0]);
 * });
 *
 * // Animate to -1 + 0i
 * timeline.add(tracker.animateTo({ re: -1, im: 0 }, { duration: 2 }));
 * ```
 */
export class ComplexValueTracker extends Mobject {
  /** The tracked complex value */
  private _value: Complex;

  /**
   * Create a new ComplexValueTracker.
   * @param value - Initial complex value (default: { re: 0, im: 0 })
   */
  constructor(value?: Complex);
  constructor(options?: ComplexValueTrackerOptions);
  constructor(valueOrOptions?: Complex | ComplexValueTrackerOptions) {
    super();

    if (!valueOrOptions) {
      this._value = { re: 0, im: 0 };
    } else if ('re' in valueOrOptions && 'im' in valueOrOptions) {
      // It's a Complex value directly
      this._value = { ...valueOrOptions };
    } else {
      // It's ComplexValueTrackerOptions
      this._value = valueOrOptions.value ? { ...valueOrOptions.value } : { re: 0, im: 0 };
    }
  }

  /**
   * Get the current complex value.
   * @returns The current value as { re, im }
   */
  getValue(): Complex {
    return { ...this._value };
  }

  /**
   * Alias for getValue - returns the complex number.
   * @returns The current value as { re, im }
   */
  getComplex(): Complex {
    return this.getValue();
  }

  /**
   * Get the real part of the value.
   * @returns The real part
   */
  getReal(): number {
    return this._value.re;
  }

  /**
   * Get the imaginary part of the value.
   * @returns The imaginary part
   */
  getImaginary(): number {
    return this._value.im;
  }

  /**
   * Get the magnitude (absolute value) of the complex number.
   * @returns |z| = sqrt(re^2 + im^2)
   */
  getMagnitude(): number {
    return Math.sqrt(this._value.re * this._value.re + this._value.im * this._value.im);
  }

  /**
   * Get the argument (phase angle) of the complex number.
   * @returns The angle in radians
   */
  getArgument(): number {
    return Math.atan2(this._value.im, this._value.re);
  }

  /**
   * Set the value directly (without animation).
   * @param value - The new complex value
   * @returns this for chaining
   */
  setValue(value: Complex): this {
    if (this._value.re !== value.re || this._value.im !== value.im) {
      this._value = { ...value };
      this._markDirty();
    }
    return this;
  }

  /**
   * Set the value using polar coordinates.
   * @param r - Magnitude
   * @param theta - Angle in radians
   * @returns this for chaining
   */
  setFromPolar(r: number, theta: number): this {
    return this.setValue({
      re: r * Math.cos(theta),
      im: r * Math.sin(theta)
    });
  }

  /**
   * Increment the value by a given complex amount.
   * @param amount - The amount to add
   * @returns this for chaining
   */
  incrementValue(amount: Complex): this {
    return this.setValue({
      re: this._value.re + amount.re,
      im: this._value.im + amount.im
    });
  }

  /**
   * Create an animation that smoothly changes the complex value.
   * @param targetValue - The value to animate to
   * @param options - Animation options (duration, rateFunc, etc.)
   * @returns An animation that can be added to a timeline
   */
  animateTo(targetValue: Complex, options?: AnimationOptions): Animation {
    return new ComplexValueTrackerAnimation(this, targetValue, options);
  }

  /**
   * Alias for animateTo - matches Manim's API.
   * @param targetValue - The value to animate to
   * @param options - Animation options
   * @returns An animation
   */
  animate(targetValue: Complex, options?: AnimationOptions): Animation {
    return this.animateTo(targetValue, options);
  }

  /**
   * Get the center position (returns the complex number as a 2D point).
   * @returns [re, im, 0]
   */
  override getCenter(): Vector3Tuple {
    return [this._value.re + this.position.x, this._value.im + this.position.y, this.position.z];
  }

  /**
   * Create a copy of this ComplexValueTracker.
   * @returns A new ComplexValueTracker with the same value
   */
  protected override _createCopy(): ComplexValueTracker {
    return new ComplexValueTracker(this._value);
  }

  /**
   * Create an empty Three.js object (ComplexValueTracker is invisible).
   * @returns An empty THREE.Group
   */
  protected override _createThreeObject(): THREE.Object3D {
    // ComplexValueTracker is invisible - return an empty group
    return new THREE.Group();
  }
}

/**
 * Factory function to create a ValueTracker.
 * @param value - Initial value (default: 0)
 * @returns A new ValueTracker
 */
export function valueTracker(value: number = 0): ValueTracker {
  return new ValueTracker(value);
}

/**
 * Factory function to create a ComplexValueTracker.
 * @param value - Initial complex value (default: { re: 0, im: 0 })
 * @returns A new ComplexValueTracker
 */
export function complexValueTracker(value?: Complex): ComplexValueTracker {
  return new ComplexValueTracker(value);
}

export default ValueTracker;
