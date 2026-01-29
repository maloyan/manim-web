/**
 * Matching-based Transform animations for manimweb.
 * These animations match parts between source and target mobjects,
 * transforming matching parts smoothly while fading in/out unmatched parts.
 */

import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
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

/**
 * Helper function for linear interpolation between numbers
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Compute the bounding box of a VMobject
 */
function getBoundingBox(vmobject: VMobject): { min: Vector3Tuple; max: Vector3Tuple; center: Vector3Tuple; size: Vector3Tuple } {
  const points = vmobject.getPoints();
  if (points.length === 0) {
    const pos = vmobject.getCenter();
    return {
      min: pos,
      max: pos,
      center: pos,
      size: [0, 0, 0]
    };
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p[0]);
    minY = Math.min(minY, p[1]);
    minZ = Math.min(minZ, p[2]);
    maxX = Math.max(maxX, p[0]);
    maxY = Math.max(maxY, p[1]);
    maxZ = Math.max(maxZ, p[2]);
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    size: [maxX - minX, maxY - minY, maxZ - minZ]
  };
}

/**
 * Calculate similarity between two shapes based on bounding box and point count
 */
function shapeSimilarity(a: VMobject, b: VMobject): number {
  const boxA = getBoundingBox(a);
  const boxB = getBoundingBox(b);

  // Size similarity (0 to 1)
  const sizeA = Math.sqrt(boxA.size[0] ** 2 + boxA.size[1] ** 2);
  const sizeB = Math.sqrt(boxB.size[0] ** 2 + boxB.size[1] ** 2);
  const maxSize = Math.max(sizeA, sizeB, 0.001);
  const sizeSimilarity = 1 - Math.abs(sizeA - sizeB) / maxSize;

  // Aspect ratio similarity
  const aspectA = boxA.size[1] !== 0 ? boxA.size[0] / boxA.size[1] : 1;
  const aspectB = boxB.size[1] !== 0 ? boxB.size[0] / boxB.size[1] : 1;
  const maxAspect = Math.max(aspectA, aspectB, 0.001);
  const aspectSimilarity = 1 - Math.abs(aspectA - aspectB) / maxAspect;

  // Point count similarity
  const pointsA = a.getPoints().length;
  const pointsB = b.getPoints().length;
  const maxPoints = Math.max(pointsA, pointsB, 1);
  const pointSimilarity = 1 - Math.abs(pointsA - pointsB) / maxPoints;

  // Weighted average
  return sizeSimilarity * 0.4 + aspectSimilarity * 0.3 + pointSimilarity * 0.3;
}

// ============================================================================
// MatchingPart - tracks a matched pair of shapes during animation
// ============================================================================

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
  fadeIn: boolean; // true = fade in, false = fade out
  startOpacity: number;
  targetOpacity: number;
}

// ============================================================================
// TransformMatchingShapes
// ============================================================================

export interface TransformMatchingShapesOptions extends AnimationOptions {
  /** Minimum similarity threshold for matching (0-1). Default: 0.5 */
  matchThreshold?: number;
  /** Key function to extract identifier for matching. If provided, uses this instead of shape similarity */
  keyFunc?: (vmobject: VMobject) => string;
  /** Fade duration as fraction of total duration (0-0.5). Default: 0.25 */
  fadeRatio?: number;
}

/**
 * TransformMatchingShapes animation - transforms matching shapes between mobjects.
 * Shapes are matched by similarity (bounding box, aspect ratio, point count).
 * Matched shapes transform smoothly, while unmatched shapes fade in/out.
 */
export class TransformMatchingShapes extends Animation {
  /** The target mobject to transform into */
  readonly target: VMobject;

  /** Minimum similarity threshold for matching */
  readonly matchThreshold: number;

  /** Optional key function for matching */
  readonly keyFunc?: (vmobject: VMobject) => string;

  /** Fade duration ratio */
  readonly fadeRatio: number;

  /** Matched parts that will transform */
  private _matchedParts: MatchedPart[] = [];

  /** Source parts that will fade out (no match in target) */
  private _fadeOutParts: FadingPart[] = [];

  /** Target parts that will fade in (no match in source) */
  private _fadeInParts: FadingPart[] = [];

  constructor(
    source: VMobject,
    target: VMobject,
    options: TransformMatchingShapesOptions = {}
  ) {
    super(source, options);
    this.target = target;
    this.matchThreshold = options.matchThreshold ?? 0.5;
    this.keyFunc = options.keyFunc;
    this.fadeRatio = Math.min(0.5, Math.max(0, options.fadeRatio ?? 0.25));
  }

  /**
   * Get submobjects from a VMobject (or treat as single if no children)
   */
  private _getSubmobjects(vmobject: VMobject): VMobject[] {
    const children = vmobject.children.filter(c => c instanceof VMobject) as VMobject[];
    if (children.length > 0) {
      return children;
    }
    // Treat the mobject itself as a single submobject
    return [vmobject];
  }

  /**
   * Match submobjects between source and target
   */
  private _matchSubmobjects(): void {
    const sourceSubmobs = this._getSubmobjects(this.mobject as VMobject);
    const targetSubmobs = this._getSubmobjects(this.target);

    const usedSourceIndices = new Set<number>();
    const usedTargetIndices = new Set<number>();

    // If key function provided, use exact matching
    if (this.keyFunc) {
      const sourceByKey = new Map<string, { vmob: VMobject; index: number }[]>();
      const targetByKey = new Map<string, { vmob: VMobject; index: number }[]>();

      sourceSubmobs.forEach((vmob, index) => {
        const key = this.keyFunc!(vmob);
        if (!sourceByKey.has(key)) sourceByKey.set(key, []);
        sourceByKey.get(key)!.push({ vmob, index });
      });

      targetSubmobs.forEach((vmob, index) => {
        const key = this.keyFunc!(vmob);
        if (!targetByKey.has(key)) targetByKey.set(key, []);
        targetByKey.get(key)!.push({ vmob, index });
      });

      // Match by key
      for (const [key, sources] of sourceByKey) {
        const targets = targetByKey.get(key);
        if (targets) {
          const matchCount = Math.min(sources.length, targets.length);
          for (let i = 0; i < matchCount; i++) {
            const src = sources[i];
            const tgt = targets[i];
            this._addMatchedPart(src.vmob, tgt.vmob);
            usedSourceIndices.add(src.index);
            usedTargetIndices.add(tgt.index);
          }
        }
      }
    } else {
      // Use similarity-based matching with greedy algorithm
      const similarities: Array<{ srcIdx: number; tgtIdx: number; similarity: number }> = [];

      for (let si = 0; si < sourceSubmobs.length; si++) {
        for (let ti = 0; ti < targetSubmobs.length; ti++) {
          const sim = shapeSimilarity(sourceSubmobs[si], targetSubmobs[ti]);
          if (sim >= this.matchThreshold) {
            similarities.push({ srcIdx: si, tgtIdx: ti, similarity: sim });
          }
        }
      }

      // Sort by similarity descending and greedily match
      similarities.sort((a, b) => b.similarity - a.similarity);

      for (const { srcIdx, tgtIdx } of similarities) {
        if (!usedSourceIndices.has(srcIdx) && !usedTargetIndices.has(tgtIdx)) {
          this._addMatchedPart(sourceSubmobs[srcIdx], targetSubmobs[tgtIdx]);
          usedSourceIndices.add(srcIdx);
          usedTargetIndices.add(tgtIdx);
        }
      }
    }

    // Collect unmatched source submobjects (will fade out)
    for (let i = 0; i < sourceSubmobs.length; i++) {
      if (!usedSourceIndices.has(i)) {
        const vmob = sourceSubmobs[i];
        this._fadeOutParts.push({
          mobject: vmob,
          fadeIn: false,
          startOpacity: vmob.opacity,
          targetOpacity: 0
        });
      }
    }

    // Collect unmatched target submobjects (will fade in)
    for (let i = 0; i < targetSubmobs.length; i++) {
      if (!usedTargetIndices.has(i)) {
        const vmob = targetSubmobs[i];
        // Add to scene as copy, starting invisible
        const copy = vmob.copy() as VMobject;
        copy.opacity = 0;

        // Add to parent of source mobject
        const parent = this.mobject.parent;
        if (parent) {
          parent.add(copy);
        }

        this._fadeInParts.push({
          mobject: copy,
          fadeIn: true,
          startOpacity: 0,
          targetOpacity: vmob.opacity
        });
      }
    }
  }

  /**
   * Add a matched pair
   */
  private _addMatchedPart(source: VMobject, target: VMobject): void {
    const srcCopy = source.copy() as VMobject;
    const tgtCopy = target.copy() as VMobject;
    srcCopy.alignPoints(tgtCopy);

    this._matchedParts.push({
      source,
      target,
      startPoints: srcCopy.getPoints(),
      targetPoints: tgtCopy.getPoints(),
      startOpacity: source.opacity,
      targetOpacity: target.opacity
    });

    // Set source to have aligned points
    source.setPoints(srcCopy.getPoints());
  }

  override begin(): void {
    super.begin();
    this._matchSubmobjects();
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
    // Fade out happens in first half, fade in happens in second half
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

/**
 * Create a TransformMatchingShapes animation.
 * @param source The source VMobject
 * @param target The target VMobject
 * @param options Animation options
 */
export function transformMatchingShapes(
  source: VMobject,
  target: VMobject,
  options?: TransformMatchingShapesOptions
): TransformMatchingShapes {
  return new TransformMatchingShapes(source, target, options);
}

// ============================================================================
// TransformMatchingTex
// ============================================================================

export interface TransformMatchingTexOptions extends AnimationOptions {
  /** Key function to extract identifier for matching. Default uses LaTeX string comparison */
  keyFunc?: (vmobject: VMobject) => string;
  /** Fade duration as fraction of total duration (0-0.5). Default: 0.25 */
  fadeRatio?: number;
  /** Transform unmatched parts (true) or fade them (false). Default: false */
  transformMismatches?: boolean;
}

/**
 * Extract a key for TeX matching.
 * Tries to use the LaTeX string if available, otherwise uses a hash of the shape.
 */
function defaultTexKey(vmobject: VMobject): string {
  // Check if it's a MathTex or Tex with getLatex method
  const maybeTexObj = vmobject as unknown as { getLatex?: () => string };
  if (typeof maybeTexObj.getLatex === 'function') {
    return maybeTexObj.getLatex();
  }

  // For VGroup children, try to identify by position and size
  const box = getBoundingBox(vmobject);
  const sizeKey = `${box.size[0].toFixed(2)}_${box.size[1].toFixed(2)}`;
  const pointCount = vmobject.getPoints().length;

  return `shape_${sizeKey}_${pointCount}`;
}

/**
 * TransformMatchingTex animation - transforms matching TeX parts between expressions.
 * Parts are matched by their LaTeX content or structure.
 * Matched parts transform smoothly, while unmatched parts fade in/out.
 *
 * @example
 * ```typescript
 * // Animate from "x^2 + y^2" to "x^2 + y^2 = r^2"
 * // The "x^2 + y^2" part will transform smoothly
 * // The "= r^2" part will fade in
 * const anim = transformMatchingTex(formula1, formula2);
 * ```
 */
export class TransformMatchingTex extends Animation {
  /** The target mobject to transform into */
  readonly target: VMobject;

  /** Key function for matching */
  readonly keyFunc: (vmobject: VMobject) => string;

  /** Fade duration ratio */
  readonly fadeRatio: number;

  /** Whether to transform mismatches instead of fading */
  readonly transformMismatches: boolean;

  /** Matched parts that will transform */
  private _matchedParts: MatchedPart[] = [];

  /** Source parts that will fade out (no match in target) */
  private _fadeOutParts: FadingPart[] = [];

  /** Target parts that will fade in (no match in source) */
  private _fadeInParts: FadingPart[] = [];

  /** Mismatched pairs that will transform (if transformMismatches is true) */
  private _mismatchedPairs: MatchedPart[] = [];

  constructor(
    source: VMobject,
    target: VMobject,
    options: TransformMatchingTexOptions = {}
  ) {
    super(source, options);
    this.target = target;
    this.keyFunc = options.keyFunc ?? defaultTexKey;
    this.fadeRatio = Math.min(0.5, Math.max(0, options.fadeRatio ?? 0.25));
    this.transformMismatches = options.transformMismatches ?? false;
  }

  /**
   * Get submobjects from a TeX mobject
   */
  private _getTexParts(vmobject: VMobject): VMobject[] {
    // If the mobject has children (like a VGroup of TeX parts), use those
    const children = vmobject.children.filter(c => c instanceof VMobject) as VMobject[];
    if (children.length > 0) {
      // Recursively flatten nested groups
      const result: VMobject[] = [];
      for (const child of children) {
        const childParts = this._getTexParts(child);
        if (childParts.length > 0 && childParts[0] !== child) {
          result.push(...childParts);
        } else {
          result.push(child);
        }
      }
      return result;
    }
    // Treat the mobject itself as a single part
    return [vmobject];
  }

  /**
   * Match TeX parts between source and target
   */
  private _matchTexParts(): void {
    const sourceParts = this._getTexParts(this.mobject as VMobject);
    const targetParts = this._getTexParts(this.target);

    const usedSourceIndices = new Set<number>();
    const usedTargetIndices = new Set<number>();

    // Group parts by key
    const sourceByKey = new Map<string, { vmob: VMobject; index: number }[]>();
    const targetByKey = new Map<string, { vmob: VMobject; index: number }[]>();

    sourceParts.forEach((vmob, index) => {
      const key = this.keyFunc(vmob);
      if (!sourceByKey.has(key)) sourceByKey.set(key, []);
      sourceByKey.get(key)!.push({ vmob, index });
    });

    targetParts.forEach((vmob, index) => {
      const key = this.keyFunc(vmob);
      if (!targetByKey.has(key)) targetByKey.set(key, []);
      targetByKey.get(key)!.push({ vmob, index });
    });

    // Match by key
    for (const [key, sources] of sourceByKey) {
      const targets = targetByKey.get(key);
      if (targets) {
        const matchCount = Math.min(sources.length, targets.length);
        for (let i = 0; i < matchCount; i++) {
          const src = sources[i];
          const tgt = targets[i];
          this._addMatchedPart(src.vmob, tgt.vmob);
          usedSourceIndices.add(src.index);
          usedTargetIndices.add(tgt.index);
        }
      }
    }

    // Handle unmatched parts
    const unmatchedSources: VMobject[] = [];
    const unmatchedTargets: VMobject[] = [];

    for (let i = 0; i < sourceParts.length; i++) {
      if (!usedSourceIndices.has(i)) {
        unmatchedSources.push(sourceParts[i]);
      }
    }

    for (let i = 0; i < targetParts.length; i++) {
      if (!usedTargetIndices.has(i)) {
        unmatchedTargets.push(targetParts[i]);
      }
    }

    if (this.transformMismatches) {
      // Pair up mismatches for transformation
      const pairCount = Math.min(unmatchedSources.length, unmatchedTargets.length);
      for (let i = 0; i < pairCount; i++) {
        this._addMismatchedPair(unmatchedSources[i], unmatchedTargets[i]);
      }

      // Remaining unmatched sources fade out
      for (let i = pairCount; i < unmatchedSources.length; i++) {
        const vmob = unmatchedSources[i];
        this._fadeOutParts.push({
          mobject: vmob,
          fadeIn: false,
          startOpacity: vmob.opacity,
          targetOpacity: 0
        });
      }

      // Remaining unmatched targets fade in
      for (let i = pairCount; i < unmatchedTargets.length; i++) {
        this._addFadeInPart(unmatchedTargets[i]);
      }
    } else {
      // All unmatched sources fade out
      for (const vmob of unmatchedSources) {
        this._fadeOutParts.push({
          mobject: vmob,
          fadeIn: false,
          startOpacity: vmob.opacity,
          targetOpacity: 0
        });
      }

      // All unmatched targets fade in
      for (const vmob of unmatchedTargets) {
        this._addFadeInPart(vmob);
      }
    }
  }

  /**
   * Add a matched pair
   */
  private _addMatchedPart(source: VMobject, target: VMobject): void {
    const srcCopy = source.copy() as VMobject;
    const tgtCopy = target.copy() as VMobject;
    srcCopy.alignPoints(tgtCopy);

    this._matchedParts.push({
      source,
      target,
      startPoints: srcCopy.getPoints(),
      targetPoints: tgtCopy.getPoints(),
      startOpacity: source.opacity,
      targetOpacity: target.opacity
    });

    source.setPoints(srcCopy.getPoints());
  }

  /**
   * Add a mismatched pair for transformation
   */
  private _addMismatchedPair(source: VMobject, target: VMobject): void {
    const srcCopy = source.copy() as VMobject;
    const tgtCopy = target.copy() as VMobject;
    srcCopy.alignPoints(tgtCopy);

    this._mismatchedPairs.push({
      source,
      target,
      startPoints: srcCopy.getPoints(),
      targetPoints: tgtCopy.getPoints(),
      startOpacity: source.opacity,
      targetOpacity: target.opacity
    });

    source.setPoints(srcCopy.getPoints());
  }

  /**
   * Add a fade-in part
   */
  private _addFadeInPart(vmob: VMobject): void {
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
      targetOpacity: vmob.opacity
    });
  }

  override begin(): void {
    super.begin();
    this._matchTexParts();
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

    // Interpolate mismatched pairs with cross-fade
    for (const part of this._mismatchedPairs) {
      const points: number[][] = [];
      for (let i = 0; i < part.startPoints.length; i++) {
        points.push(lerpPoint(part.startPoints[i], part.targetPoints[i], alpha));
      }
      part.source.setPoints(points);

      // Cross-fade effect: fade out then fade in
      if (alpha < 0.5) {
        part.source.opacity = lerp(part.startOpacity, 0, alpha * 2);
      } else {
        part.source.opacity = lerp(0, part.targetOpacity, (alpha - 0.5) * 2);
      }
    }

    // Handle fading parts
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

    // Finalize mismatched pairs
    for (const part of this._mismatchedPairs) {
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

/**
 * Create a TransformMatchingTex animation.
 * @param source The source TeX/MathTex VMobject
 * @param target The target TeX/MathTex VMobject
 * @param options Animation options
 */
export function transformMatchingTex(
  source: VMobject,
  target: VMobject,
  options?: TransformMatchingTexOptions
): TransformMatchingTex {
  return new TransformMatchingTex(source, target, options);
}
