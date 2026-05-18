/**
 * Geometry building utilities for VMobject rendering.
 *
 * Provides standalone functions for:
 * - Sampling Bezier curves into polylines
 * - Building earcut-triangulated fill geometry
 * - Converting Bezier control points to THREE.Shape / CurvePath
 * - Mesh-based stroke ring construction with miter joins
 * - Point-in-polygon and linearity tests
 */

import * as THREE from 'three';
import { triangulatePolygon } from '../utils/triangulate';
import {
  evalCubicBezier,
  selectScatteredPoints,
  extractVectorsFrom3Points,
  orthonormalizeBasis,
  projectToPlane,
  signedArea2DFromStride,
} from '../utils/math';
import { crossVec, lengthVec } from '../utils/vectors';
import type { Point } from './VMobjectCurves';

/**
 * Sampling density used for fill triangulation outlines.
 *
 * Keep this separate from stroke/path sampling: fill quality for compound
 * glyphs (holes/subpaths) is much more sensitive to undersampling.
 */
const FILL_SAMPLES_PER_SEGMENT = 16;

// -----------------------------------------------------------------------
// Linearity test
// -----------------------------------------------------------------------

/**
 * Relative tolerance for the linearity test, expressed as a fraction of the
 * chord length. A handle whose perpendicular distance to the chord is less
 * than this fraction of the chord is treated as collinear.
 *
 * The threshold MUST be relative (not absolute) so that the same logical
 * shape sampled at different world-space scales is classified consistently.
 * A fixed absolute threshold collapses small-scale curves (e.g. a tiny
 * MathTex glyph) to lines while leaving the large-scale copy curved, which
 * causes mid-animation polyline-length flips during a `Transform` between
 * the two — see issue #310.
 */
const LINEARITY_REL_TOL = 0.01;

/**
 * Check if a cubic Bezier segment is nearly linear by measuring the maximum
 * 3D distance from handles to the chord (p0 -> p3), normalised by chord
 * length. Must handle z so that arcs in non-XY planes (e.g. Angle in XZ
 * plane) still sample as curves.
 */
export function isNearlyLinear(p0: number[], p1: number[], p2: number[], p3: number[]): boolean {
  const c: [number, number, number] = [p3[0] - p0[0], p3[1] - p0[1], (p3[2] ?? 0) - (p0[2] ?? 0)];

  // Handle distances from p0 — used both as the degenerate-chord fallback
  // and to distinguish a "loop" Bezier (chord ≈ 0 but handles bulge out).
  const dh = (q: number[]): number =>
    lengthVec([q[0] - p0[0], q[1] - p0[1], (q[2] ?? 0) - (p0[2] ?? 0)]);

  const chord = lengthVec(c);
  if (chord < 1e-10) {
    // Chord is effectively zero. Linear only if the whole control polygon
    // collapses to a point; otherwise it's a curl/loop that must be sampled.
    return Math.max(dh(p1), dh(p2)) < 1e-10;
  }

  // |a × c| / |c| is the perpendicular distance from q to the chord.
  const perpDist = (q: number[]): number =>
    lengthVec(crossVec([q[0] - p0[0], q[1] - p0[1], (q[2] ?? 0) - (p0[2] ?? 0)], c)) / chord;

  return Math.max(perpDist(p1), perpDist(p2)) < LINEARITY_REL_TOL * chord;
}

// -----------------------------------------------------------------------
// Bezier path sampling
// -----------------------------------------------------------------------

/**
 * Sample Bezier curves for smooth rendering.
 *
 * Always emits exactly `samplesPerSegment + 1` samples per cubic segment
 * (minus shared-anchor duplicates between adjacent segments). Earlier
 * versions used "adaptive" sampling — `isNearlyLinear ? 1 : N` — to skip
 * per-sample evaluation on segments whose handles were collinear with the
 * chord. That branch is unsafe during a `Transform`: the linearity test
 * is computed on the per-frame LERPED control polygon, so as alpha
 * advances a segment can cross the threshold and the segment's sample
 * count flips between 1 and N. The polyline length changes frame-to-frame,
 * the resulting stroke/path geometry is rebuilt with a different vertex
 * count each time, and the visible result is a flickering edge. Stability
 * is worth far more than the marginal compute saved on collinear segments.
 *
 * @param points - Bezier control points
 * @param samplesPerSegment - Number of samples per cubic Bezier segment
 */
export function sampleBezierPath(points: number[][], samplesPerSegment: number = 4): number[][] {
  const result: number[][] = [];

  // Points are stored as: [anchor, handle, handle, anchor, handle, handle, anchor, ...]
  // Each cubic Bezier segment uses 4 consecutive points; consecutive
  // segments share their boundary anchor, so we skip t=0 on segments
  // after the first.
  for (let i = 0; i + 3 < points.length; i += 3) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    const startT = i === 0 ? 0 : 1;
    for (let t = startT; t <= samplesPerSegment; t++) {
      result.push(evalCubicBezier(p0, p1, p2, p3, t / samplesPerSegment));
    }
  }

  // Fallback for inputs that don't follow the cubic Bezier control polygon
  // shape (e.g. a 2-point line segment).
  if (result.length === 0 && points.length >= 2) {
    return points;
  }

  return result;
}

/**
 * Sample the Bezier path into a polyline suitable for earcut triangulation.
 *
 * Same stability rationale as `sampleBezierPath`: emit a fixed number of
 * samples per segment so the polyline length doesn't flicker frame-to-frame
 * during a `Transform`.
 */
export function sampleBezierOutline(points: number[][], samplesPerSegment: number): number[][] {
  const result: number[][] = [];

  for (let i = 0; i + 3 < points.length; i += 3) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    const startT = i === 0 ? 0 : 1; // skip first point of subsequent segments (shared anchor)
    for (let t = startT; t <= samplesPerSegment; t++) {
      const u = t / samplesPerSegment;
      const pt = evalCubicBezier(p0, p1, p2, p3, u);
      result.push([pt[0], pt[1], pt[2] ?? 0]);
    }
  }

  // Handle non-Bezier (simple line segment) fallback
  if (result.length === 0 && points.length >= 2) {
    for (const p of points) {
      result.push([p[0], p[1], p[2] ?? 0]);
    }
  }

  // Remove closing duplicate if first == last (earcut prefers open rings)
  if (result.length > 1) {
    const first = result[0];
    const last = result[result.length - 1];
    if (Math.abs(first[0] - last[0]) < 1e-8 && Math.abs(first[1] - last[1]) < 1e-8) {
      result.pop();
    }
  }

  return result;
}

/**
 * Sample Bezier path into 3D points (preserves z).
 * Same logic as sampleBezierOutline but returns [x, y, z] instead of [x, y].
 */
function sampleBezierOutline3D(points: number[][], samplesPerSegment: number): number[][] {
  const result: number[][] = [];
  for (let i = 0; i + 3 < points.length; i += 3) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    // Important: fill triangulation quality is sensitive to undersampling.
    // Do NOT use nearly-linear collapse here; always sample uniformly.
    const samples = samplesPerSegment;

    const startT = i === 0 ? 0 : 1;
    for (let t = startT; t <= samples; t++) {
      const u = t / samples;
      const pt = evalCubicBezier(p0, p1, p2, p3, u);
      result.push(pt);
    }
  }

  if (result.length === 0 && points.length >= 2) {
    for (const p of points) {
      result.push([p[0], p[1], p[2] ?? 0]);
    }
  }

  // Remove closing duplicate
  if (result.length > 1) {
    const first = result[0];
    const last = result[result.length - 1];
    const dx = first[0] - last[0];
    const dy = first[1] - last[1];
    const dz = (first[2] ?? 0) - (last[2] ?? 0);
    if (dx * dx + dy * dy + dz * dz < 1e-8) {
      result.pop();
    }
  }

  // Keep sampling deterministic and high-fidelity for fill triangulation.
  // Unlike stroke/path preview code, fill quality is sensitive to undersampling,
  // especially for compound glyphs with holes (e.g. MathTex "0", "8").
  return result;
}

/**
 * Project 3D outline points to 2D plane for triangulation.
 * Returns both 2D projected points and the plane basis for reconstruction.
 */
function projectOutlineToPlane(outline3D: number[][]): {
  outline2D: number[][];
  origin: number[];
  v1: number[];
  v2: number[];
} {
  if (outline3D.length < 3) {
    return {
      outline2D: outline3D.map((p) => [p[0], p[1]]),
      origin: [0, 0, 0],
      v1: [1, 0, 0],
      v2: [0, 1, 0],
    };
  }

  // Fast path: when the shape lies in the XY plane (z ≈ 0 everywhere) the
  // standard basis is already correct, and computing one from scattered
  // points can pick three nearly-collinear samples for thin glyphs (e.g. the
  // two horizontal bars of `=`), collapsing v2 onto Z and projecting every
  // point to the same line.
  let zMin = outline3D[0][2] ?? 0;
  let zMax = zMin;
  for (let i = 1; i < outline3D.length; i++) {
    const z = outline3D[i][2] ?? 0;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }
  if (zMax - zMin < 1e-6) {
    return {
      outline2D: outline3D.map((p) => [p[0], p[1]]),
      origin: [0, 0, zMin],
      v1: [1, 0, 0],
      v2: [0, 1, 0],
    };
  }

  // Get plane basis from scattered points
  const indices = selectScatteredPoints(outline3D);
  const scattered = indices.map((i) => outline3D[i]);
  const vectors = extractVectorsFrom3Points(scattered);

  if (!vectors) {
    return {
      outline2D: outline3D.map((p) => [p[0], p[1]]),
      origin: [0, 0, 0],
      v1: [1, 0, 0],
      v2: [0, 1, 0],
    };
  }

  const { v1, v2 } = orthonormalizeBasis(vectors.v1, vectors.v2);
  const origin = scattered[0];

  // Project all points to 2D
  const outline2D = outline3D.map((p) => projectToPlane(p, origin, v1, v2));

  return { outline2D, origin, v1, v2 };
}

// -----------------------------------------------------------------------
// Point-in-polygon
// -----------------------------------------------------------------------

/**
 * Ray-casting point-in-polygon test (2D).
 * Returns true if point is inside the polygon ring.
 */
export function pointInPolygon(point: number[], ring: number[][]): boolean {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// -----------------------------------------------------------------------
// Shape / CurvePath conversion
// -----------------------------------------------------------------------

/**
 * Convert Bezier control points to a Three.js Shape for filled rendering.
 * @param visiblePoints - The visible points as 2D Point objects
 * @returns THREE.Shape representing the path
 */
export function pointsToShape(visiblePoints: Point[]): THREE.Shape {
  const shape = new THREE.Shape();

  if (visiblePoints.length === 0) {
    return shape;
  }

  // Move to first point
  shape.moveTo(visiblePoints[0].x, visiblePoints[0].y);

  // Process cubic Bezier segments
  let i = 0;
  while (i + 3 < visiblePoints.length) {
    const handle1 = visiblePoints[i + 1];
    const handle2 = visiblePoints[i + 2];
    const anchor2 = visiblePoints[i + 3];

    shape.bezierCurveTo(handle1.x, handle1.y, handle2.x, handle2.y, anchor2.x, anchor2.y);

    // Move to next segment (skip by 3 to share anchor)
    i += 3;
  }

  // If we have remaining points that don't form a full Bezier, draw lines
  while (i < visiblePoints.length) {
    shape.lineTo(visiblePoints[i].x, visiblePoints[i].y);
    i++;
  }

  return shape;
}

/**
 * Convert points to a THREE.CurvePath for stroke rendering
 * @param visiblePoints3D - The visible points as 3D arrays
 */
export function pointsToCurvePath(visiblePoints3D: number[][]): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();

  if (visiblePoints3D.length < 2) {
    return path;
  }

  // Process cubic Bezier segments
  let i = 0;
  while (i + 3 < visiblePoints3D.length) {
    const p0 = new THREE.Vector3(
      visiblePoints3D[i][0],
      visiblePoints3D[i][1],
      visiblePoints3D[i][2],
    );
    const p1 = new THREE.Vector3(
      visiblePoints3D[i + 1][0],
      visiblePoints3D[i + 1][1],
      visiblePoints3D[i + 1][2],
    );
    const p2 = new THREE.Vector3(
      visiblePoints3D[i + 2][0],
      visiblePoints3D[i + 2][1],
      visiblePoints3D[i + 2][2],
    );
    const p3 = new THREE.Vector3(
      visiblePoints3D[i + 3][0],
      visiblePoints3D[i + 3][1],
      visiblePoints3D[i + 3][2],
    );

    path.add(new THREE.CubicBezierCurve3(p0, p1, p2, p3));
    i += 3;
  }

  // Handle remaining points as lines
  while (i + 1 < visiblePoints3D.length) {
    const p0 = new THREE.Vector3(
      visiblePoints3D[i][0],
      visiblePoints3D[i][1],
      visiblePoints3D[i][2],
    );
    const p1 = new THREE.Vector3(
      visiblePoints3D[i + 1][0],
      visiblePoints3D[i + 1][1],
      visiblePoints3D[i + 1][2],
    );
    path.add(new THREE.LineCurve3(p0, p1));
    i++;
  }

  return path;
}

// -----------------------------------------------------------------------
// Earcut fill geometry
// -----------------------------------------------------------------------

/**
 * Build a THREE.BufferGeometry for the filled region using earcut triangulation.
 *
 * Earcut handles concave polygons, self-intersecting paths, and holes far
 * more robustly than Three.js' built-in ShapeGeometry triangulator.
 *
 * If earcut returns zero triangles (completely degenerate input) we fall
 * back to THREE.ShapeGeometry so existing simple shapes still render.
 *
 * @param points3D - The visible Bezier control points
 * @param visiblePoints - 2D points for fallback shape
 * @param getSubpathLengths - Optional function to get subpath lengths for compound paths
 * @returns A BufferGeometry or null if too degenerate
 */
export function buildEarcutFillGeometry(
  points3D: number[][],
  visiblePoints: Point[],
  getSubpathLengths?: () => number[],
): THREE.BufferGeometry | null {
  const subpathLengths = getSubpathLengths?.();

  // For disjoint subpaths (e.g. boolean XOR), split control points FIRST
  // then sample each subpath independently.
  if (subpathLengths && subpathLengths.length > 1) {
    return buildEarcutFillGeometryMulti(points3D, subpathLengths, visiblePoints);
  }

  // Sample Bezier curves into 3D polyline, then project to plane for triangulation
  const outline3D = sampleBezierOutline3D(points3D, FILL_SAMPLES_PER_SEGMENT);
  if (outline3D.length < 3) return null;

  // Project to plane and get 2D coordinates for earcut
  const { outline2D } = projectOutlineToPlane(outline3D);

  // Triangulate with earcut
  const indices = triangulatePolygon(outline2D);

  if (indices.length === 0) {
    // Earcut couldn't triangulate -- fall back to THREE.ShapeGeometry
    const shape = pointsToShape(visiblePoints);
    return new THREE.ShapeGeometry(shape);
  }

  // Create BufferGeometry using original 3D points (not projected 2D)
  const positions = new Float32Array(indices.length * 3);
  for (let i = 0; i < indices.length; i++) {
    const v = outline3D[indices[i]];
    positions[i * 3] = v[0];
    positions[i * 3 + 1] = v[1];
    positions[i * 3 + 2] = v[2] ?? 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
}

/**
 * Build fill geometry for multi-subpath shapes (compound glyphs).
 *
 * Classification strategy: outer-vs-hole is determined by the winding of
 * each subpath (CCW = outer, CW = hole), the standard SVG/PostScript/PDF
 * convention. Point-in-polygon containment is used ONLY to assign a hole
 * to the correct outer ring when several outers exist.
 *
 * Why winding (not point-in-polygon) for outer-vs-hole: during a Transform
 * the control points of each subpath are lerped per-frame, and any point
 * sampled from the path can land on (or numerically near) another ring's
 * boundary. Point-in-polygon for a near-boundary point flips between true
 * and false depending on floating-point fuzz, which makes a subpath flip
 * between "hole of outer X" and "separate outer", which makes earcut emit
 * a totally different triangle list, which renders as visible flicker.
 * Winding is set by the lerp of two equally-wound endpoints, so it is
 * stable across the entire animation.
 */
// eslint-disable-next-line complexity
function buildEarcutFillGeometryMulti(
  points3D: number[][],
  subpathLengths: number[],
  visiblePoints: Point[],
): THREE.BufferGeometry | null {
  void visiblePoints; // kept for API compatibility

  // Sample each subpath into 3D rings, collecting all points for plane
  // computation and remembering the original control polygon for winding.
  let offset = 0;
  const rings3D: number[][][] = [];
  const ringControlPolygons: number[][][] = [];
  const allPoints3D: number[][] = [];

  for (const len of subpathLengths) {
    const subPoints = points3D.slice(offset, offset + len);
    offset += len;

    const ring = sampleBezierOutline3D(subPoints, FILL_SAMPLES_PER_SEGMENT);
    if (ring.length >= 3) {
      rings3D.push(ring);
      ringControlPolygons.push(subPoints);
      allPoints3D.push(...ring);
    }
  }

  if (rings3D.length === 0) return null;

  // Compute ONE shared plane basis from all sampled points.
  // This keeps containment (hole classification) and triangulation in the
  // same 2D coordinate system even when the whole shape is rotated in 3D.
  const { origin, v1, v2 } = projectOutlineToPlane(allPoints3D);

  // Project each 3D ring to 2D using the shared plane basis
  const rings2D: number[][][] = rings3D.map((ring) =>
    ring.map((p) => projectToPlane(p, origin, v1, v2)),
  );

  // Classify rings by winding orientation in the shared 2D plane: the
  // dominant orientation is the outer; the opposite orientation is a hole.
  //
  // Use AREA-WEIGHTED majority (sum of signed areas), not count-weighted
  // majority of the signs. A glyph like "8" has one outer ring and TWO
  // inner holes — count-majority would say "holes win" and misclassify
  // the outer (which has by far the largest |area|) as a hole. Summing
  // signed areas lets the larger outer dominate regardless of how many
  // holes it has.
  //
  // Subpaths whose own area is degenerate (e.g. a synthetic subpath
  // collapsed to a single point at alpha=0) are classified as outers by
  // default and contribute zero triangles to triangulation, so they
  // don't render either way.
  const ringSigns = rings2D.map((ring) => signedArea2DFromStride(ring, 1));
  const totalSignedArea = ringSigns.reduce((acc, s) => acc + s, 0);
  const dominantSign = totalSignedArea >= 0 ? 1 : -1;
  const isHole = ringSigns.map((s) => {
    if (Math.abs(s) < 1e-12) return false; // degenerate: treat as outer (renders as nothing)
    return Math.sign(s) === -dominantSign;
  });

  // For each hole, find which outer it belongs to. We test the FIRST
  // anchor of the original control polygon (via the projected ring's
  // first point) against each outer's polygon. Multiple outers in a
  // single mobject is rare for glyphs but valid for compound shapes.
  const isHoleOf = new Array<number>(rings2D.length).fill(-1);
  for (let i = 0; i < rings2D.length; i++) {
    if (!isHole[i]) continue;
    for (let j = 0; j < rings2D.length; j++) {
      if (i === j || isHole[j]) continue;
      if (pointInPolygon(rings2D[i][0], rings2D[j])) {
        isHoleOf[i] = j;
        break;
      }
    }
    // If no containing outer was found (e.g. a hole that has temporarily
    // wandered outside the morphing outer mid-Transform), drop it from
    // rendering rather than promoting it to an outer — that would be the
    // same "separate filled blob" flicker we are eliminating.
  }
  void ringControlPolygons;

  // Collect outer rings (not holes) and their associated holes
  const allPositions: number[] = [];

  for (let i = 0; i < rings2D.length; i++) {
    // Skip rings classified as holes (they are emitted as part of their
    // outer ring's earcut call) or as orphan holes (wandered outside any
    // outer — drop them rather than render as a separate filled blob).
    if (isHole[i]) continue;

    const outerRing = rings2D[i];
    const outerRing3D = rings3D[i];
    const holeRings: number[][][] = [];
    const holeRings3D: number[][][] = [];

    for (let j = 0; j < rings2D.length; j++) {
      if (isHoleOf[j] === i) {
        holeRings.push(rings2D[j]);
        holeRings3D.push(rings3D[j]);
      }
    }

    const indices = triangulatePolygon(outerRing, holeRings.length > 0 ? holeRings : undefined);
    if (indices.length === 0) continue;

    const allVerts: number[][] = [...outerRing];
    const allVerts3D: number[][] = [...outerRing3D];
    for (let h = 0; h < holeRings.length; h++) {
      allVerts.push(...holeRings[h]);
      allVerts3D.push(...holeRings3D[h]);
    }

    for (const idx of indices) {
      const v = allVerts3D[idx];
      allPositions.push(v[0], v[1], v[2] ?? 0);
    }
  }

  if (allPositions.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allPositions), 3));
  return geometry;
}

// -----------------------------------------------------------------------
// Closed-path detection
// -----------------------------------------------------------------------

/**
 * Check if the Bezier control points form a closed path (first ~ last anchor).
 */
export function isClosedPath(points3D: number[][]): boolean {
  if (points3D.length < 4) return false;
  const first = points3D[0];
  const last = points3D[points3D.length - 1];
  const dx = first[0] - last[0],
    dy = first[1] - last[1],
    dz = first[2] - last[2];
  return dx * dx + dy * dy + dz * dz < 1e-6;
}
