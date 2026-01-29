/**
 * Transform animation - morphs one mobject into another.
 * For VMobjects: interpolates points and style.
 * For non-VMobjects (e.g., MathTex): falls back to opacity cross-fade.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';

/**
 * Helper function for linear interpolation between two 3D points
 */
function lerpPoint(a: number[], b: number[], t: number): number[] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

export class Transform extends Animation {
  /** The target mobject to transform into */
  readonly target: Mobject;

  /** Copy of the starting points (point morphing mode) */
  private _startPoints: number[][] = [];

  /** Copy of the target points after alignment (point morphing mode) */
  private _targetPoints: number[][] = [];

  /** Per-submobject start/target points for family-level interpolation */
  private _startSubmobjectPoints: number[][][] = [];
  private _targetSubmobjectPoints: number[][][] = [];

  /** References to submobject VMobjects in the source family (excluding root) */
  private _submobjectRefs: VMobject[] = [];

  /** Starting style values */
  private _startOpacity: number = 1;
  private _targetOpacity: number = 1;
  private _startFillOpacity: number = 0;
  private _targetFillOpacity: number = 0;
  private _startStrokeWidth: number = 2;
  private _targetStrokeWidth: number = 2;

  /** Whether to use cross-fade instead of point morphing */
  private _useCrossFade: boolean = false;

  /** Original target opacity before cross-fade zeroes it */
  private _crossFadeTargetOpacity: number = 1;

  constructor(
    mobject: Mobject,
    target: Mobject,
    options: AnimationOptions = {}
  ) {
    super(mobject, options);
    this.target = target;
  }

  /**
   * Set up the animation - align points between mobject and target,
   * or set up cross-fade if either is not a VMobject.
   */
  override begin(): void {
    super.begin();

    const isSourceVM = this.mobject instanceof VMobject;
    const isTargetVM = this.target instanceof VMobject;

    if (isSourceVM && isTargetVM) {
      // Point-based morphing
      const vmobject = this.mobject as VMobject;
      const vtarget = this.target as VMobject;

      const startCopy = vmobject.copy() as VMobject;
      const targetCopy = vtarget.copy() as VMobject;

      // Align submobject hierarchy before point alignment
      this._alignDataAndFamily(startCopy, targetCopy);

      // Align root-level points
      startCopy.alignPoints(targetCopy);

      this._startPoints = startCopy.getPoints();
      this._targetPoints = targetCopy.getPoints();

      this._startOpacity = vmobject.opacity;
      this._targetOpacity = vtarget.opacity;
      this._startFillOpacity = vmobject.fillOpacity;
      this._targetFillOpacity = vtarget.fillOpacity;
      this._startStrokeWidth = vmobject.strokeWidth;
      this._targetStrokeWidth = vtarget.strokeWidth;

      vmobject.setPoints(this._startPoints);

      // Store per-submobject aligned points
      this._submobjectRefs = [];
      this._startSubmobjectPoints = [];
      this._targetSubmobjectPoints = [];
      const startChildren = startCopy.children as VMobject[];
      const targetChildren = targetCopy.children as VMobject[];
      const sourceChildren = vmobject.children as VMobject[];
      for (let i = 0; i < startChildren.length; i++) {
        if (startChildren[i] instanceof VMobject && targetChildren[i] instanceof VMobject) {
          const sc = startChildren[i];
          const tc = targetChildren[i];
          sc.alignPoints(tc);
          this._startSubmobjectPoints.push(sc.getPoints());
          this._targetSubmobjectPoints.push(tc.getPoints());
          // Ensure source mobject has enough children
          if (i < sourceChildren.length && sourceChildren[i] instanceof VMobject) {
            this._submobjectRefs.push(sourceChildren[i]);
            sourceChildren[i].setPoints(sc.getPoints());
          } else {
            // Pad source with empty VMobject child
            const pad = new VMobject();
            pad.setPoints(sc.getPoints());
            pad.setOpacity(0);
            vmobject.add(pad);
            this._submobjectRefs.push(pad);
          }
        }
      }
    } else {
      // Cross-fade for non-VMobject transforms (e.g., Text → MathTex)
      this._useCrossFade = true;
      this._startOpacity = this.mobject.opacity;
      this._crossFadeTargetOpacity = this.target.opacity;

      // Add target to the Three.js scene graph so it renders
      const sourceObj = this.mobject.getThreeObject();
      const targetObj = this.target.getThreeObject();
      if (sourceObj.parent && !targetObj.parent) {
        sourceObj.parent.add(targetObj);
      }

      // Start target invisible
      this.target.setOpacity(0);
      this.target._syncToThree();
    }
  }

  /**
   * Interpolate between start and target at the given alpha
   */
  interpolate(alpha: number): void {
    if (this._useCrossFade) {
      // Cross-fade: source fades out, target fades in
      this.mobject.setOpacity(this._startOpacity * (1 - alpha));
      this.target.setOpacity(this._crossFadeTargetOpacity * alpha);
      // Target is not in Scene._mobjects, so sync manually
      this.target._syncToThree();
      return;
    }

    // Point-based morphing
    const vmobject = this.mobject as VMobject;

    const interpolatedPoints: number[][] = [];
    for (let i = 0; i < this._startPoints.length; i++) {
      interpolatedPoints.push(lerpPoint(this._startPoints[i], this._targetPoints[i], alpha));
    }
    vmobject.setPoints(interpolatedPoints);

    vmobject.opacity =
      this._startOpacity + (this._targetOpacity - this._startOpacity) * alpha;

    vmobject.fillOpacity =
      this._startFillOpacity + (this._targetFillOpacity - this._startFillOpacity) * alpha;

    vmobject.strokeWidth =
      this._startStrokeWidth + (this._targetStrokeWidth - this._startStrokeWidth) * alpha;

    // Interpolate submobject points
    for (let s = 0; s < this._submobjectRefs.length; s++) {
      const sub = this._submobjectRefs[s];
      const startPts = this._startSubmobjectPoints[s];
      const targetPts = this._targetSubmobjectPoints[s];
      const pts: number[][] = [];
      for (let i = 0; i < startPts.length; i++) {
        pts.push(lerpPoint(startPts[i], targetPts[i], alpha));
      }
      sub.setPoints(pts);
    }
  }

  /**
   * Ensure the mobject matches the target at the end
   */
  override finish(): void {
    if (this._useCrossFade) {
      this.mobject.setOpacity(0);
      this.target.setOpacity(this._crossFadeTargetOpacity);
      this.target._syncToThree();

      // Reparent target Three.js object under source so that if the source
      // is later removed from the scene (e.g. via FadeOut), the cross-fade
      // target is cleaned up along with it.
      const sourceObj = this.mobject.getThreeObject();
      const targetObj = this.target.getThreeObject();
      const srcWorld = new THREE.Vector3();
      sourceObj.getWorldPosition(srcWorld);
      const tgtWorld = new THREE.Vector3();
      targetObj.getWorldPosition(tgtWorld);
      if (targetObj.parent) {
        targetObj.parent.remove(targetObj);
      }
      (sourceObj as THREE.Group).add(targetObj);
      // Adjust local position so target keeps its world position
      targetObj.position.set(
        tgtWorld.x - srcWorld.x,
        tgtWorld.y - srcWorld.y,
        tgtWorld.z - srcWorld.z
      );

      super.finish();
      return;
    }

    const vmobject = this.mobject as VMobject;
    vmobject.setPoints(this._targetPoints);
    vmobject.opacity = this._targetOpacity;
    vmobject.fillOpacity = this._targetFillOpacity;
    vmobject.strokeWidth = this._targetStrokeWidth;
    vmobject.color = this.target.color;

    // Set final submobject points
    for (let s = 0; s < this._submobjectRefs.length; s++) {
      this._submobjectRefs[s].setPoints(this._targetSubmobjectPoints[s]);
    }

    super.finish();
  }

  /**
   * Align submobject hierarchies between start and target copies.
   * Pads the one with fewer children with empty VMobjects so both have
   * the same number of children for pairwise interpolation.
   */
  private _alignDataAndFamily(start: VMobject, target: VMobject): void {
    const startCount = start.children.length;
    const targetCount = target.children.length;
    const maxCount = Math.max(startCount, targetCount);

    // Pad start with empty VMobjects
    while (start.children.length < maxCount) {
      const empty = new VMobject();
      empty.setOpacity(0);
      start.add(empty);
    }

    // Pad target with empty VMobjects
    while (target.children.length < maxCount) {
      const empty = new VMobject();
      empty.setOpacity(0);
      target.add(empty);
    }

    // Recursively align each pair of children
    for (let i = 0; i < maxCount; i++) {
      const sc = start.children[i];
      const tc = target.children[i];
      if (sc instanceof VMobject && tc instanceof VMobject) {
        this._alignDataAndFamily(sc, tc);
      }
    }
  }
}

/**
 * Create a Transform animation that morphs one mobject into another.
 * @param mobject The source mobject
 * @param target The target mobject to transform into
 * @param options Animation options (duration, rateFunc)
 */
export function transform(
  mobject: Mobject,
  target: Mobject,
  options?: AnimationOptions
): Transform {
  return new Transform(mobject, target, options);
}

/**
 * ReplacementTransform - like Transform, but replaces the mobject with the target
 * in the scene after the animation completes.
 */
export class ReplacementTransform extends Transform {
  constructor(
    mobject: Mobject,
    target: Mobject,
    options: AnimationOptions = {}
  ) {
    super(mobject, target, options);
  }

  /**
   * After finishing, the calling code should replace mobject with target in the scene.
   * This animation just handles the visual transition.
   */
  override finish(): void {
    super.finish();
    // The scene should handle the actual replacement
    // by removing mobject and adding target
  }
}

/**
 * Create a ReplacementTransform animation.
 */
export function replacementTransform(
  mobject: Mobject,
  target: Mobject,
  options?: AnimationOptions
): ReplacementTransform {
  return new ReplacementTransform(mobject, target, options);
}

/**
 * MoveToTarget animation - moves a mobject to its target copy.
 * The mobject must have a `.targetCopy` property set beforehand.
 */
export interface MobjectWithTarget extends VMobject {
  targetCopy?: VMobject;
}

export class MoveToTarget extends Transform {
  constructor(mobject: MobjectWithTarget, options: AnimationOptions = {}) {
    if (!mobject.targetCopy) {
      throw new Error(
        'MoveToTarget requires mobject.targetCopy to be set. Use mobject.generateTarget() first.'
      );
    }
    super(mobject, mobject.targetCopy, options);
  }
}

/**
 * Create a MoveToTarget animation.
 */
export function moveToTarget(
  mobject: MobjectWithTarget,
  options?: AnimationOptions
): MoveToTarget {
  return new MoveToTarget(mobject, options);
}
