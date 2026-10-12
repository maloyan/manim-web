/**
 * Hand-drawn / sketch (rough.js / xkcd) stroke style for VMobjects.
 *
 * `sketch(mobject, options)` returns a NEW VMobject whose path is a perturbed,
 * hand-drawn version of the source. The source is never changed. The algorithm
 * reads the path as an anchor polyline, jitters each vertex with a seeded PRNG,
 * then subdivides every edge and bows it to the side. Both the jitter and the
 * bow scale with `roughness`, so `roughness = 0` reproduces the source shape.
 *
 * The output keeps the source type, stroke and fill style, so it drops in for
 * the original. Container mobjects (text with glyphs, SVG, groups) are handled
 * best-effort: every family member that owns points is sketched.
 */

import { VMobject } from '../../core/VMobject';
import { anchorsFromPoints } from '../../core/VMobjectCurveMath';

/** Options for {@link sketch}. */
export interface SketchOptions {
  /** Deviation scale. 0 keeps the source shape; 1 is a normal hand-drawn look. */
  roughness?: number;
  /** Side-bow of each edge, as a fraction of the edge length. */
  bowing?: number;
  /** Random stroke-width change, as a fraction of the source width (0..1). */
  strokeWidthJitter?: number;
  /** PRNG seed. The same seed gives the same output. */
  seed?: number;
  /** Number of overlapping strokes (1 or 2). 2 gives a double-stroke look. */
  strokes?: 1 | 2;
  /** Straight sub-segments per edge. More segments give a finer wobble. */
  segments?: number;
}

interface ResolvedOptions {
  roughness: number;
  bowing: number;
  strokeWidthJitter: number;
  seed: number;
  strokes: 1 | 2;
  segments: number;
}

/** Jitter of a vertex, as a fraction of the path's bounding-box diagonal. */
const VERTEX_JITTER = 0.02;
/** Random wobble of an interior sub-point, as a fraction of the edge length. */
const INTERIOR_JITTER = 0.015;
/** Side-bow of an interior sub-point, as a fraction of the edge length. */
const BOW_SCALE = 0.05;
/** Distance below which two anchors count as the same point (a closed path). */
const CLOSE_EPSILON = 1e-6;

/** A `mulberry32` PRNG. One seed gives a deterministic stream of 0..1 floats. */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function resolveOptions(options: SketchOptions): ResolvedOptions {
  return {
    roughness: options.roughness ?? 1,
    bowing: options.bowing ?? 1,
    strokeWidthJitter: options.strokeWidthJitter ?? 0,
    seed: options.seed ?? 1,
    strokes: options.strokes ?? 1,
    segments: Math.max(1, Math.floor(options.segments ?? 8)),
  };
}

/** Bounding-box diagonal of a point list. Zero for an empty or single point. */
function boundsDiagonal(points: number[][]): number {
  if (points.length === 0) return 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  return Math.hypot(maxX - minX, maxY - minY);
}

/** Convert a corner polyline into a cubic-bezier point list with linear handles. */
function cornersToBezier(corners: number[][]): number[][] {
  if (corners.length < 2) return corners.map((p) => [...p]);
  const points: number[][] = [[...corners[0]]];
  for (let i = 0; i < corners.length - 1; i++) {
    const a = corners[i];
    const b = corners[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = (b[2] ?? 0) - (a[2] ?? 0);
    points.push([a[0] + dx / 3, a[1] + dy / 3, (a[2] ?? 0) + dz / 3]);
    points.push([a[0] + (2 * dx) / 3, a[1] + (2 * dy) / 3, (a[2] ?? 0) + (2 * dz) / 3]);
    points.push([b[0], b[1], b[2] ?? 0]);
  }
  return points;
}

/**
 * Perturb one path's bezier point list into a single hand-drawn stroke.
 *
 * Reads the path as an anchor polyline, jitters each vertex once, then
 * subdivides and bows each edge. Both the jitter and the bow scale with
 * `roughness`, so `roughness = 0` returns the source polyline unchanged in
 * shape (only denser). A closed path stays closed. The source is not changed.
 *
 * @param points - Source bezier point list (`[a, h1, h2, a, ...]`)
 * @param opts - Resolved sketch options
 * @param rng - Seeded PRNG, advanced in place
 * @returns A new bezier point list for the stroke
 */
function sketchStroke(points: number[][], opts: ResolvedOptions, rng: () => number): number[][] {
  const anchors = anchorsFromPoints(points);
  if (anchors.length < 2) return points.map((p) => [...p]);

  const closed =
    Math.hypot(
      anchors[0][0] - anchors[anchors.length - 1][0],
      anchors[0][1] - anchors[anchors.length - 1][1],
    ) < CLOSE_EPSILON;

  const diagonal = boundsDiagonal(anchors);
  const vertexAmp = opts.roughness * VERTEX_JITTER * diagonal;

  // Jitter each vertex once so a shared corner is perturbed consistently.
  const lastIndex = anchors.length - 1;
  const jittered = anchors.map((a, i) => {
    const endpoint = !closed && (i === 0 || i === lastIndex);
    const amp = vertexAmp * (endpoint ? 0.5 : 1);
    return [a[0] + (rng() * 2 - 1) * amp, a[1] + (rng() * 2 - 1) * amp, a[2] ?? 0];
  });
  // Re-close so a closed source stays exactly closed after jitter.
  if (closed) jittered[lastIndex] = [...jittered[0]];

  const corners: number[][] = [[...jittered[0]]];
  for (let i = 0; i < jittered.length - 1; i++) {
    const a = jittered[i];
    const b = jittered[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const length = Math.hypot(dx, dy);
    // Unit perpendicular in the xy plane for the side-bow and wobble.
    const px = length > 1e-12 ? -dy / length : 0;
    const py = length > 1e-12 ? dx / length : 0;
    for (let j = 1; j <= opts.segments; j++) {
      const t = j / opts.segments;
      const baseX = a[0] + dx * t;
      const baseY = a[1] + dy * t;
      const baseZ = (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * t;
      const bow = opts.bowing * opts.roughness * BOW_SCALE * length * Math.sin(Math.PI * t);
      // Keep the end vertex exact; wobble only interior sub-points.
      const wobble =
        j < opts.segments ? opts.roughness * INTERIOR_JITTER * length * (rng() * 2 - 1) : 0;
      const offset = bow + wobble;
      corners.push([baseX + px * offset, baseY + py * offset, baseZ]);
    }
  }
  if (closed) corners[corners.length - 1] = [...corners[0]];

  return cornersToBezier(corners);
}

/** Replace one member's points with its sketched stroke(s) and style jitter. */
function sketchMember(member: VMobject, opts: ResolvedOptions, memberSeed: number): void {
  const source = member.getLocalPoints();
  const rng = mulberry32(memberSeed);

  const strokeOne = sketchStroke(source, opts, rng);
  if (opts.strokes === 2) {
    const strokeTwo = sketchStroke(source, opts, rng);
    member.setPoints(strokeOne.concat(strokeTwo));
    member.setBaseSubpathLengths([strokeOne.length, strokeTwo.length]);
  } else {
    member.setPoints(strokeOne);
  }

  if (opts.strokeWidthJitter > 0) {
    const factor = 1 + (rng() * 2 - 1) * opts.strokeWidthJitter;
    member.strokeWidth = Math.max(0, member.strokeWidth * factor);
  }
}

/**
 * Return a hand-drawn (sketch) copy of a VMobject.
 *
 * The source is copied first, so it is never changed. Every family member that
 * owns points is perturbed with a seeded PRNG, which keeps the output
 * deterministic for a given seed. The copy keeps the source type, stroke and
 * fill style, so it is a drop-in replacement.
 *
 * @param mobject - Source VMobject (line, polygon, circle, text, group, ...)
 * @param options - Sketch options; see {@link SketchOptions}
 * @returns A new VMobject with the hand-drawn path
 */
export function sketch<T extends VMobject>(mobject: T, options: SketchOptions = {}): T {
  const opts = resolveOptions(options);
  const result = mobject.copy() as T;
  const members = result.familyMembersWithPoints();
  members.forEach((member, index) => {
    // A distinct per-member seed so glyphs differ, deterministic for one seed.
    sketchMember(member, opts, (opts.seed + index * 0x9e3779b1) | 0);
  });
  return result;
}
