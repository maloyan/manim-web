/**
 * Transform animation - morphs one mobject into another.
 * For Text with loaded glyphs: morphs glyph Bezier outlines.
 * For VMobjects: interpolates points and style.
 * For non-VMobjects (e.g., MathTex): falls back to opacity cross-fade.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { Text } from '../../mobjects/text/Text';

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

  /** Whether to use glyph-based morph for Text→Text */
  private _useGlyphMorph: boolean = false;

  /** Isolated Three.js group for glyph morph (doesn't touch source/target transforms) */
  private _morphGroup: THREE.Group | null = null;

  /** Proxy VMobjects whose Line2 geometry renders the morphing glyphs */
  private _glyphProxies: VMobject[] = [];

  /** Per-glyph aligned start and target point arrays */
  private _glyphStartPoints: number[][][] = [];
  private _glyphTargetPoints: number[][][] = [];

  /** Start and end positions for the morph group */
  private _morphStartPos: THREE.Vector3 = new THREE.Vector3();
  private _morphEndPos: THREE.Vector3 = new THREE.Vector3();

  /** Reference to source texture mesh for hiding during glyph morph */
  private _sourceTextureMesh: THREE.Mesh | null = null;

  /** Saved target opacity for glyph morph reveal */
  private _glyphTargetOpacity: number = 1;

  constructor(
    mobject: Mobject,
    target: Mobject,
    options: AnimationOptions = {}
  ) {
    super(mobject, options);
    this.target = target;
  }

  /**
   * Set up the animation - detect Text→Text for glyph morph,
   * align points for VMobject morph, or set up cross-fade.
   */
  override begin(): void {
    super.begin();

    const isSourceText = this.mobject instanceof Text;
    const isTargetText = this.target instanceof Text;

    // Text→Text: use glyph morph if glyphs are loaded, otherwise cross-fade.
    // Any Transform involving a Text mobject goes through here (not the
    // generic VMobject branch) because Text has no Bezier points to morph.
    if (isSourceText || isTargetText) {
      if (isSourceText && isTargetText) {
        const sourceText = this.mobject as Text;
        const targetText = this.target as Text;
        const sourceGlyphs = sourceText.getGlyphGroup();
        const targetGlyphs = targetText.getGlyphGroup();

        if (sourceGlyphs && targetGlyphs &&
            sourceGlyphs.children.length > 0 && targetGlyphs.children.length > 0) {
          this._useGlyphMorph = true;
          this._setupGlyphMorph(sourceText, targetText, sourceGlyphs, targetGlyphs);
          return;
        }
      }

      // Text without loaded glyphs or mixed Text/non-Text → cross-fade
      this._useCrossFade = true;
      this._startOpacity = this.mobject.opacity;
      this._crossFadeTargetOpacity = this.target.opacity;

      const sourceObj = this.mobject.getThreeObject();
      const targetObj = this.target.getThreeObject();
      if (sourceObj.parent && !targetObj.parent) {
        sourceObj.parent.add(targetObj);
      }

      this.target.setOpacity(0);
      this.target._syncToThree();
      return;
    }

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
   * Set up glyph-based morph for Text→Text transforms.
   * Creates an isolated Three.js group with proxy VMobjects whose Line2
   * geometry morphs between source and target glyph outlines.
   * The morph group is independent from source/target transforms to avoid
   * interfering with other simultaneous animations.
   */
  private _setupGlyphMorph(
    sourceText: Text,
    targetText: Text,
    sourceGlyphs: { children: Mobject[] },
    targetGlyphs: { children: Mobject[] }
  ): void {
    const srcChildren = sourceGlyphs.children.filter(
      (c) => c instanceof VMobject
    ) as VMobject[];
    const tgtChildren = targetGlyphs.children.filter(
      (c) => c instanceof VMobject
    ) as VMobject[];

    const maxCount = Math.max(srcChildren.length, tgtChildren.length);

    this._glyphProxies = [];
    this._glyphStartPoints = [];
    this._glyphTargetPoints = [];

    for (let i = 0; i < maxCount; i++) {
      let srcPts: number[][];
      let tgtPts: number[][];

      if (i < srcChildren.length) {
        srcPts = srcChildren[i].getPoints();
      } else {
        // No source glyph — collapse to the target glyph's centroid
        // so the letter appears to grow from a point
        const pts = tgtChildren[i].getPoints();
        const centroid = this._computeCentroid(pts);
        srcPts = pts.map(() => [...centroid]);
      }

      if (i < tgtChildren.length) {
        tgtPts = tgtChildren[i].getPoints();
      } else {
        // No target glyph — collapse to the source glyph's centroid
        // so the letter appears to shrink to a point
        const pts = srcChildren[i].getPoints();
        const centroid = this._computeCentroid(pts);
        tgtPts = pts.map(() => [...centroid]);
      }

      // Create temporary VMobjects for point alignment
      const srcVM = new VMobject();
      srcVM.setPoints(srcPts);
      const tgtVM = new VMobject();
      tgtVM.setPoints(tgtPts);

      srcVM.alignPoints(tgtVM);

      this._glyphStartPoints.push(srcVM.getPoints());
      this._glyphTargetPoints.push(tgtVM.getPoints());

      // Create proxy VMobject for rendering during the morph
      const proxy = new VMobject();
      proxy.color = sourceText.color;
      proxy.strokeWidth = 2;
      proxy.fillOpacity = 0;
      proxy.setPoints(srcVM.getPoints());
      proxy._syncToThree();

      this._glyphProxies.push(proxy);
    }

    // Create isolated Three.js group for the morph animation
    this._morphGroup = new THREE.Group();
    for (const proxy of this._glyphProxies) {
      this._morphGroup.add(proxy.getThreeObject());
    }

    // Add morph group to scene graph (sibling of source)
    const sourceObj = sourceText.getThreeObject();
    const targetObj = targetText.getThreeObject();
    const parent = sourceObj.parent;
    if (parent) {
      parent.add(this._morphGroup);
    }

    // Ensure target is in the scene for the final reveal
    if (parent && !targetObj.parent) {
      parent.add(targetObj);
    }

    // Store positions for interpolation (local to parent)
    this._morphStartPos.copy(sourceObj.position);
    this._morphEndPos.copy(targetObj.position);
    this._morphGroup.position.copy(this._morphStartPos);

    // Hide source canvas texture
    this._sourceTextureMesh = sourceText.getTextureMesh();
    if (this._sourceTextureMesh) {
      this._sourceTextureMesh.visible = false;
    }

    // Prepare target for reveal at animation end
    this._glyphTargetOpacity = targetText.opacity;
    targetText.setOpacity(0);
    targetText._syncToThree();
  }

  /**
   * Compute the centroid of a point array.
   */
  private _computeCentroid(pts: number[][]): number[] {
    if (pts.length === 0) return [0, 0, 0];
    let cx = 0, cy = 0, cz = 0;
    for (const p of pts) {
      cx += p[0]; cy += p[1]; cz += p[2];
    }
    return [cx / pts.length, cy / pts.length, cz / pts.length];
  }

  /**
   * Interpolate between start and target at the given alpha
   */
  interpolate(alpha: number): void {
    if (this._useGlyphMorph) {
      // Glyph-based morph: interpolate each proxy's Bezier points
      for (let g = 0; g < this._glyphProxies.length; g++) {
        const proxy = this._glyphProxies[g];
        const startPts = this._glyphStartPoints[g];
        const targetPts = this._glyphTargetPoints[g];
        const pts: number[][] = [];
        for (let i = 0; i < startPts.length; i++) {
          pts.push(lerpPoint(startPts[i], targetPts[i], alpha));
        }
        proxy.setPoints(pts);
        // Proxies are not in Scene._mobjects so sync manually
        proxy._syncToThree();
      }

      // Interpolate morph group position from source to target
      if (this._morphGroup) {
        this._morphGroup.position.lerpVectors(
          this._morphStartPos, this._morphEndPos, alpha
        );
      }
      return;
    }

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
    vmobject.rotation.set(
      this._startRotation.x + (this._targetRotation.x - this._startRotation.x) * alpha,
      this._startRotation.y + (this._targetRotation.y - this._startRotation.y) * alpha,
      this._startRotation.z + (this._targetRotation.z - this._startRotation.z) * alpha,
    );
    vmobject.scaleVector.lerpVectors(this._startScale, this._targetScale, alpha);

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
    if (this._useGlyphMorph) {
      // Remove morph group from scene graph
      if (this._morphGroup && this._morphGroup.parent) {
        this._morphGroup.parent.remove(this._morphGroup);
      }

      // Show target at final opacity
      this.target.setOpacity(this._glyphTargetOpacity);
      this.target._syncToThree();

      // Hide source
      this.mobject.setOpacity(0);

      // Restore source texture mesh visibility (hidden during morph).
      // Source is opacity=0 so this won't flash.
      if (this._sourceTextureMesh) {
        this._sourceTextureMesh.visible = true;
      }

      // Reparent target Three.js object under source so cleanup works
      // (same pattern as cross-fade finish)
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

      // Clean up references
      this._glyphProxies = [];
      this._morphGroup = null;

      super.finish();
      return;
    }

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
  targetCopy: Mobject | null;
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
