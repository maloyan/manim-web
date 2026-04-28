/**
 * Fade-type Transform animations for manimweb.
 * Includes FadeTransform, FadeTransformPieces, and TransformFromCopy.
 */

import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { Transform } from './Transform';
import { lerpPoint } from '../../utils/math';
import { alignVmobjectPair } from './TransformPairing';

// ============================================================================
// FadeTransform
// ============================================================================

export interface FadeTransformOptions extends AnimationOptions {
  /** Stretch factor for fading effect */
  stretchFactor?: number;
}

/**
 * FadeTransform animation - transforms with a fade effect.
 * The source fades out while morphing to the target, which fades in.
 */
export class FadeTransform extends Animation {
  /** The target mobject to transform into */
  readonly target: VMobject;

  /** Stretch factor for the fade */
  readonly stretchFactor: number;

  /** Copy of the starting points */
  private _startPoints: number[][] = [];

  /** Copy of the target points */
  private _targetPoints: number[][] = [];

  /** Starting opacity */
  private _startOpacity: number = 1;

  /** Target opacity */
  private _targetOpacity: number = 1;

  /** Transform-time subpath lengths override for compound paths */
  private _alignedSubpathLengths?: number[];

  constructor(mobject: VMobject, target: VMobject, options: FadeTransformOptions = {}) {
    super(mobject, options);
    this.target = target;
    this.stretchFactor = options.stretchFactor ?? 2;
  }

  override begin(): void {
    super.begin();

    const vmobject = this.mobject as VMobject;

    const aligned = alignVmobjectPair(vmobject, this.target);
    this._startPoints = aligned.startPoints;
    this._targetPoints = aligned.targetPoints;
    this._alignedSubpathLengths = aligned.alignedSubpathLengths;
    this._startOpacity = vmobject.opacity;
    this._targetOpacity = this.target.opacity;

    vmobject.setPoints(this._startPoints);
    vmobject.setTransformSubpathLengths(this._alignedSubpathLengths);
  }

  interpolate(alpha: number): void {
    const vmobject = this.mobject as VMobject;

    // Interpolate points
    const interpolatedPoints: number[][] = [];
    for (let i = 0; i < this._startPoints.length; i++) {
      interpolatedPoints.push(lerpPoint(this._startPoints[i], this._targetPoints[i], alpha));
    }
    vmobject.setPoints(interpolatedPoints);

    // Fade effect: fade out in first half, fade in in second half
    if (alpha < 0.5) {
      // Fading out
      vmobject.opacity = this._startOpacity * (1 - 2 * alpha);
    } else {
      // Fading in
      vmobject.opacity = this._targetOpacity * (2 * alpha - 1);
    }
  }

  override finish(): void {
    const vmobject = this.mobject as VMobject;
    vmobject.setPoints(this._targetPoints);
    vmobject.setTransformSubpathLengths(undefined);
    vmobject.opacity = this._targetOpacity;
    vmobject.color = this.target.color;
    super.finish();
  }
}

/**
 * Create a FadeTransform animation.
 * @param mobject The VMobject to transform
 * @param target The target VMobject
 * @param options Animation options
 */
export function fadeTransform(
  mobject: VMobject,
  target: VMobject,
  options?: FadeTransformOptions,
): FadeTransform {
  return new FadeTransform(mobject, target, options);
}

// ============================================================================
// FadeTransformPieces
// ============================================================================

export type FadeTransformPiecesOptions = AnimationOptions;

/**
 * FadeTransformPieces animation - transforms pieces (submobjects) with fade effect.
 * Each submobject fades and transforms independently.
 */
export class FadeTransformPieces extends Animation {
  /** The target mobject to transform into */
  readonly target: VMobject;

  /** Starting state for each piece */
  private _pieceStates: Array<{
    startPoints: number[][];
    targetPoints: number[][];
    startOpacity: number;
    targetOpacity: number;
    alignedSubpathLengths?: number[];
  }> = [];

  constructor(mobject: VMobject, target: VMobject, options: FadeTransformPiecesOptions = {}) {
    super(mobject, options);
    this.target = target;
  }

  override begin(): void {
    super.begin();

    const source = this.mobject as VMobject;
    const sourceChildren = source.children as VMobject[];
    const targetChildren = this.target.children as VMobject[];

    // Handle case where we have submobjects
    if (sourceChildren.length > 0 && targetChildren.length > 0) {
      const maxLen = Math.max(sourceChildren.length, targetChildren.length);

      for (let i = 0; i < maxLen; i++) {
        const srcChild = sourceChildren[Math.min(i, sourceChildren.length - 1)] as VMobject;
        const tgtChild = targetChildren[Math.min(i, targetChildren.length - 1)] as VMobject;

        const aligned = alignVmobjectPair(srcChild, tgtChild);
        this._pieceStates.push({
          startPoints: aligned.startPoints,
          targetPoints: aligned.targetPoints,
          startOpacity: srcChild.opacity,
          targetOpacity: tgtChild.opacity,
          alignedSubpathLengths: aligned.alignedSubpathLengths,
        });
      }
    } else {
      // No submobjects, treat as single piece
      const aligned = alignVmobjectPair(source, this.target);
      this._pieceStates.push({
        startPoints: aligned.startPoints,
        targetPoints: aligned.targetPoints,
        startOpacity: source.opacity,
        targetOpacity: this.target.opacity,
        alignedSubpathLengths: aligned.alignedSubpathLengths,
      });
    }
  }

  interpolate(alpha: number): void {
    const source = this.mobject as VMobject;
    const sourceChildren = source.children as VMobject[];

    if (sourceChildren.length > 0 && this._pieceStates.length > 0) {
      for (let i = 0; i < sourceChildren.length; i++) {
        const child = sourceChildren[i] as VMobject;
        const state = this._pieceStates[Math.min(i, this._pieceStates.length - 1)];

        const points: number[][] = [];
        for (let j = 0; j < state.startPoints.length; j++) {
          points.push(lerpPoint(state.startPoints[j], state.targetPoints[j], alpha));
        }
        child.setPoints(points);
        child.setTransformSubpathLengths(state.alignedSubpathLengths);

        // Fade effect
        if (alpha < 0.5) {
          child.opacity = state.startOpacity * (1 - 2 * alpha);
        } else {
          child.opacity = state.targetOpacity * (2 * alpha - 1);
        }
      }
    } else if (this._pieceStates.length > 0) {
      // Single piece
      const state = this._pieceStates[0];
      const points: number[][] = [];
      for (let j = 0; j < state.startPoints.length; j++) {
        points.push(lerpPoint(state.startPoints[j], state.targetPoints[j], alpha));
      }
      source.setPoints(points);
      source.setTransformSubpathLengths(state.alignedSubpathLengths);

      if (alpha < 0.5) {
        source.opacity = state.startOpacity * (1 - 2 * alpha);
      } else {
        source.opacity = state.targetOpacity * (2 * alpha - 1);
      }
    }
  }

  override finish(): void {
    const source = this.mobject as VMobject;
    const sourceChildren = source.children as VMobject[];

    if (sourceChildren.length > 0 && this._pieceStates.length > 0) {
      for (let i = 0; i < sourceChildren.length; i++) {
        const child = sourceChildren[i] as VMobject;
        const state = this._pieceStates[Math.min(i, this._pieceStates.length - 1)];
        child.setPoints(state.targetPoints);
        child.setTransformSubpathLengths(undefined);
        child.opacity = state.targetOpacity;
      }
    } else if (this._pieceStates.length > 0) {
      const state = this._pieceStates[0];
      source.setPoints(state.targetPoints);
      source.setTransformSubpathLengths(undefined);
      source.opacity = state.targetOpacity;
    }

    super.finish();
  }
}

/**
 * Create a FadeTransformPieces animation.
 * @param mobject The VMobject to transform
 * @param target The target VMobject
 * @param options Animation options
 */
export function fadeTransformPieces(
  mobject: VMobject,
  target: VMobject,
  options?: FadeTransformPiecesOptions,
): FadeTransformPieces {
  return new FadeTransformPieces(mobject, target, options);
}

// ============================================================================
// TransformFromCopy
// ============================================================================

export type TransformFromCopyOptions = AnimationOptions;

/**
 * TransformFromCopy animation - transforms from a copy of the source to target.
 * Useful when you want to show a transformation while keeping the original.
 */
export class TransformFromCopy extends Transform {
  /** The original source mobject (kept unchanged) */
  readonly originalSource: VMobject;

  constructor(source: VMobject, target: VMobject, options: TransformFromCopyOptions = {}) {
    // Create a copy of the source to animate
    const sourceCopy = source.copy() as VMobject;
    super(sourceCopy, target, options);
    this.originalSource = source;
  }
}

/**
 * Create a TransformFromCopy animation.
 * @param source The source VMobject (will be copied)
 * @param target The target VMobject
 * @param options Animation options
 */
export function transformFromCopy(
  source: VMobject,
  target: VMobject,
  options?: TransformFromCopyOptions,
): TransformFromCopy {
  return new TransformFromCopy(source, target, options);
}
