/**
 * Pure math for VMobject.roundCorners (Manim CE's `round_corners`).
 *
 * This module holds only pure functions over point arrays (`number[][]`). It
 * builds no VMobject instances, so it has no import cycle with VMobject.ts. The
 * VMobject class imports `roundCornersPoints` and wraps it as a method.
 *
 * Point layout (shared-anchor cubic Bezier chain, matching VMobject):
 *   [A0, H1, H2, A1, H3, H4, A2, ...]
 * A chain of n cubics has 3n+1 points and n+1 anchors. This differs from CE's
 * 4-points-per-cubic layout: here consecutive cubics share one anchor.
 *
 * Algorithm (per corner vertex V with incoming edge from A and outgoing edge
 * to B): move back from V along both edges by one offset `d`, then join the two
 * offset points with a circular arc tangent to both edges. The offset is
 * clamped to half of the shorter adjacent edge so arcs on short edges never
 * overlap. The arc bulges to the side set by the sign of the turn, so convex
 * and reflex corners both round correctly. A collinear corner and a zero
 * radius leave the corner sharp. An open path keeps its two end vertices sharp.
 */

import { anchorsFromPoints } from './VMobjectCurveMath';
import { isClosedPath } from './VMobjectGeometry';

/** Cubic segments per rounded corner (Manim CE default). */
const DEFAULT_COMPONENTS_PER_CORNER = 2;

/** Below this edge length a corner is degenerate and stays sharp. */
const MIN_EDGE_LENGTH = 1e-9;

/** Below this turn angle a corner is collinear and stays sharp. */
const MIN_TURN_ANGLE = 1e-7;

/**
 * A corner's inserted geometry as a shared-anchor sub-chain. For a rounded
 * corner it is the arc `[P1, H, H, A, ..., P2]`. For a sharp corner it is the
 * single vertex `[V]`.
 */
type CornerChain = number[][];

/** Copy a point as a 3-tuple, defaulting a missing z to 0. */
function copyPoint(p: number[]): number[] {
  return [p[0], p[1], p[2] ?? 0];
}

/** Linear interpolation of two points at parameter t. */
function lerpPoint2(a: number[], b: number[], t: number): number[] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * t,
  ];
}

/**
 * Build the arc that rounds one corner, or the single vertex when the corner
 * stays sharp.
 *
 * @param prev - Previous vertex A (incoming edge start)
 * @param corner - Corner vertex V
 * @param next - Next vertex B (outgoing edge end)
 * @param radius - Requested corner radius (> 0)
 * @param segments - Cubic segments to split the arc into
 * @returns A corner sub-chain in shared-anchor layout
 */
function buildCorner(
  prev: number[],
  corner: number[],
  next: number[],
  radius: number,
  segments: number,
): CornerChain {
  const v: number[] = copyPoint(corner);
  const inX = v[0] - prev[0];
  const inY = v[1] - prev[1];
  const outX = next[0] - v[0];
  const outY = next[1] - v[1];

  const inLen = Math.hypot(inX, inY);
  const outLen = Math.hypot(outX, outY);
  if (inLen < MIN_EDGE_LENGTH || outLen < MIN_EDGE_LENGTH) {
    return [v];
  }

  const u1x = inX / inLen;
  const u1y = inY / inLen;
  const u2x = outX / outLen;
  const u2y = outY / outLen;

  // Signed turn angle from the incoming edge to the outgoing edge. Positive is
  // a left (counter-clockwise) turn; the sign selects the bulge side.
  const cross = u1x * u2y - u1y * u2x;
  const dot = u1x * u2x + u1y * u2y;
  const turn = Math.atan2(cross, dot);
  const absTurn = Math.abs(turn);

  // Collinear continuation, or a full reversal (a spike) whose offset tangent
  // is unbounded: leave the vertex sharp.
  if (absTurn < MIN_TURN_ANGLE || absTurn > Math.PI - MIN_TURN_ANGLE) {
    return [v];
  }

  // Offset from V to each tangent point: d = radius * tan(absTurn / 2). Clamp
  // d to half the shorter adjacent edge so neighbouring arcs cannot overlap,
  // then recompute the effective radius so the arc stays tangent to both edges.
  const halfTurnTan = Math.tan(absTurn / 2);
  const maxOffset = 0.5 * Math.min(inLen, outLen);
  const offset = Math.min(radius * halfTurnTan, maxOffset);
  const effRadius = offset / halfTurnTan;

  // Tangent points on the two edges.
  const p1: number[] = [v[0] - u1x * offset, v[1] - u1y * offset, v[2]];
  const p2: number[] = [v[0] + u2x * offset, v[1] + u2y * offset, v[2]];

  // Arc centre: perpendicular to the incoming tangent at P1, on the turn side.
  const sign = Math.sign(turn);
  const cx = p1[0] + effRadius * sign * -u1y;
  const cy = p1[1] + effRadius * sign * u1x;

  const startAngle = Math.atan2(p1[1] - cy, p1[0] - cx);
  return buildArcChain(p1, p2, cx, cy, effRadius, startAngle, turn, v[2], segments);
}

/**
 * Approximate a circular arc as a shared-anchor cubic Bezier sub-chain.
 *
 * The arc runs from `start` to `end` around centre `(cx, cy)` with the given
 * radius, starting at `startAngle` and sweeping `sweep` radians. Each cubic
 * uses the kappa = (4/3) tan(theta/4) handle length, the same approximation as
 * Arc and RoundedRectangle. The endpoints are forced to `start` and `end` so
 * they match the adjacent straight edges exactly.
 */
function buildArcChain(
  start: number[],
  end: number[],
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  sweep: number,
  z: number,
  segments: number,
): number[][] {
  const seg = sweep / segments;
  const kappa = (4 / 3) * Math.tan(seg / 4);
  const pts: number[][] = [];

  for (let i = 0; i < segments; i++) {
    const t1 = startAngle + i * seg;
    const t2 = startAngle + (i + 1) * seg;

    const x0 = cx + radius * Math.cos(t1);
    const y0 = cy + radius * Math.sin(t1);
    const x3 = cx + radius * Math.cos(t2);
    const y3 = cy + radius * Math.sin(t2);

    const x1 = x0 - kappa * radius * Math.sin(t1);
    const y1 = y0 + kappa * radius * Math.cos(t1);
    const x2 = x3 + kappa * radius * Math.sin(t2);
    const y2 = y3 - kappa * radius * Math.cos(t2);

    if (i === 0) pts.push([x0, y0, z]);
    pts.push([x1, y1, z], [x2, y2, z], [x3, y3, z]);
  }

  // Pin the endpoints to the exact tangent points to remove rounding drift.
  pts[0] = copyPoint(start);
  pts[pts.length - 1] = copyPoint(end);
  return pts;
}

/**
 * Append a straight cubic from the chain's current last point to `to`.
 * The two handles sit at the 1/3 and 2/3 points, matching setPointsAsCorners.
 */
function appendLine(result: number[][], to: number[]): void {
  const from = result[result.length - 1];
  result.push(lerpPoint2(from, to, 1 / 3));
  result.push(lerpPoint2(from, to, 2 / 3));
  result.push(copyPoint(to));
}

/** Append a corner sub-chain after its shared start anchor (already present). */
function appendCornerTail(result: number[][], corner: CornerChain): void {
  for (let i = 1; i < corner.length; i++) {
    result.push(copyPoint(corner[i]));
  }
}

/**
 * Replace each sharp corner of a polygonal point chain with a circular arc of
 * the given radius (Manim CE's `round_corners`).
 *
 * The chain is read as a polygon through its anchors; edges are straight lines
 * between anchors. Convex and reflex corners both round, with the arc bulging
 * to the side set by the turn sign. Collinear corners and a non-positive radius
 * leave the chain unchanged. A closed path rounds every vertex; an open path
 * keeps its first and last vertices sharp.
 *
 * @param points - Source shared-anchor cubic Bezier chain
 * @param radius - Corner radius; <= 0 returns a copy unchanged
 * @param componentsPerCorner - Cubic segments per rounded corner (default 2)
 * @returns A new shared-anchor chain with rounded corners
 */
export function roundCornersPoints(
  points: number[][],
  radius: number,
  componentsPerCorner: number = DEFAULT_COMPONENTS_PER_CORNER,
): number[][] {
  if (radius <= 0 || points.length < 4) {
    return points.map(copyPoint);
  }

  const closed = isClosedPath(points);
  const anchors = anchorsFromPoints(points).map(copyPoint);

  // A closed chain repeats its first anchor at the end; drop the duplicate so
  // each vertex appears once.
  const vertices = closed ? anchors.slice(0, -1) : anchors;
  const m = vertices.length;

  // Need at least three vertices for one roundable corner. For an open path the
  // two ends stay sharp, so three vertices give exactly one interior corner.
  if (m < 3) {
    return points.map(copyPoint);
  }

  const segments = Math.max(1, Math.floor(componentsPerCorner));

  // Build each corner's sub-chain.
  const corners: CornerChain[] = [];
  for (let i = 0; i < m; i++) {
    if (!closed && (i === 0 || i === m - 1)) {
      corners.push([copyPoint(vertices[i])]);
      continue;
    }
    const prev = vertices[(i - 1 + m) % m];
    const next = vertices[(i + 1) % m];
    corners.push(buildCorner(prev, vertices[i], next, radius, segments));
  }

  // Stitch the corners together with straight edges.
  const result: number[][] = corners[0].map(copyPoint);
  for (let i = 1; i < m; i++) {
    appendLine(result, corners[i][0]);
    appendCornerTail(result, corners[i]);
  }
  if (closed) {
    appendLine(result, result[0]);
  }

  return result;
}
