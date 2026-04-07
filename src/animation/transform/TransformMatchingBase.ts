/**
 * TransformMatchingAbstractBase - Abstract base for matching transform animations.
 *
 * Provides the common structure for animations that match parts between source
 * and target mobjects, transforming matched parts smoothly while fading
 * in/out unmatched parts.
 *
 * Subclasses must implement:
 * - `_getSubmobjects(vmobject)` - How to decompose a mobject into matchable parts
 * - `_getKey(vmobject)` - How to compute the matching key for a part
 *
 * @example
 * ```typescript
 * class TransformMatchingCustom extends TransformMatchingAbstractBase {
 *   protected _getSubmobjects(vmobject: VMobject): VMobject[] {
 *     return vmobject.children.filter(c => c instanceof VMobject) as VMobject[];
 *   }
 *   protected _getKey(vmobject: VMobject): string {
 *     return myCustomKeyFunction(vmobject);
 *   }
 * }
 * ```
 */

import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { lerp, lerpPoint } from '../../utils/math';

export interface TransformMatchingBaseOptions extends AnimationOptions {
  /** Key function to extract identifier for matching */
  keyFunc?: (vmobject: VMobject) => string;
  /** Fade duration as fraction of total duration (0-0.5). Default: 0.25 */
  fadeRatio?: number;
}

interface MatchedPart {
  source: VMobject;
  target: VMobject;
  startPoints: number[][];
  targetPoints: number[][];
  startOpacity: number;
  targetOpacity: number;
}

interface FadingPart {
  mobject: VMobject;
  fadeIn: boolean;
  startOpacity: number;
  targetOpacity: number;
}

export abstract class TransformMatchingAbstractBase extends Animation {
  /** The target mobject to transform into */
  readonly target: VMobject;

  /** Optional key function for matching */
  readonly keyFunc?: (vmobject: VMobject) => string;

  /** Fade duration ratio */
  readonly fadeRatio: number;

  /** Matched parts that will transform */
  protected _matchedParts: MatchedPart[] = [];

  /** Source parts that will fade out (no match in target) */
  protected _fadeOutParts: FadingPart[] = [];

  /** Target parts that will fade in (no match in source) */
  protected _fadeInParts: FadingPart[] = [];

  constructor(source: VMobject, target: VMobject, options: TransformMatchingBaseOptions = {}) {
    super(source, options);
    this.target = target;
    this.keyFunc = options.keyFunc;
    this.fadeRatio = Math.min(0.5, Math.max(0, options.fadeRatio ?? 0.25));
  }

  /**
   * Get the submobjects/parts to match from a given VMobject.
   * Subclasses must implement this to define how mobjects are decomposed.
   */
  protected abstract _getSubmobjects(vmobject: VMobject): VMobject[];

  /**
   * Get a matching key for a VMobject part.
   * Parts with the same key will be matched together.
   * Subclasses must implement this.
   */
  protected abstract _getKey(vmobject: VMobject): string;

  /**
   * Match submobjects between source and target.
   * Uses key-based exact matching by default. Subclasses can override
   * to add additional matching strategies (e.g., similarity-based).
   */
  protected _matchParts(): void {
    const sourceParts = this._getSubmobjects(this.mobject as VMobject);
    const targetParts = this._getSubmobjects(this.target);

    const usedSourceIndices = new Set<number>();
    const usedTargetIndices = new Set<number>();

    // Group by key
    const sourceByKey = new Map<string, { vmob: VMobject; index: number }[]>();
    const targetByKey = new Map<string, { vmob: VMobject; index: number }[]>();

    const keyFn = this.keyFunc ?? ((vmob: VMobject) => this._getKey(vmob));

    sourceParts.forEach((vmob, index) => {
      const key = keyFn(vmob);
      if (!sourceByKey.has(key)) sourceByKey.set(key, []);
      sourceByKey.get(key)!.push({ vmob, index });
    });

    targetParts.forEach((vmob, index) => {
      const key = keyFn(vmob);
      if (!targetByKey.has(key)) targetByKey.set(key, []);
      targetByKey.get(key)!.push({ vmob, index });
    });

    // Match by key
    for (const [key, sources] of sourceByKey) {
      const targets = targetByKey.get(key);
      if (targets) {
        const matchCount = Math.min(sources.length, targets.length);
        for (let i = 0; i < matchCount; i++) {
          this._addMatchedPart(sources[i].vmob, targets[i].vmob);
          usedSourceIndices.add(sources[i].index);
          usedTargetIndices.add(targets[i].index);
        }
      }
    }

    // Unmatched sources fade out
    for (let i = 0; i < sourceParts.length; i++) {
      if (!usedSourceIndices.has(i)) {
        const vmob = sourceParts[i];
        this._fadeOutParts.push({
          mobject: vmob,
          fadeIn: false,
          startOpacity: vmob.opacity,
          targetOpacity: 0,
        });
      }
    }

    // Unmatched targets fade in
    for (let i = 0; i < targetParts.length; i++) {
      if (!usedTargetIndices.has(i)) {
        const vmob = targetParts[i];
        const copy = vmob.copy() as VMobject;
        copy.opacity = 0;
        const parent = this.mobject.parent;
        if (parent) {
          parent.add(copy);
        }
        this._fadeInParts.push({
          mobject: copy,
          fadeIn: true,
          startOpacity: 0,
          targetOpacity: vmob.opacity,
        });
      }
    }
  }

  /**
   * Add a matched pair of source and target parts.
   * Aligns their points so they can be smoothly interpolated.
   */
  protected _addMatchedPart(source: VMobject, target: VMobject): void {
    const srcCopy = source.copy() as VMobject;
    const tgtCopy = target.copy() as VMobject;
    srcCopy.alignPoints(tgtCopy);

    this._matchedParts.push({
      source,
      target,
      startPoints: srcCopy.getPoints(),
      targetPoints: tgtCopy.getPoints(),
      startOpacity: source.opacity,
      targetOpacity: target.opacity,
    });

    // Set source to have aligned points
    source.setPoints(srcCopy.getPoints());
  }

  override begin(): void {
    super.begin();
    this._matchParts();
  }

  interpolate(alpha: number): void {
    // Interpolate matched parts
    for (const part of this._matchedParts) {
      const points: number[][] = [];
      for (let i = 0; i < part.startPoints.length; i++) {
        points.push(lerpPoint(part.startPoints[i], part.targetPoints[i], alpha));
      }
      part.source.setPoints(points);
      part.source.opacity = lerp(part.startOpacity, part.targetOpacity, alpha);
    }

    // Handle fading parts with adjusted timing
    // Fade out happens in first portion, fade in happens in last portion
    const fadeOutAlpha = Math.min(1, alpha / this.fadeRatio);
    const fadeInStart = 1 - this.fadeRatio;
    const fadeInAlpha = Math.max(0, (alpha - fadeInStart) / this.fadeRatio);

    for (const part of this._fadeOutParts) {
      part.mobject.opacity = lerp(part.startOpacity, 0, Math.min(1, fadeOutAlpha));
    }

    for (const part of this._fadeInParts) {
      part.mobject.opacity = lerp(0, part.targetOpacity, Math.min(1, fadeInAlpha));
    }
  }

  override finish(): void {
    // Finalize matched parts
    for (const part of this._matchedParts) {
      part.source.setPoints(part.targetPoints);
      part.source.opacity = part.targetOpacity;
      part.source.color = part.target.color;
    }

    // Finalize fading parts
    for (const part of this._fadeOutParts) {
      part.mobject.opacity = 0;
    }

    for (const part of this._fadeInParts) {
      part.mobject.opacity = part.targetOpacity;
    }

    super.finish();
  }
}
