/**
 * Transform animation - morphs one mobject into another.
 * For VMobjects: interpolates points and style.
 * For VGroups: per-child point and style interpolation.
 * For non-VMobjects (e.g., MathTex): falls back to opacity cross-fade.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { Animation, AnimationOptions } from '../Animation';
import { lerpPoint } from '../../utils/math';
import { worldToParentLocalPosition } from '../../core/MobjectTraversal';
import { alignVmobjectPair, pairLeafSnapshotsByIndex } from './TransformPairing';

/** Extract style snapshot from a VMobject */
function captureStyle(m: VMobject): ChildStyle {
  return {
    opacity: m.opacity,
    fillOpacity: m.fillOpacity,
    strokeWidth: m.strokeWidth,
    color: m.color,
    fillColor: m.fillColor || m.color,
  };
}

/** Build a style with zero opacity (for fade-in / fade-out placeholders) */
function captureStyleFaded(m: VMobject): ChildStyle {
  return {
    opacity: 0,
    fillOpacity: 0,
    strokeWidth: m.strokeWidth,
    color: m.color,
    fillColor: m.fillColor || m.color,
  };
}

interface ChildStyle {
  opacity: number;
  fillOpacity: number;
  strokeWidth: number;
  color: string;
  fillColor: string;
}

interface VGroupLeafState {
  child: VMobject;
  startPoints: number[][];
  targetPoints: number[][];
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  finalTargetPoints: number[][];
  finalTargetSubpathLengths?: number[];
  startStyle: ChildStyle;
  targetStyle: ChildStyle;
  strokeColorPair: { start: THREE.Color; target: THREE.Color; interpolate: boolean };
  fillColorPair: { start: THREE.Color; target: THREE.Color; interpolate: boolean };
}

/** Reusable scratch color to avoid per-frame allocations in interpolate() */
const scratchColor = new THREE.Color();

export class Transform extends Animation {
  /** The target mobject to transform into */
  readonly target: Mobject;

  /** Copy of the starting points (point morphing mode) */
  private _startPoints: number[][] = [];

  /** Copy of the target points after alignment (point morphing mode) */
  private _targetPoints: number[][] = [];

  /** Original target points before alignment (used for exact final state) */
  private _finalTargetPoints: number[][] = [];

  /** Exact target subpath lengths to restore at finish() for final hole topology */
  private _finalTargetSubpathLengths?: number[];

  /** Transform-time aligned subpath lengths for single VMobject morphs */
  private _alignedSubpathLengths?: number[];

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

  /** Whether source and target are both VGroups (per-child interpolation) */
  private _isVGroupTransform: boolean = false;

  /** VGroup transform state per leaf-pair */
  private _vgroupLeafStates: VGroupLeafState[] = [];

  constructor(mobject: Mobject, target: Mobject, options: AnimationOptions = {}) {
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

        this.target.setStrokeOpacity(0);
        this.target._syncToThree();
        return;
      }

      // VGroup: per-child point and style interpolation
      if (vmobject instanceof VGroup && vtarget instanceof VGroup) {
        this._beginVGroup(vmobject, vtarget);
        return;
      }

      // Point-based morphing (single VMobject)
      const aligned = alignVmobjectPair(vmobject, vtarget);
      this._startPoints = aligned.startPoints;
      this._targetPoints = aligned.targetPoints;
      this._alignedSubpathLengths = aligned.alignedSubpathLengths;
      this._finalTargetPoints = aligned.finalTargetPoints;
      this._finalTargetSubpathLengths = aligned.finalTargetSubpathLengths;

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
      vmobject.setTransformSubpathLengths(this._alignedSubpathLengths);
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
      this.target.setStrokeOpacity(0);
      this.target._syncToThree();
    }
  }

  /**
   * Set up per-child interpolation for VGroup → VGroup transforms.
   * Matches children pairwise; extra source children fade out, extra
   * target children fade in via placeholder VMobjects.
   */
  private _beginVGroup(vmobject: VGroup, vtarget: VGroup): void {
    this._isVGroupTransform = true;

    const leafPairs = pairLeafSnapshotsByIndex(vmobject, vtarget);

    for (let i = 0; i < leafPairs.length; i++) {
      const src = leafPairs[i].source;
      const tgt = leafPairs[i].target;

      if (src && tgt) {
        const sc = src.leaf;
        const tc = tgt.leaf;
        const aligned = alignVmobjectPair(sc, tc);
        const startStyle = captureStyle(sc);
        const targetStyle = captureStyle(tc);

        sc.setPoints(aligned.startPoints);
        sc.setTransformSubpathLengths(aligned.alignedSubpathLengths);

        this._vgroupLeafStates.push({
          child: sc,
          startPoints: aligned.startPoints,
          targetPoints: aligned.targetPoints,
          startPosition: worldToParentLocalPosition(src.worldPosition, src.parentWorldMatrix),
          targetPosition: worldToParentLocalPosition(tgt.worldPosition, src.parentWorldMatrix),
          finalTargetPoints: aligned.finalTargetPoints,
          finalTargetSubpathLengths: aligned.finalTargetSubpathLengths,
          startStyle,
          targetStyle,
          strokeColorPair: {
            start: new THREE.Color(startStyle.color),
            target: new THREE.Color(targetStyle.color),
            interpolate: startStyle.color !== targetStyle.color,
          },
          fillColorPair: {
            start: new THREE.Color(startStyle.fillColor),
            target: new THREE.Color(targetStyle.fillColor),
            interpolate: startStyle.fillColor !== targetStyle.fillColor,
          },
        });
      } else if (src) {
        const sc = src.leaf;
        const p = worldToParentLocalPosition(src.worldPosition, src.parentWorldMatrix);
        const startStyle = captureStyle(sc);
        const targetStyle = captureStyleFaded(sc);

        this._vgroupLeafStates.push({
          child: sc,
          startPoints: sc.getPoints(),
          targetPoints: sc.getPoints(),
          startPosition: p.clone(),
          targetPosition: p,
          finalTargetPoints: sc.getPoints(),
          finalTargetSubpathLengths: undefined,
          startStyle,
          targetStyle,
          strokeColorPair: {
            start: new THREE.Color(startStyle.color),
            target: new THREE.Color(targetStyle.color),
            interpolate: startStyle.color !== targetStyle.color,
          },
          fillColorPair: {
            start: new THREE.Color(startStyle.fillColor),
            target: new THREE.Color(targetStyle.fillColor),
            interpolate: startStyle.fillColor !== targetStyle.fillColor,
          },
        });
      } else if (tgt) {
        const tc = tgt.leaf;
        const placeholder = tc.copy() as VMobject;
        placeholder.opacity = 0;
        placeholder.fillOpacity = 0;
        vmobject.add(placeholder);

        const p = worldToParentLocalPosition(tgt.worldPosition, tgt.parentWorldMatrix);
        const startStyle = captureStyleFaded(tc);
        const targetStyle = captureStyle(tc);
        const originalPts = tc.getPoints();

        placeholder.setTransformSubpathLengths(tc.getEffectiveSubpathLengths?.());

        this._vgroupLeafStates.push({
          child: placeholder,
          startPoints: originalPts,
          targetPoints: originalPts,
          startPosition: p.clone(),
          targetPosition: p,
          finalTargetPoints: originalPts,
          finalTargetSubpathLengths: tc.getEffectiveSubpathLengths?.(),
          startStyle,
          targetStyle,
          strokeColorPair: {
            start: new THREE.Color(startStyle.color),
            target: new THREE.Color(targetStyle.color),
            interpolate: startStyle.color !== targetStyle.color,
          },
          fillColorPair: {
            start: new THREE.Color(startStyle.fillColor),
            target: new THREE.Color(targetStyle.fillColor),
            interpolate: startStyle.fillColor !== targetStyle.fillColor,
          },
        });
      }
    }

    // Capture group-level transform properties
    this._startPosition.copy(vmobject.position);
    this._targetPosition.copy(vtarget.position);
    this._startRotation.copy(vmobject.rotation);
    this._targetRotation.copy(vtarget.rotation);
    this._startScale.copy(vmobject.scaleVector);
    this._targetScale.copy(vtarget.scaleVector);
  }

  /**
   * Interpolate between start and target at the given alpha
   */
  interpolate(alpha: number): void {
    if (this._useCrossFade) {
      // Cross-fade: source fades out, target fades in
      this.mobject.setStrokeOpacity(this._startOpacity * (1 - alpha));
      this.target.setStrokeOpacity(this._crossFadeTargetOpacity * alpha);

      // Move source toward target position for a smooth transition
      this.mobject.position.lerpVectors(this._startPosition, this._targetPosition, alpha);
      this.mobject._markDirty();

      // Target is not in Scene._mobjects, so sync manually
      this.target._syncToThree();
      return;
    }

    // VGroup per-child morphing
    if (this._isVGroupTransform) {
      const group = this.mobject as VGroup;
      for (const leaf of this._vgroupLeafStates) {
        const interpolated: number[][] = [];
        for (let i = 0; i < leaf.startPoints.length; i++) {
          interpolated.push(lerpPoint(leaf.startPoints[i], leaf.targetPoints[i], alpha));
        }
        leaf.child.setPoints(interpolated);

        leaf.child.position.lerpVectors(leaf.startPosition, leaf.targetPosition, alpha);

        const ss = leaf.startStyle;
        const ts = leaf.targetStyle;
        leaf.child.opacity = ss.opacity + (ts.opacity - ss.opacity) * alpha;
        leaf.child.fillOpacity = ss.fillOpacity + (ts.fillOpacity - ss.fillOpacity) * alpha;
        leaf.child.strokeWidth = ss.strokeWidth + (ts.strokeWidth - ss.strokeWidth) * alpha;

        if (leaf.strokeColorPair.interpolate) {
          leaf.child.color =
            '#' +
            scratchColor
              .lerpColors(leaf.strokeColorPair.start, leaf.strokeColorPair.target, alpha)
              .getHexString();
        }
        if (leaf.fillColorPair.interpolate) {
          leaf.child.fillColor =
            '#' +
            scratchColor
              .lerpColors(leaf.fillColorPair.start, leaf.fillColorPair.target, alpha)
              .getHexString();
        }

        leaf.child._markDirty();
      }

      // Container group transforms are intentionally not interpolated here.
      // Group/VGroup transform methods typically mutate children directly;
      // interpolating container transforms as well can double-apply motion.
      group._markDirty();
      return;
    }

    // Point-based morphing (single VMobject)
    const vmobject = this.mobject as VMobject;

    const interpolatedPoints: number[][] = [];
    for (let i = 0; i < this._startPoints.length; i++) {
      interpolatedPoints.push(lerpPoint(this._startPoints[i], this._targetPoints[i], alpha));
    }
    vmobject.setPoints(interpolatedPoints);
    vmobject.setTransformSubpathLengths(this._alignedSubpathLengths);

    vmobject.opacity = this._startOpacity + (this._targetOpacity - this._startOpacity) * alpha;

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
      const lerpedFillColor = new THREE.Color().lerpColors(
        this._startFillColor,
        this._targetFillColor,
        alpha,
      );
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
        this.mobject.setStrokeOpacity(this._crossFadeTargetOpacity);
        this.mobject._markDirty();

        // Remove target from scene graph
        const targetObj = this.target.getThreeObject();
        if (targetObj.parent) targetObj.parent.remove(targetObj);
      } else {
        // Non-Text cross-fade: reparent target under source
        this.mobject.setStrokeOpacity(0);
        this.target.setStrokeOpacity(this._crossFadeTargetOpacity);
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
          tgtWorld.z - srcWorld.z,
        );
      }

      super.finish();
      return;
    }

    if (this._isVGroupTransform) {
      const group = this.mobject as VGroup;
      for (const leaf of this._vgroupLeafStates) {
        leaf.child.setPoints(leaf.finalTargetPoints);
        leaf.child.position.copy(leaf.targetPosition);
        const ts = leaf.targetStyle;
        leaf.child.opacity = ts.opacity;
        leaf.child.fillOpacity = ts.fillOpacity;
        leaf.child.strokeWidth = ts.strokeWidth;
        leaf.child.color = ts.color;
        leaf.child.fillColor = ts.fillColor;
        leaf.child.setTransformSubpathLengths(leaf.finalTargetSubpathLengths);

        leaf.child._markDirty();
      }

      // Keep container transform as-is; leaf VMobjects now represent final visual state.
      group._markDirty();

      super.finish();
      return;
    }

    const vmobject = this.mobject as VMobject;
    const vtarget = this.target as VMobject;
    vmobject.setPoints(
      this._finalTargetPoints.length > 0 ? this._finalTargetPoints : this._targetPoints,
    );
    vmobject.setTransformSubpathLengths(this._finalTargetSubpathLengths);
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
  options?: AnimationOptions,
): Transform {
  return new Transform(mobject, target, options);
}

/**
 * ReplacementTransform - like Transform, but replaces the mobject with the target
 * in the scene after the animation completes.
 */
export class ReplacementTransform extends Transform {
  constructor(mobject: Mobject, target: Mobject, options: AnimationOptions = {}) {
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
  options?: AnimationOptions,
): ReplacementTransform {
  return new ReplacementTransform(mobject, target, options);
}

/**
 * MoveToTarget animation - moves a mobject to its target copy.
 * The mobject must have a `.targetCopy` property set beforehand.
 */
export interface MobjectWithTarget extends VMobject {
  targetCopy: VMobject | null;
}

export class MoveToTarget extends Transform {
  constructor(mobject: MobjectWithTarget, options: AnimationOptions = {}) {
    if (!mobject.targetCopy) {
      throw new Error(
        'MoveToTarget requires mobject.targetCopy to be set. Use mobject.generateTarget() first.',
      );
    }
    super(mobject, mobject.targetCopy, options);
  }
}

/**
 * Create a MoveToTarget animation.
 */
export function moveToTarget(mobject: MobjectWithTarget, options?: AnimationOptions): MoveToTarget {
  return new MoveToTarget(mobject, options);
}
