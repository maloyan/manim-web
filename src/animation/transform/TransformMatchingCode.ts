/**
 * TransformMatchingCode - animate between two Code blocks by matching tokens.
 *
 * ManimCE issue #4103: transforming a Code mobject redraws the whole block
 * instead of animating only the lines or tokens that changed. This animation
 * fixes that in the browser, in the spirit of Motion Canvas:
 *
 * - Unchanged tokens (matched by content) move to their new position.
 * - Removed tokens (in the source only) fade out.
 * - Added tokens (in the target only) fade in.
 *
 * It mirrors the design of TransformMatchingTex and TransformMatchingShapes
 * (key-based matching, a `keyFunc` override, a `fadeRatio`, and a
 * `transformMismatches` option) but works at the token/line level of the Code
 * mobject instead of at the vector-path level, because a Code block renders to
 * a single texture rather than to per-token submobjects.
 */

import { Animation, AnimationOptions } from '../Animation';
import { Code } from '../../mobjects/text/Code';
import { CodeToken } from '../../mobjects/text/CodeTokenLayout';
import { Vector3Tuple } from '../../core/Mobject';
import { lerp, lerpPoint } from '../../utils/math';

/** Which unit the matcher pairs: whole lines, or individual tokens. */
export type CodeMatchBy = 'token' | 'line';

export interface TransformMatchingCodeOptions extends AnimationOptions {
  /**
   * Key function for matching. Units with the same key match. Default keys a
   * token by its syntax type and text, so unchanged tokens match even when
   * they move.
   */
  keyFunc?: (token: CodeToken) => string;
  /** Fade duration as a fraction of the total duration (0 to 0.5). Default: 0.25. */
  fadeRatio?: number;
  /** Match whole lines or individual tokens. Default: 'token'. */
  matchBy?: CodeMatchBy;
  /**
   * Transform unmatched units into each other (true) instead of fading them
   * (false). Leftover units still fade. Default: false.
   */
  transformMismatches?: boolean;
  /**
   * When transforming mismatches, cross-fade the moving unit (fade out, then
   * fade in) instead of keeping it fully visible. Default: false.
   */
  fadeTransformMismatches?: boolean;
}

/** A matched (or transformed-mismatch) unit that moves between positions. */
export interface CodeMatchedPart {
  /** The token mobject that moves. */
  mobject: Code;
  /** Start position (from the source). */
  startPosition: Vector3Tuple;
  /** End position (from the target). */
  targetPosition: Vector3Tuple;
  /** Opacity at the start. */
  startOpacity: number;
  /** Opacity at the end. */
  targetOpacity: number;
}

/** A unit that only fades (in or out). */
export interface CodeFadingPart {
  /** The token mobject that fades. */
  mobject: Code;
  /** Opacity at the start. */
  startOpacity: number;
  /** Opacity at the end. */
  targetOpacity: number;
  /** True for a fade in, false for a fade out. */
  fadeIn: boolean;
}

const DEFAULT_FADE_RATIO = 0.25;
const FULL_OPACITY = 1;

export class TransformMatchingCode extends Animation<Code> {
  /** The target Code block to transform into. */
  readonly target: Code;

  /** Optional key function for matching. */
  readonly keyFunc?: (token: CodeToken) => string;

  /** Fade duration ratio, clamped to [0, 0.5]. */
  readonly fadeRatio: number;

  /** Whether lines or tokens are matched. */
  readonly matchBy: CodeMatchBy;

  /** Whether unmatched units are transformed instead of faded. */
  readonly transformMismatches: boolean;

  /** Whether transformed mismatches cross-fade. */
  readonly fadeTransformMismatches: boolean;

  private readonly _matchedParts: CodeMatchedPart[] = [];
  private readonly _mismatchedParts: CodeMatchedPart[] = [];
  private readonly _fadeOutParts: CodeFadingPart[] = [];
  private readonly _fadeInParts: CodeFadingPart[] = [];

  constructor(source: Code, target: Code, options: TransformMatchingCodeOptions = {}) {
    super(source, options);
    this.target = target;
    this.keyFunc = options.keyFunc;
    this.fadeRatio = Math.min(0.5, Math.max(0, options.fadeRatio ?? DEFAULT_FADE_RATIO));
    this.matchBy = options.matchBy ?? 'token';
    this.transformMismatches = options.transformMismatches ?? false;
    this.fadeTransformMismatches = options.fadeTransformMismatches ?? false;
  }

  /** Matched units (unchanged tokens or lines). */
  get matchedParts(): readonly CodeMatchedPart[] {
    return this._matchedParts;
  }

  /** Transformed mismatched units (only when `transformMismatches` is set). */
  get mismatchedParts(): readonly CodeMatchedPart[] {
    return this._mismatchedParts;
  }

  /** Units that fade out (removed from the source). */
  get fadeOutParts(): readonly CodeFadingPart[] {
    return this._fadeOutParts;
  }

  /** Units that fade in (added in the target). */
  get fadeInParts(): readonly CodeFadingPart[] {
    return this._fadeInParts;
  }

  /**
   * Decompose a Code block into match units. In 'token' mode each token is a
   * unit; in 'line' mode all tokens of a line collapse into one unit.
   */
  private _units(code: Code): CodeToken[] {
    const tokens = code.getCodeTokens();
    if (this.matchBy === 'token') {
      return tokens;
    }

    const byLine = new Map<number, CodeToken[]>();
    for (const token of tokens) {
      const bucket = byLine.get(token.line);
      if (bucket) {
        bucket.push(token);
      } else {
        byLine.set(token.line, [token]);
      }
    }

    const units: CodeToken[] = [];
    for (const [line, lineTokens] of byLine) {
      units.push({
        text: lineTokens.map((t) => t.text).join(''),
        type: 'default',
        line,
        tokenIndex: 0,
        position: lineTokens[0].position,
      });
    }
    return units;
  }

  /** The matching key for a unit. */
  private _key(token: CodeToken): string {
    if (this.keyFunc) {
      return this.keyFunc(token);
    }
    return `${token.type}\u0000${token.text}`;
  }

  private _groupByKey(units: CodeToken[]): Map<string, { unit: CodeToken; index: number }[]> {
    const map = new Map<string, { unit: CodeToken; index: number }[]>();
    units.forEach((unit, index) => {
      const key = this._key(unit);
      const bucket = map.get(key);
      if (bucket) {
        bucket.push({ unit, index });
      } else {
        map.set(key, [{ unit, index }]);
      }
    });
    return map;
  }

  /** Match source and target units and build the animated parts. */
  private _matchUnits(sourceUnits: CodeToken[], targetUnits: CodeToken[]): void {
    const sourceByKey = this._groupByKey(sourceUnits);
    const targetByKey = this._groupByKey(targetUnits);

    const usedSource = new Set<number>();
    const usedTarget = new Set<number>();

    for (const [key, sources] of sourceByKey) {
      const targets = targetByKey.get(key);
      if (!targets) continue;
      const matchCount = Math.min(sources.length, targets.length);
      for (let i = 0; i < matchCount; i++) {
        this._addMatchedPart(sources[i].unit, targets[i].unit, this._matchedParts);
        usedSource.add(sources[i].index);
        usedTarget.add(targets[i].index);
      }
    }

    const unmatchedSource = sourceUnits.filter((_, i) => !usedSource.has(i));
    const unmatchedTarget = targetUnits.filter((_, i) => !usedTarget.has(i));

    if (this.transformMismatches && unmatchedSource.length > 0 && unmatchedTarget.length > 0) {
      const pairCount = Math.min(unmatchedSource.length, unmatchedTarget.length);
      for (let i = 0; i < pairCount; i++) {
        this._addMatchedPart(unmatchedSource[i], unmatchedTarget[i], this._mismatchedParts);
      }
      for (let i = pairCount; i < unmatchedSource.length; i++) {
        this._addFadeOutPart(unmatchedSource[i]);
      }
      for (let i = pairCount; i < unmatchedTarget.length; i++) {
        this._addFadeInPart(unmatchedTarget[i]);
      }
    } else {
      for (const unit of unmatchedSource) {
        this._addFadeOutPart(unit);
      }
      for (const unit of unmatchedTarget) {
        this._addFadeInPart(unit);
      }
    }
  }

  private _place(mobject: Code, position: Vector3Tuple): void {
    mobject.position.set(position[0], position[1], position[2]);
    mobject._markDirty();
  }

  private _parentAdd(mobject: Code): void {
    const parent = this.mobject.parent;
    if (parent) {
      parent.add(mobject);
    }
  }

  private _addMatchedPart(source: CodeToken, target: CodeToken, into: CodeMatchedPart[]): void {
    const mobject = this.mobject.makeTokenMobject(source.text, source.type);
    this._place(mobject, source.position);
    mobject.opacity = FULL_OPACITY;
    this._parentAdd(mobject);
    into.push({
      mobject,
      startPosition: source.position,
      targetPosition: target.position,
      startOpacity: FULL_OPACITY,
      targetOpacity: FULL_OPACITY,
    });
  }

  private _addFadeOutPart(source: CodeToken): void {
    const mobject = this.mobject.makeTokenMobject(source.text, source.type);
    this._place(mobject, source.position);
    mobject.opacity = FULL_OPACITY;
    this._parentAdd(mobject);
    this._fadeOutParts.push({
      mobject,
      startOpacity: FULL_OPACITY,
      targetOpacity: 0,
      fadeIn: false,
    });
  }

  private _addFadeInPart(target: CodeToken): void {
    const mobject = this.target.makeTokenMobject(target.text, target.type);
    this._place(mobject, target.position);
    mobject.opacity = 0;
    this._parentAdd(mobject);
    this._fadeInParts.push({
      mobject,
      startOpacity: 0,
      targetOpacity: FULL_OPACITY,
      fadeIn: true,
    });
  }

  override begin(): void {
    super.begin();
    this._matchUnits(this._units(this.mobject), this._units(this.target));
    // Hide the original blocks; the token mobjects carry the animation.
    this.mobject.opacity = 0;
    this.target.opacity = 0;
  }

  private _moveTo(part: CodeMatchedPart, alpha: number): void {
    const point = lerpPoint(part.startPosition, part.targetPosition, alpha);
    part.mobject.position.set(point[0], point[1], point[2]);
    part.mobject._markDirty();
  }

  interpolate(alpha: number): void {
    for (const part of this._matchedParts) {
      this._moveTo(part, alpha);
      part.mobject.opacity = lerp(part.startOpacity, part.targetOpacity, alpha);
    }

    for (const part of this._mismatchedParts) {
      this._moveTo(part, alpha);
      if (this.fadeTransformMismatches) {
        part.mobject.opacity =
          alpha < 0.5
            ? lerp(part.startOpacity, 0, alpha * 2)
            : lerp(0, part.targetOpacity, (alpha - 0.5) * 2);
      } else {
        part.mobject.opacity = lerp(part.startOpacity, part.targetOpacity, alpha);
      }
    }

    const fadeOutAlpha =
      this.fadeRatio > 0 ? Math.min(1, alpha / this.fadeRatio) : alpha > 0 ? 1 : 0;
    const fadeInStart = 1 - this.fadeRatio;
    const fadeInAlpha =
      this.fadeRatio > 0 ? Math.max(0, (alpha - fadeInStart) / this.fadeRatio) : alpha >= 1 ? 1 : 0;

    for (const part of this._fadeOutParts) {
      part.mobject.opacity = lerp(part.startOpacity, 0, Math.min(1, fadeOutAlpha));
    }

    for (const part of this._fadeInParts) {
      part.mobject.opacity = lerp(0, part.targetOpacity, Math.min(1, fadeInAlpha));
    }
  }

  override finish(): void {
    for (const part of [...this._matchedParts, ...this._mismatchedParts]) {
      part.mobject.position.set(
        part.targetPosition[0],
        part.targetPosition[1],
        part.targetPosition[2],
      );
      part.mobject._markDirty();
      part.mobject.opacity = part.targetOpacity;
    }

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
 * Create a {@link TransformMatchingCode} animation.
 *
 * @param source - The source Code block.
 * @param target - The target Code block.
 * @param options - Animation options.
 * @returns The animation.
 */
export function transformMatchingCode(
  source: Code,
  target: Code,
  options?: TransformMatchingCodeOptions,
): TransformMatchingCode {
  return new TransformMatchingCode(source, target, options);
}
