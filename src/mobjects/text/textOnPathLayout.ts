/**
 * Pure layout math for laying glyphs along an arbitrary curve (text-on-a-path).
 *
 * This module has no dependency on fonts or Three.js. It turns a list of glyph
 * advance widths and a sampled path into per-glyph placements (a center point
 * and a rotation angle). `TextOnPath` consumes these placements to position its
 * glyph mobjects, which keeps the geometry independently testable.
 *
 * All distances are arc length in world units. Angles are radians (atan2).
 */

import { evalCubicBezier } from '../../utils/math';
import { getNumCurvesFromPoints } from '../../core/VMobjectCurves';

/** A 3D point `[x, y, z]`. */
export type PathPoint = [number, number, number];

/** Vertical placement of each glyph relative to the curve. */
export type TextOnPathAlignment = 'center' | 'baseline' | 'top';

/** Behavior when a glyph runs past the end of the path. */
export type TextOnPathOverflow = 'clamp' | 'wrap';

/**
 * A path that reports its total arc length and can be sampled by arc-length
 * distance. Built from a cubic Bezier point chain or from a function.
 */
export interface SampledPath {
  /** Total arc length of the path in world units. */
  readonly totalLength: number;
  /** Point at absolute arc-length distance `d` (clamped to `[0, totalLength]`). */
  pointAtDistance(d: number): PathPoint;
  /** Tangent angle (radians) at absolute arc-length distance `d`. */
  angleAtDistance(d: number): number;
}

/** One glyph to place, described only by its advance width and leading gap. */
export interface GlyphLayoutEntry {
  /** Advance width of the glyph in world units. */
  width: number;
  /** Extra gap before this glyph (spaces, kerning). Default 0. */
  leadingGap?: number;
}

/** Options that drive {@link computeGlyphPlacements}. */
export interface GlyphLayoutOptions {
  /** Arc-length distance where the run starts. Default 0. */
  startOffset?: number;
  /** Extra spacing added after every glyph. Default 0. */
  tracking?: number;
  /** Rotate each glyph to the path tangent. Default true. */
  rotateWithTangent?: boolean;
  /** Perpendicular offset from the curve (world units). Default 0. */
  alignmentOffset?: number;
  /** Clamp to the ends or wrap around the path. Default 'clamp'. */
  overflow?: TextOnPathOverflow;
}

/** The computed placement of one glyph along the path. */
export interface GlyphPlacement {
  /** World point where the glyph center sits. */
  center: PathPoint;
  /** Rotation angle in radians (0 when `rotateWithTangent` is false). */
  angle: number;
  /** Arc-length distance of the glyph center before clamp or wrap. */
  distance: number;
  /** True when the glyph center ran past an end of the path. */
  overflow: boolean;
}

/** Minimum half-width used for the central-difference tangent estimate. */
const MIN_TANGENT_EPS = 1e-4;

/** Build the tangent-angle function from a point sampler and a total length. */
function makeAngleFn(
  pointAtDistance: (d: number) => PathPoint,
  totalLength: number,
): (d: number) => number {
  return (d: number): number => {
    if (totalLength <= 0) return 0;
    const eps = Math.max(totalLength * 1e-3, MIN_TANGENT_EPS);
    let d0 = d - eps;
    let d1 = d + eps;
    if (d0 < 0) d0 = 0;
    if (d1 > totalLength) d1 = totalLength;
    if (d1 <= d0) {
      // Degenerate window at a single point: widen toward the interior.
      d0 = Math.max(0, d1 - eps);
    }
    const p0 = pointAtDistance(d0);
    const p1 = pointAtDistance(d1);
    return Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  };
}

/**
 * Build a {@link SampledPath} from a shared-anchor cubic Bezier point chain
 * (the point layout every VMobject uses).
 *
 * @param points - Point chain `[A0, H1, H2, A1, H3, H4, A2, ...]`
 * @param samplesPerSegment - Samples per cubic for the arc-length table
 */
export function sampledPathFromPoints(points: number[][], samplesPerSegment = 20): SampledPath {
  const numCurves = points.length >= 4 ? getNumCurvesFromPoints(points) : 0;

  // Per-segment sampled points and cumulative arc length at each sample.
  const segmentPoints: PathPoint[][] = [];
  const segmentCumLengths: number[][] = [];
  let totalLength = 0;

  for (let c = 0; c < numCurves; c++) {
    const i = c * 3;
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];
    const pts: PathPoint[] = [];
    const cum: number[] = [];
    let prev: PathPoint = [p0[0], p0[1], p0[2] ?? 0];
    pts.push(prev);
    cum.push(totalLength);
    for (let s = 1; s <= samplesPerSegment; s++) {
      const raw = evalCubicBezier(p0, p1, p2, p3, s / samplesPerSegment);
      const curr: PathPoint = [raw[0], raw[1], raw[2] ?? 0];
      const dx = curr[0] - prev[0];
      const dy = curr[1] - prev[1];
      const dz = curr[2] - prev[2];
      totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
      pts.push(curr);
      cum.push(totalLength);
      prev = curr;
    }
    segmentPoints.push(pts);
    segmentCumLengths.push(cum);
  }

  const first: PathPoint =
    points.length > 0 ? [points[0][0], points[0][1], points[0][2] ?? 0] : [0, 0, 0];

  const pointAtDistance = (d: number): PathPoint => {
    if (numCurves === 0 || totalLength <= 0) return [first[0], first[1], first[2]];
    const target = Math.min(Math.max(d, 0), totalLength);
    for (let c = 0; c < numCurves; c++) {
      const cum = segmentCumLengths[c];
      const segEnd = cum[cum.length - 1];
      if (target > segEnd && c < numCurves - 1) continue;
      const pts = segmentPoints[c];
      for (let s = 1; s < cum.length; s++) {
        if (target <= cum[s] || s === cum.length - 1) {
          const span = cum[s] - cum[s - 1];
          const t = span > 0 ? (target - cum[s - 1]) / span : 0;
          const a = pts[s - 1];
          const b = pts[s];
          return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        }
      }
    }
    return [first[0], first[1], first[2]];
  };

  return {
    totalLength,
    pointAtDistance,
    angleAtDistance: makeAngleFn(pointAtDistance, totalLength),
  };
}

/**
 * Build a {@link SampledPath} from a parametric function `t -> [x, y, z]`,
 * `t` in `[0, 1]`.
 *
 * @param fn - Parametric curve function
 * @param samples - Number of sample segments (default 200)
 */
export function sampledPathFromFunction(fn: (t: number) => number[], samples = 200): SampledPath {
  const count = Math.max(samples, 1);
  const pts: PathPoint[] = [];
  const cum: number[] = [];
  let totalLength = 0;
  let prev: PathPoint | null = null;
  for (let s = 0; s <= count; s++) {
    const raw = fn(s / count);
    const curr: PathPoint = [raw[0], raw[1], raw[2] ?? 0];
    if (prev) {
      const dx = curr[0] - prev[0];
      const dy = curr[1] - prev[1];
      const dz = curr[2] - prev[2];
      totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    pts.push(curr);
    cum.push(totalLength);
    prev = curr;
  }

  const first = pts[0] ?? ([0, 0, 0] as PathPoint);

  const pointAtDistance = (d: number): PathPoint => {
    if (totalLength <= 0) return [first[0], first[1], first[2]];
    const target = Math.min(Math.max(d, 0), totalLength);
    for (let s = 1; s < cum.length; s++) {
      if (target <= cum[s] || s === cum.length - 1) {
        const span = cum[s] - cum[s - 1];
        const t = span > 0 ? (target - cum[s - 1]) / span : 0;
        const a = pts[s - 1];
        const b = pts[s];
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      }
    }
    return [first[0], first[1], first[2]];
  };

  return {
    totalLength,
    pointAtDistance,
    angleAtDistance: makeAngleFn(pointAtDistance, totalLength),
  };
}

/**
 * Place glyphs along a path by advancing a pen along the arc length.
 *
 * Each glyph center is set at `pen + leadingGap + width / 2`, where `pen`
 * advances by `width + tracking` after every glyph. A glyph whose center runs
 * past an end is marked `overflow` and is either clamped to the nearest end or
 * wrapped around the path, per `options.overflow`.
 *
 * @param glyphs - Glyph advance widths and leading gaps, in order
 * @param path - The path to lay the glyphs on
 * @param options - Layout options (see {@link GlyphLayoutOptions})
 * @returns One placement per input glyph
 */
export function computeGlyphPlacements(
  glyphs: GlyphLayoutEntry[],
  path: SampledPath,
  options: GlyphLayoutOptions = {},
): GlyphPlacement[] {
  const startOffset = options.startOffset ?? 0;
  const tracking = options.tracking ?? 0;
  const rotateWithTangent = options.rotateWithTangent ?? true;
  const alignmentOffset = options.alignmentOffset ?? 0;
  const overflow = options.overflow ?? 'clamp';
  const total = path.totalLength;

  const placements: GlyphPlacement[] = [];
  let pen = startOffset;

  for (const glyph of glyphs) {
    pen += glyph.leadingGap ?? 0;
    const centerDistance = pen + glyph.width / 2;
    const didOverflow = total > 0 && (centerDistance > total || centerDistance < 0);

    let sampleDistance: number;
    if (didOverflow && overflow === 'wrap' && total > 0) {
      sampleDistance = ((centerDistance % total) + total) % total;
    } else {
      sampleDistance = Math.min(Math.max(centerDistance, 0), total);
    }

    const base = path.pointAtDistance(sampleDistance);
    const tangentAngle = path.angleAtDistance(sampleDistance);

    let center: PathPoint = base;
    if (alignmentOffset !== 0) {
      // Perpendicular to the tangent (rotate tangent by +90 degrees).
      const nx = -Math.sin(tangentAngle);
      const ny = Math.cos(tangentAngle);
      center = [base[0] + nx * alignmentOffset, base[1] + ny * alignmentOffset, base[2]];
    }

    placements.push({
      center,
      angle: rotateWithTangent ? tangentAngle : 0,
      distance: centerDistance,
      overflow: didOverflow,
    });

    pen += glyph.width + tracking;
  }

  return placements;
}

/**
 * The visible (non-whitespace) characters of a string, in order.
 * Whitespace advances the pen but draws no glyph, so it is excluded here.
 *
 * @param text - Input string
 * @returns Array of visible characters
 */
export function visibleGlyphChars(text: string): string[] {
  return Array.from(text).filter((char) => char.trim().length > 0);
}

/**
 * Map an {@link TextOnPathAlignment} to a perpendicular offset from the curve.
 *
 * `center` keeps the glyph center on the curve. `baseline` lifts it to the
 * positive-perpendicular side (baseline near the curve) and `top` lowers it,
 * each by `height / 2`.
 *
 * @param alignment - Alignment mode
 * @param height - Representative glyph height in world units
 * @returns Perpendicular offset in world units
 */
export function alignmentToOffset(alignment: TextOnPathAlignment, height: number): number {
  if (alignment === 'baseline') return height / 2;
  if (alignment === 'top') return -height / 2;
  return 0;
}
