/**
 * Special Transform animations for manimweb.
 * Includes ScaleInPlace, ShrinkToCenter, Restore, FadeToColor, and TransformAnimations.
 */

import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { Transform } from './Transform';
import { lerp, lerpPoint } from '../../utils/math';

// ============================================================================
// ScaleInPlace
// ============================================================================

export interface ScaleInPlaceOptions extends AnimationOptions {
  /** Scale factor */
  scaleFactor: number;
}

/**
 * ScaleInPlace animation - scales a mobject without moving its center.
 * Unlike regular scale which might affect position, this keeps center fixed.
 */
export class ScaleInPlace extends Animation {
  /** Scale factor */
  readonly scaleFactor: number;

  /** Initial scale */
  private _initialScale: THREE.Vector3 = new THREE.Vector3();

  /** Target scale */
  private _targetScale: THREE.Vector3 = new THREE.Vector3();

  /** Center position to maintain */
  private _center: Vector3Tuple = [0, 0, 0];

  constructor(mobject: Mobject, options: ScaleInPlaceOptions) {
    super(mobject, options);
    this.scaleFactor = options.scaleFactor;
  }

  override begin(): void {
    super.begin();

    this._initialScale.copy(this.mobject.scaleVector);
    this._targetScale.set(
      this._initialScale.x * this.scaleFactor,
      this._initialScale.y * this.scaleFactor,
      this._initialScale.z * this.scaleFactor,
    );
    this._center = this.mobject.getCenter();
  }

  interpolate(alpha: number): void {
    // Interpolate scale
    this.mobject.scaleVector.lerpVectors(this._initialScale, this._targetScale, alpha);

    // Ensure center stays fixed (adjust position if needed)
    const currentCenter = this.mobject.getCenter();
    const offset: Vector3Tuple = [
      this._center[0] - currentCenter[0],
      this._center[1] - currentCenter[1],
      this._center[2] - currentCenter[2],
    ];
    this.mobject.shift(offset);

    this.mobject._markDirty();
  }

  override finish(): void {
    // Must call interpolate(1) instead of setting scaleVector directly,
    // because interpolate also applies the center correction shift.
    this.interpolate(1.0);
    super.finish();
  }
}

/**
 * Create a ScaleInPlace animation.
 * @param mobject The mobject to scale
 * @param scaleFactor Scale factor
 * @param options Animation options
 */
export function scaleInPlace(
  mobject: Mobject,
  scaleFactor: number,
  options?: Omit<ScaleInPlaceOptions, 'scaleFactor'>,
): ScaleInPlace {
  return new ScaleInPlace(mobject, { ...options, scaleFactor });
}

// ============================================================================
// ShrinkToCenter
// ============================================================================

export type ShrinkToCenterOptions = AnimationOptions;

/**
 * ShrinkToCenter animation - shrinks a mobject to its center point.
 * The mobject scales down to zero while staying centered.
 */
export class ShrinkToCenter extends Animation {
  /** Initial scale */
  private _initialScale: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: ShrinkToCenterOptions = {}) {
    super(mobject, options);
  }

  override begin(): void {
    super.begin();
    this._initialScale.copy(this.mobject.scaleVector);
  }

  interpolate(alpha: number): void {
    const scale = 1 - alpha;
    this.mobject.scaleVector.set(
      this._initialScale.x * scale,
      this._initialScale.y * scale,
      this._initialScale.z * scale,
    );
    this.mobject._markDirty();
  }

  override finish(): void {
    this.mobject.scaleVector.set(0, 0, 0);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a ShrinkToCenter animation.
 * @param mobject The mobject to shrink
 * @param options Animation options
 */
export function shrinkToCenter(mobject: Mobject, options?: ShrinkToCenterOptions): ShrinkToCenter {
  return new ShrinkToCenter(mobject, options);
}

// ============================================================================
// Restore
// ============================================================================

/**
 * Interface for mobjects that support saved state
 */
export interface MobjectWithSavedState extends VMobject {
  savedState: VMobject | null;
}

export type RestoreOptions = AnimationOptions;

/**
 * Restore animation - restores a mobject to its saved state.
 * The mobject must have a savedState property set beforehand.
 */
export class Restore extends Transform {
  constructor(mobject: MobjectWithSavedState, options: RestoreOptions = {}) {
    if (!mobject.savedState) {
      throw new Error(
        'Restore requires mobject.savedState to be set. Use mobject.saveState() first.',
      );
    }
    super(mobject, mobject.savedState, options);
  }
}

/**
 * Create a Restore animation.
 * @param mobject The mobject to restore (must have savedState)
 * @param options Animation options
 */
export function restore(mobject: MobjectWithSavedState, options?: RestoreOptions): Restore {
  return new Restore(mobject, options);
}

// ============================================================================
// FadeToColor
// ============================================================================

export interface FadeToColorOptions extends AnimationOptions {
  /** Target color */
  color: string;
}

/**
 * FadeToColor animation - animates a color change on a mobject.
 * The color smoothly transitions from current to target.
 */
export class FadeToColor extends Animation {
  /** Target color */
  readonly targetColor: string;

  /** Starting color as THREE.Color */
  private _startColor: THREE.Color = new THREE.Color();

  /** Target color as THREE.Color */
  private _targetColorObj: THREE.Color = new THREE.Color();

  constructor(mobject: Mobject, options: FadeToColorOptions) {
    super(mobject, options);
    this.targetColor = options.color;
  }

  override begin(): void {
    super.begin();
    this._startColor.set(this.mobject.color);
    this._targetColorObj.set(this.targetColor);
  }

  interpolate(alpha: number): void {
    const color = new THREE.Color().lerpColors(this._startColor, this._targetColorObj, alpha);
    this.mobject.color = '#' + color.getHexString();
    this.mobject._markDirty();
  }

  override finish(): void {
    this.mobject.color = this.targetColor;
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a FadeToColor animation.
 * @param mobject The mobject to recolor
 * @param color Target color (CSS color string)
 * @param options Animation options
 */
export function fadeToColor(
  mobject: Mobject,
  color: string,
  options?: Omit<FadeToColorOptions, 'color'>,
): FadeToColor {
  return new FadeToColor(mobject, { ...options, color });
}

// ============================================================================
// TransformAnimations (Meta-Animation)
// ============================================================================

export interface TransformAnimationsOptions extends AnimationOptions {
  /** Rate function for the meta-animation interpolation */
  transformRateFunc?: (t: number) => number;
}

/**
 * TransformAnimations - A meta-animation that transforms one animation into another
 *
 * This is a higher-order animation that interpolates between the effects of two
 * different animations. It runs both animations internally and blends their results.
 *
 * At alpha=0, the mobject shows the state from animation1
 * At alpha=1, the mobject shows the state from animation2
 * In between, it blends the two states
 *
 * @example
 * ```typescript
 * import { Circle, Transform, FadeIn, TransformAnimations } from 'manimweb';
 *
 * const circle = new Circle({ radius: 1 });
 * const target = new Square({ sideLength: 2 });
 *
 * // Create two animations
 * const anim1 = new Transform(circle, target);
 * const anim2 = new FadeIn(circle);
 *
 * // Meta-animation that transitions between the effects of the two animations
 * const metaAnim = new TransformAnimations(anim1, anim2, { duration: 2 });
 * ```
 */
export class TransformAnimations extends Animation {
  /** The first animation (source animation) */
  readonly animation1: Animation;

  /** The second animation (target animation) */
  readonly animation2: Animation;

  /** Optional rate function for the transform interpolation */
  readonly transformRateFunc: (t: number) => number;

  /** Stored state from animation2 at various points */
  private _anim2StartPoints: number[][] = [];
  private _anim2EndPoints: number[][] = [];

  /** Original mobject state before any animation */
  private _originalPoints: number[][] = [];

  /** Original style values */
  private _originalOpacity: number = 1;
  private _originalFillOpacity: number = 0;

  constructor(
    animation1: Animation,
    animation2: Animation,
    options: TransformAnimationsOptions = {},
  ) {
    // Use the mobject from animation1 as the primary mobject
    super(animation1.mobject, options);
    this.animation1 = animation1;
    this.animation2 = animation2;
    this.transformRateFunc = options.transformRateFunc ?? ((t: number) => t);
  }

  override begin(): void {
    super.begin();

    const vmobject = this.mobject as VMobject;
    const anim1Mobject = this.animation1.mobject as VMobject;
    const anim2Mobject = this.animation2.mobject as VMobject;

    // Store original state
    this._originalPoints = vmobject.getLocalPoints();
    this._originalOpacity = vmobject.opacity;
    this._originalFillOpacity = vmobject.fillOpacity;

    // Initialize animation1 and capture its start and end states
    anim1Mobject.setPoints([...this._originalPoints]);
    anim1Mobject.opacity = this._originalOpacity;
    anim1Mobject.fillOpacity = this._originalFillOpacity;
    this.animation1.begin();

    // Run animation1 to end and capture end state
    this.animation1.interpolate(1);

    // Reset animation1 mobject
    anim1Mobject.setPoints([...this._originalPoints]);
    anim1Mobject.opacity = this._originalOpacity;
    anim1Mobject.fillOpacity = this._originalFillOpacity;

    // Initialize animation2 and capture its states
    this._anim2StartPoints = anim2Mobject.getLocalPoints();
    this.animation2.begin();

    // Run animation2 to end
    this.animation2.interpolate(1);
    this._anim2EndPoints = anim2Mobject.getLocalPoints();

    // Reset animation2
    anim2Mobject.setPoints(this._anim2StartPoints);

    // Reset mobject to original
    vmobject.setPoints([...this._originalPoints]);
    vmobject.opacity = this._originalOpacity;
    vmobject.fillOpacity = this._originalFillOpacity;
  }

  interpolate(alpha: number): void {
    const vmobject = this.mobject as VMobject;
    const anim1Mobject = this.animation1.mobject as VMobject;
    const anim2Mobject = this.animation2.mobject as VMobject;

    // Apply transform rate function
    const transformAlpha = this.transformRateFunc(alpha);

    // Run animation1 at current alpha
    anim1Mobject.setPoints([...this._originalPoints]);
    anim1Mobject.opacity = this._originalOpacity;
    this.animation1.interpolate(alpha);
    const anim1Points = anim1Mobject.getLocalPoints();
    const anim1Opacity = anim1Mobject.opacity;

    // Run animation2 at current alpha
    anim2Mobject.setPoints(this._anim2StartPoints);
    this.animation2.interpolate(alpha);
    const anim2Points = anim2Mobject.getLocalPoints();
    const anim2Opacity = anim2Mobject.opacity;

    // Blend between animation1 and animation2 results based on transformAlpha
    const blendedPoints: number[][] = [];
    const minLen = Math.min(anim1Points.length, anim2Points.length);

    for (let i = 0; i < minLen; i++) {
      blendedPoints.push(lerpPoint(anim1Points[i], anim2Points[i], transformAlpha));
    }

    // If lengths differ, append remaining points from the longer array
    if (anim1Points.length > minLen) {
      for (let i = minLen; i < anim1Points.length; i++) {
        blendedPoints.push([...anim1Points[i]]);
      }
    } else if (anim2Points.length > minLen) {
      for (let i = minLen; i < anim2Points.length; i++) {
        blendedPoints.push([...anim2Points[i]]);
      }
    }

    vmobject.setPoints(blendedPoints);

    // Blend opacity
    vmobject.opacity = lerp(anim1Opacity, anim2Opacity, transformAlpha);
  }

  override finish(): void {
    // Finish with animation2's end state
    const vmobject = this.mobject as VMobject;
    const anim2Mobject = this.animation2.mobject as VMobject;

    vmobject.setPoints(this._anim2EndPoints);
    vmobject.opacity = anim2Mobject.opacity;

    this.animation1.finish();
    this.animation2.finish();

    super.finish();
  }
}

/**
 * Create a TransformAnimations meta-animation.
 * This animation interpolates between the effects of two different animations.
 *
 * @param animation1 The first animation (source)
 * @param animation2 The second animation (target)
 * @param options Animation options
 */
export function transformAnimations(
  animation1: Animation,
  animation2: Animation,
  options?: TransformAnimationsOptions,
): TransformAnimations {
  return new TransformAnimations(animation1, animation2, options);
}
