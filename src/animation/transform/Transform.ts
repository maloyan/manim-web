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
import {
  alignVmobjectPair,
  canMorphByPoints,
  pairLeafSnapshotsByIndex,
  type LeafPairByIndex,
} from './TransformPairing';
import { ImageMobject } from '../../mobjects/image';
import { Text } from '../../mobjects/text/Text';
import { MathTexImage } from '../../mobjects/text/MathTexImage';

/** Morph mode determines how source transforms into target */
enum MorphMode {
  /** Point interpolation for VMobjects with points (Circle, Square, Polygon, etc.) */
  Point,
  /** Cross-fade opacity + position interpolation (zero-point VMobjects, non-VMobjects) */
  Fade,
  /** Cross-fade + geometry + transform interpolation (ImageMobject, Text, MathTexImage) */
  Shape,
}

/** Common interface for mobjects with texture meshes (Text, ImageMobject, MathTexImage) */
interface TexturedMobject extends Mobject {
  _source: unknown;
  _texture: THREE.Texture | null;
}

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

  /** Geometry dimensions for Shape mode (ImageMobject, Text, MathTexImage) */
  private _startWidth: number = 0;
  private _startHeight: number = 0;
  private _targetWidth: number = 0;
  private _targetHeight: number = 0;

  /** Current morph mode */
  private _morphMode: MorphMode = MorphMode.Point;

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

  /** Check if mobject is a Shape mode type (ImageMobject, Text, MathTexImage) */
  private _isShapeModeType(m: Mobject): boolean {
    return m instanceof ImageMobject || m instanceof Text || m instanceof MathTexImage;
  }

  /** Capture position/rotation/scale from source and target mobjects */
  private _captureTransformProps(): void {
    this.target._syncToThree();
    this._startPosition.copy(this.mobject.position);
    this._targetPosition.copy(this.target.position);
    this._startRotation.copy(this.mobject.rotation);
    this._targetRotation.copy(this.target.rotation);
    this._startScale.copy(this.mobject.scaleVector);
    this._targetScale.copy(this.target.scaleVector);
  }

  /** Capture geometry dimensions for Shape mode */
  private _captureGeometryDimensions(): void {
    const srcMesh = this.mobject.getThreeObject() as THREE.Mesh;
    const tgtMesh = this.target.getThreeObject() as THREE.Mesh;
    const srcGeo = srcMesh.geometry as THREE.PlaneGeometry;
    const tgtGeo = tgtMesh.geometry as THREE.PlaneGeometry;
    this._startWidth = srcGeo.parameters.width;
    this._startHeight = srcGeo.parameters.height;
    this._targetWidth = tgtGeo.parameters.width;
    this._targetHeight = tgtGeo.parameters.height;
  }

  /** Set up cross-fade: add target to scene graph, start it invisible */
  private _setupCrossFade(): void {
    this._crossFadeTargetOpacity = this.target.opacity;
    const sourceObj = this.mobject.getThreeObject();
    const targetObj = this.target.getThreeObject();
    if (sourceObj.parent && !targetObj.parent) {
      sourceObj.parent.add(targetObj);
    }
    this.target.setStrokeOpacity(0);
    this.target._syncToThree();
  }

  /** Swap texture from target to source mobject */
  private _swapTexture(): void {
    const sourceMesh = this.mobject.getThreeObject() as THREE.Mesh;
    const targetMesh = this.target.getThreeObject() as THREE.Mesh;
    const srcMat = sourceMesh.material as THREE.MeshBasicMaterial;
    const tgtMat = targetMesh.material as THREE.MeshBasicMaterial;
    srcMat.map = tgtMat.map;
    srcMat.needsUpdate = true;
    const src = this.mobject as TexturedMobject;
    const tgt = this.target as TexturedMobject;
    src._source = tgt._source;
    src._texture = tgtMat.map;
  }

  /** Interpolate position for both source and target */
  private _interpolatePosition(alpha: number): void {
    this.mobject.position.lerpVectors(this._startPosition, this._targetPosition, alpha);
    this.target.position.lerpVectors(this._startPosition, this._targetPosition, alpha);
  }

  /** Interpolate position/rotation/scale for both source and target */
  private _interpolateTransform(alpha: number): void {
    this._interpolatePosition(alpha);
    this.mobject.rotation.set(
      this._startRotation.x + (this._targetRotation.x - this._startRotation.x) * alpha,
      this._startRotation.y + (this._targetRotation.y - this._startRotation.y) * alpha,
      this._startRotation.z + (this._targetRotation.z - this._startRotation.z) * alpha,
    );
    this.mobject.scaleVector.lerpVectors(this._startScale, this._targetScale, alpha);
    this.target.rotation.set(
      this._startRotation.x + (this._targetRotation.x - this._startRotation.x) * alpha,
      this._startRotation.y + (this._targetRotation.y - this._startRotation.y) * alpha,
      this._startRotation.z + (this._targetRotation.z - this._startRotation.z) * alpha,
    );
    this.target.scaleVector.lerpVectors(this._startScale, this._targetScale, alpha);
  }

  /** Interpolate opacity cross-fade */
  private _interpolateCrossFade(alpha: number): void {
    this.mobject.setStrokeOpacity(this._startOpacity * (1 - alpha));
    this.target.setStrokeOpacity(this._crossFadeTargetOpacity * alpha);
    this.target._syncToThree();
  }

  /**
   * Set up the animation - align points between mobject and target,
   * or set up cross-fade if either is not a VMobject.
   */
  override begin(): void {
    super.begin();

    // Shape mode: ImageMobject/Text/MathTexImage with geometry morphing
    // Check first since ImageMobject is NOT a VMobject
    if (this._isShapeModeType(this.mobject) && this._isShapeModeType(this.target)) {
      this._morphMode = MorphMode.Shape;
      this._startOpacity = this.mobject.opacity;
      this._captureTransformProps();
      this._captureGeometryDimensions();
      this._setupCrossFade();
      return;
    }

    const isSourceVM = this.mobject instanceof VMobject;
    const isTargetVM = this.target instanceof VMobject;

    if (isSourceVM && isTargetVM) {
      const vmobject = this.mobject as VMobject;
      const vtarget = this.target as VMobject;

      // Fade mode: zero-point VMobjects that aren't Shape types
      if (!canMorphByPoints(vmobject, vtarget)) {
        this._morphMode = MorphMode.Fade;
        this._startOpacity = this.mobject.opacity;
        this._startPosition.copy(vmobject.position);
        this._targetPosition.copy(vtarget.position);
        this._setupCrossFade();
        return;
      }

      // VGroup: per-child point and style interpolation
      if (vmobject instanceof VGroup && vtarget instanceof VGroup) {
        this._beginVGroup(vmobject, vtarget);
        return;
      }

      // Point mode: VMobject point interpolation
      this._morphMode = MorphMode.Point;
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

      this._startColor.set(vmobject.color);
      this._targetColor.set(vtarget.color);
      this._interpolateColor = vmobject.color !== vtarget.color;

      const sourceFillColor = vmobject.fillColor || vmobject.color;
      const targetFillColor = vtarget.fillColor || vtarget.color;
      this._startFillColor.set(sourceFillColor);
      this._targetFillColor.set(targetFillColor);
      this._interpolateFillColor = sourceFillColor !== targetFillColor;

      this._captureTransformProps();

      vmobject.setPoints(this._startPoints);
      vmobject.setTransformSubpathLengths(this._alignedSubpathLengths);
    } else {
      // Fade mode for non-VMobject transforms
      this._morphMode = MorphMode.Fade;
      this._startOpacity = this.mobject.opacity;
      this._startPosition.copy(this.mobject.position);
      this._targetPosition.copy(this.target.position);
      this._setupCrossFade();
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

    for (const pair of leafPairs) {
      this._vgroupLeafStates.push(this._buildVGroupLeafState(vmobject, pair));
    }

    // Capture group-level transform properties
    this._startPosition.copy(vmobject.position);
    this._targetPosition.copy(vtarget.position);
    this._startRotation.copy(vmobject.rotation);
    this._targetRotation.copy(vtarget.rotation);
    this._startScale.copy(vmobject.scaleVector);
    this._targetScale.copy(vtarget.scaleVector);
  }

  private _buildVGroupLeafState(vmobject: VGroup, pair: LeafPairByIndex): VGroupLeafState {
    const { source: src, target: tgt, sourceIsPlaceholder, targetIsPlaceholder } = pair;

    const sc = src.leaf;
    const tc = tgt.leaf;

    let child: VMobject = sc;
    if (sourceIsPlaceholder) {
      child = tc.copy() as VMobject;
      child.opacity = 0;
      child.fillOpacity = 0;
      vmobject.add(child);
    }

    const canMorph = canMorphByPoints(sc, tc) && !sourceIsPlaceholder && !targetIsPlaceholder;
    const aligned = canMorph ? alignVmobjectPair(sc, tc) : undefined;

    const startPoints = aligned?.startPoints ?? child.getPoints();
    const targetPoints = aligned?.targetPoints ?? child.getPoints();
    const finalTargetPoints = aligned?.finalTargetPoints ?? child.getPoints();
    const finalTargetSubpathLengths = aligned?.finalTargetSubpathLengths;

    if (aligned) {
      child.setPoints(aligned.startPoints);
      child.setTransformSubpathLengths(aligned.alignedSubpathLengths);
    } else {
      child.setTransformSubpathLengths(undefined);
    }

    const startStyle = sourceIsPlaceholder ? captureStyleFaded(tc) : captureStyle(child);
    const targetStyle = targetIsPlaceholder ? captureStyleFaded(sc) : captureStyle(tc);

    return {
      child,
      startPoints,
      targetPoints,
      startPosition: worldToParentLocalPosition(src.worldPosition, src.parentWorldMatrix),
      targetPosition: worldToParentLocalPosition(tgt.worldPosition, src.parentWorldMatrix),
      finalTargetPoints,
      finalTargetSubpathLengths,
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
    };
  }

  /**
   * Interpolate between start and target at the given alpha
   */
  interpolate(alpha: number): void {
    // Shape mode: cross-fade + geometry + transform
    if (this._morphMode === MorphMode.Shape) {
      const w = this._startWidth + (this._targetWidth - this._startWidth) * alpha;
      const h = this._startHeight + (this._targetHeight - this._startHeight) * alpha;

      const sourceMesh = this.mobject.getThreeObject() as THREE.Mesh;
      sourceMesh.geometry.dispose();
      sourceMesh.geometry = new THREE.PlaneGeometry(w, h);

      const targetMesh = this.target.getThreeObject() as THREE.Mesh;
      targetMesh.geometry.dispose();
      targetMesh.geometry = new THREE.PlaneGeometry(w, h);

      this._interpolateTransform(alpha);
      this._interpolateCrossFade(alpha);
      this.mobject._markDirty();
      return;
    }

    // Fade mode: cross-fade opacity + position
    if (this._morphMode === MorphMode.Fade) {
      this._interpolatePosition(alpha);
      this._interpolateCrossFade(alpha);
      this.mobject._markDirty();
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
    // Shape mode finish
    if (this._morphMode === MorphMode.Shape) {
      const mesh = this.mobject.getThreeObject() as THREE.Mesh;
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(this._targetWidth, this._targetHeight);

      this.mobject.position.copy(this._targetPosition);
      this.mobject.rotation.copy(this._targetRotation);
      this.mobject.scaleVector.copy(this._targetScale);

      this._swapTexture();
      this.mobject.opacity = this._crossFadeTargetOpacity;

      const targetObj = this.target.getThreeObject();
      if (targetObj.parent) targetObj.parent.remove(targetObj);

      this.mobject._markDirty();
      super.finish();
      return;
    }

    // Fade mode finish
    if (this._morphMode === MorphMode.Fade) {
      this.mobject.position.copy(this._targetPosition);
      this.mobject.opacity = 0;

      this.target.opacity = this._crossFadeTargetOpacity;
      this.target._syncToThree();

      const targetObj = this.target.getThreeObject();
      if (targetObj.parent) targetObj.parent.remove(targetObj);

      this.mobject._markDirty();
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
