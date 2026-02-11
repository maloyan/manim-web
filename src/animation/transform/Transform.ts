/**
 * Transform animation - morphs one mobject into another.
 * For VMobjects: interpolates points and style.
 * For non-VMobjects (e.g., MathTex): falls back to opacity cross-fade.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { lerpPoint } from '../../utils/math';

export class Transform extends Animation {
  /** The target mobject to transform into */
  readonly target: Mobject;

  /** Copy of the starting points (point morphing mode) */
  private _startPoints: number[][] = [];

  /** Copy of the target points after alignment (point morphing mode) */
  private _targetPoints: number[][] = [];

  /** Starting style values */
  private _startOpacity: number = 1;
  private _targetOpacity: number = 1;
  private _startFillOpacity: number = 0;
  private _targetFillOpacity: number = 0;
  private _startStrokeWidth: number = 2;
  private _targetStrokeWidth: number = 2;

  /** Starting and target colors for interpolation (stroke) */
  private _startColor: THREE.Color = new THREE.Color();
  private _targetColor: THREE.Color = new THREE.Color();
  private _interpolateColor: boolean = false;

  /** Starting and target fill colors for interpolation (separate from stroke) */
  private _startFillColor: THREE.Color = new THREE.Color();
  private _targetFillColor: THREE.Color = new THREE.Color();
  private _interpolateFillColor: boolean = false;

  /** Starting and target transform properties (position, rotation, scale) */
  private _startPosition: THREE.Vector3 = new THREE.Vector3();
  private _targetPosition: THREE.Vector3 = new THREE.Vector3();
  private _startRotation: THREE.Euler = new THREE.Euler();
  private _targetRotation: THREE.Euler = new THREE.Euler();
  private _startScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  private _targetScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

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
      const vmobject = this.mobject as VMobject;
      const vtarget = this.target as VMobject;

      // Text objects extend VMobject but render via canvas texture (no geometry
      // points).  Fall back to cross-fade when both VMobjects lack points.
      if (vmobject.getPoints().length === 0 && vtarget.getPoints().length === 0) {
        this._useCrossFade = true;
        this._startOpacity = this.mobject.opacity;
        this._crossFadeTargetOpacity = this.target.opacity;

        // Capture positions for interpolation during cross-fade
        this._startPosition.copy(vmobject.position);
        this._targetPosition.copy(vtarget.position);

        const sourceObj = this.mobject.getThreeObject();
        const targetObj = this.target.getThreeObject();
        if (sourceObj.parent && !targetObj.parent) {
          sourceObj.parent.add(targetObj);
        }

        this.target.setOpacity(0);
        this.target._syncToThree();
        return;
      }

      // Point-based morphing
      const startCopy = vmobject.copy() as VMobject;
      const targetCopy = vtarget.copy() as VMobject;

      startCopy.alignPoints(targetCopy);

      this._startPoints = startCopy.getPoints();
      this._targetPoints = targetCopy.getPoints();

      this._startOpacity = vmobject.opacity;
      this._targetOpacity = vtarget.opacity;
      this._startFillOpacity = vmobject.fillOpacity;
      this._targetFillOpacity = vtarget.fillOpacity;
      this._startStrokeWidth = vmobject.strokeWidth;
      this._targetStrokeWidth = vtarget.strokeWidth;

      // Capture stroke colors for interpolation
      this._startColor.set(vmobject.color);
      this._targetColor.set(vtarget.color);
      this._interpolateColor = vmobject.color !== vtarget.color;

      // Capture fill colors for interpolation (separate from stroke)
      const sourceFillColor = vmobject.fillColor || vmobject.color;
      const targetFillColor = vtarget.fillColor || vtarget.color;
      this._startFillColor.set(sourceFillColor);
      this._targetFillColor.set(targetFillColor);
      this._interpolateFillColor = sourceFillColor !== targetFillColor;

      // Capture transform properties (position, rotation, scale)
      this._startPosition.copy(vmobject.position);
      this._targetPosition.copy(vtarget.position);
      this._startRotation.copy(vmobject.rotation);
      this._targetRotation.copy(vtarget.rotation);
      this._startScale.copy(vmobject.scaleVector);
      this._targetScale.copy(vtarget.scaleVector);

      vmobject.setPoints(this._startPoints);
    } else {
      // Cross-fade for non-VMobject transforms (e.g., MathTex → MathTex)
      this._useCrossFade = true;
      this._startOpacity = this.mobject.opacity;
      this._crossFadeTargetOpacity = this.target.opacity;

      // Capture positions for interpolation during cross-fade
      this._startPosition.copy(this.mobject.position);
      this._targetPosition.copy(this.target.position);

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

      // Move source toward target position for a smooth transition
      this.mobject.position.lerpVectors(this._startPosition, this._targetPosition, alpha);
      this.mobject._markDirty();

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

    // Interpolate stroke color
    if (this._interpolateColor) {
      const lerpedColor = new THREE.Color().lerpColors(this._startColor, this._targetColor, alpha);
      vmobject.color = '#' + lerpedColor.getHexString();
    }

    // Interpolate fill color (separate from stroke)
    if (this._interpolateFillColor) {
      const lerpedFillColor = new THREE.Color().lerpColors(this._startFillColor, this._targetFillColor, alpha);
      vmobject.fillColor = '#' + lerpedFillColor.getHexString();
    }

    // Interpolate transform properties
    vmobject.position.lerpVectors(this._startPosition, this._targetPosition, alpha);
    // Euler doesn't have lerpVectors — interpolate each component
    vmobject.rotation.set(
      this._startRotation.x + (this._targetRotation.x - this._startRotation.x) * alpha,
      this._startRotation.y + (this._targetRotation.y - this._startRotation.y) * alpha,
      this._startRotation.z + (this._targetRotation.z - this._startRotation.z) * alpha,
    );
    vmobject.scaleVector.lerpVectors(this._startScale, this._targetScale, alpha);

    // Notify the mobject that its transform changed (needed for
    // Camera2DFrame to sync position/scale back to the Camera2D).
    vmobject._markDirty();
  }

  /**
   * Ensure the mobject matches the target at the end
   */
  override finish(): void {
    if (this._useCrossFade) {
      // Check if both source and target are Text objects with texture meshes
      const getTexMesh = (m: Mobject): THREE.Mesh | null => {
        const candidate = m as unknown as { getTextureMesh?: () => THREE.Mesh | null };
        return typeof candidate.getTextureMesh === 'function' ? candidate.getTextureMesh() : null;
      };
      const srcMesh = getTexMesh(this.mobject);
      const tgtMesh = getTexMesh(this.target);

      if (srcMesh && tgtMesh) {
        // Text→Text: swap texture/geometry so source visually becomes target.
        // This way FadeOut(source) correctly fades the visible text.
        const srcMat = srcMesh.material as THREE.MeshBasicMaterial;
        const tgtMat = tgtMesh.material as THREE.MeshBasicMaterial;
        srcMat.map = tgtMat.map;
        srcMat.needsUpdate = true;
        srcMesh.geometry.dispose();
        srcMesh.geometry = tgtMesh.geometry;

        // Position source at target location
        this.mobject.position.copy(this._targetPosition);
        this.mobject.setOpacity(this._crossFadeTargetOpacity);
        this.mobject._markDirty();

        // Remove target from scene graph
        const targetObj = this.target.getThreeObject();
        if (targetObj.parent) targetObj.parent.remove(targetObj);
      } else {
        // Non-Text cross-fade: reparent target under source
        this.mobject.setOpacity(0);
        this.target.setOpacity(this._crossFadeTargetOpacity);
        this.target._syncToThree();

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
        targetObj.position.set(
          tgtWorld.x - srcWorld.x,
          tgtWorld.y - srcWorld.y,
          tgtWorld.z - srcWorld.z
        );
      }

      super.finish();
      return;
    }

    const vmobject = this.mobject as VMobject;
    const vtarget = this.target as VMobject;
    vmobject.setPoints(this._targetPoints);
    vmobject.opacity = this._targetOpacity;
    vmobject.fillOpacity = this._targetFillOpacity;
    vmobject.strokeWidth = this._targetStrokeWidth;
    vmobject.color = this.target.color;

    // Apply final fill color if it was interpolated separately
    if (this._interpolateFillColor) {
      vmobject.fillColor = vtarget.fillColor || vtarget.color;
    }

    // Apply final transform properties
    vmobject.position.copy(this._targetPosition);
    vmobject.rotation.copy(this._targetRotation);
    vmobject.scaleVector.copy(this._targetScale);
    vmobject._markDirty();

    super.finish();
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
