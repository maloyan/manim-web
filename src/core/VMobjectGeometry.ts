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
} from '../utils/math';
import type { Point } from './VMobjectCurves';

export interface CompoundAlignmentResult {
  srcAlignedPoints: number[][];
  tgtAlignedPoints: number[][];
  alignedSubpathLengths: number[];
}

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
 * Check if a cubic Bezier segment is nearly linear by measuring the maximum
 * 3D distance from handles to the chord (p0 -> p3). Must handle z so that
 * arcs in non-XY planes (e.g. Angle in XZ plane) still sample as curves.
 */
export function isNearlyLinear(p0: number[], p1: number[], p2: number[], p3: number[]): boolean {
  const cx = p3[0] - p0[0];
  const cy = p3[1] - p0[1];
  const cz = (p3[2] ?? 0) - (p0[2] ?? 0);
  const len2 = cx * cx + cy * cy + cz * cz;
  if (len2 < 1e-10) return true; // degenerate segment

  const invLen = 1 / Math.sqrt(len2);
  const perpDist = (q: number[]): number => {
    const ax = q[0] - p0[0];
    const ay = q[1] - p0[1];
    const az = (q[2] ?? 0) - (p0[2] ?? 0);
    // |a × c| / |c|
    const rx = ay * cz - az * cy;
    const ry = az * cx - ax * cz;
    const rz = ax * cy - ay * cx;
    return Math.sqrt(rx * rx + ry * ry + rz * rz) * invLen;
  };

  return Math.max(perpDist(p1), perpDist(p2)) < 0.01;
}

// -----------------------------------------------------------------------
// Bezier path sampling
// -----------------------------------------------------------------------

/**
 * Sample Bezier curves for smooth rendering.
 * Uses adaptive sampling: nearly-linear segments (from prepareForNonlinearTransform)
 * use only their endpoints, avoiding expensive per-sample Bezier evaluation.
 *
 * @param points - Bezier control points
 * @param samplesPerSegment - Number of samples per curved Bezier segment
 * @returns Sampled points along the path
 */
export function sampleBezierPath(points: number[][], samplesPerSegment: number = 4): number[][] {
  const result: number[][] = [];

  // Points are stored as: [anchor, handle, handle, anchor, handle, handle, anchor, ...]
  // Each cubic Bezier segment uses 4 consecutive points
  for (let i = 0; i + 3 < points.length; i += 3) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    // Adaptive: if handles are close to the chord line, the segment is
    // nearly linear (common after prepareForNonlinearTransform). Use just
    // the endpoints to avoid unnecessary Bezier evaluation.
    const samples = isNearlyLinear(p0, p1, p2, p3) ? 1 : samplesPerSegment;

    for (let t = 0; t <= samples; t++) {
      const u = t / samples;
      const pt = evalCubicBezier(p0, p1, p2, p3, u);
      // Avoid duplicate points
      if (
        t === 0 ||
        result.length === 0 ||
        Math.abs(pt[0] - result[result.length - 1][0]) > 0.0001 ||
        Math.abs(pt[1] - result[result.length - 1][1]) > 0.0001
      ) {
        result.push(pt);
      }
    }
  }

  // Handle case where points don't follow Bezier format (simple line segments)
  if (result.length === 0 && points.length >= 2) {
    return points;
  }

  return result;
}

/**
 * Sample the Bezier path into a 2D polyline suitable for earcut triangulation.
 *
 * This is similar to sampleBezierPath but returns [x, y] pairs (no z) and
 * skips duplicate-point de-duplication at segment boundaries (earcut handles
 * that correctly and de-dup can introduce off-by-one for hole indices).
 */
export function sampleBezierOutline(points: number[][], samplesPerSegment: number): number[][] {
  const result: number[][] = [];

  for (let i = 0; i + 3 < points.length; i += 3) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    const samples = isNearlyLinear(p0, p1, p2, p3) ? 1 : samplesPerSegment;

    const startT = i === 0 ? 0 : 1; // skip first point of subsequent segments (shared anchor)
    for (let t = startT; t <= samples; t++) {
      const u = t / samples;
      const pt = evalCubicBezier(p0, p1, p2, p3, u);
      result.push([pt[0], pt[1], pt[2] ?? 0]); // Include Z for 3D support
    }
  }

  // Handle non-Bezier (simple line segment) fallback
  if (result.length === 0 && points.length >= 2) {
    for (const p of points) {
      result.push([p[0], p[1], p[2] ?? 0]); // Include Z for 3D support
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

/** Split a flat point array into subpath chunks based on lengths metadata. */
function splitBySubpathLengths(points3D: number[][], lengths: number[]): number[][][] {
  const chunks: number[][][] = [];
  let offset = 0;
  for (const len of lengths) {
    chunks.push(points3D.slice(offset, offset + len));
    offset += len;
  }
  return chunks;
}

/** Build a degenerate subpath (all points equal) with point count matching reference. */
function makeNullSubpathFromReference(
  referenceSubpath: number[][],
  anchorPoint: number[],
): number[][] {
  const anchor = [anchorPoint[0], anchorPoint[1], anchorPoint[2] ?? 0];
  return referenceSubpath.map(() => [...anchor]);
}

/** Equalize point counts for a source/target subpath pair using arc-length resampling. */
function alignSubpathPairPoints(
  srcSubpath: number[][],
  tgtSubpath: number[][],
): { srcAligned: number[][]; tgtAligned: number[][] } {
  const MIN_TRANSFORM_SUBPATH_POINTS = 64;
  const targetCount = Math.max(srcSubpath.length, tgtSubpath.length, MIN_TRANSFORM_SUBPATH_POINTS);

  const distance3 = (a: number[], b: number[]): number => {
    const dx = (b[0] ?? 0) - (a[0] ?? 0);
    const dy = (b[1] ?? 0) - (a[1] ?? 0);
    const dz = (b[2] ?? 0) - (a[2] ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const interpolateToCount = (pts: number[][], count: number): number[][] => {
    if (pts.length === count) return pts.map((p) => [...p]);
    if (pts.length === 0)
      return Array(count)
        .fill(null)
        .map(() => [0, 0, 0]);
    if (pts.length === 1)
      return Array(count)
        .fill(null)
        .map(() => [...pts[0]]);

    const cumulative: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      cumulative.push(cumulative[i - 1] + distance3(pts[i - 1], pts[i]));
    }

    const total = cumulative[cumulative.length - 1];
    if (total <= 1e-12) {
      return Array(count)
        .fill(null)
        .map(() => [...pts[0]]);
    }

    const out: number[][] = [];
    let seg = 0;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      const targetDist = t * total;

      while (seg < cumulative.length - 2 && cumulative[seg + 1] < targetDist) {
        seg++;
      }

      const d0 = cumulative[seg];
      const d1 = cumulative[seg + 1];
      const p0 = pts[seg];
      const p1 = pts[seg + 1];
      const span = d1 - d0;
      const frac = span <= 1e-12 ? 0 : (targetDist - d0) / span;

      out.push([
        p0[0] + (p1[0] - p0[0]) * frac,
        p0[1] + (p1[1] - p0[1]) * frac,
        (p0[2] ?? 0) + ((p1[2] ?? 0) - (p0[2] ?? 0)) * frac,
      ]);
    }

    return out;
  };

  return {
    srcAligned: interpolateToCount(srcSubpath, targetCount),
    tgtAligned: interpolateToCount(tgtSubpath, targetCount),
  };
}

/** Validate subpath lengths match point counts; throw on mismatch. */
function validateSubpathLengths(points3D: number[][], lengths: number[], label: string): void {
  const total = lengths.reduce((sum, len) => sum + len, 0);
  if (total !== points3D.length) {
    throw new Error(
      `alignCompoundPathsForTransform: ${label} subpath lengths sum (${total}) does not match ${label} point count (${points3D.length})`,
    );
  }
}

/**
 * Align two compound paths by subpath index.
 * Missing subpaths are replaced with null subpaths anchored at prior endpoint.
 */
export function alignCompoundPathsForTransform(
  srcPoints3D: number[][],
  srcLengths: number[] | undefined,
  tgtPoints3D: number[][],
  tgtLengths: number[] | undefined,
): CompoundAlignmentResult | null {
  if (!srcLengths || !tgtLengths || (srcLengths.length <= 1 && tgtLengths.length <= 1)) {
    return null;
  }

  validateSubpathLengths(srcPoints3D, srcLengths, 'source');
  validateSubpathLengths(tgtPoints3D, tgtLengths, 'target');

  const srcChunks = splitBySubpathLengths(srcPoints3D, srcLengths);
  const tgtChunks = splitBySubpathLengths(tgtPoints3D, tgtLengths);
  const maxSubpaths = Math.max(srcChunks.length, tgtChunks.length);

  const srcAlignedAll: number[][] = [];
  const tgtAlignedAll: number[][] = [];
  const alignedLengths: number[] = [];

  let lastAnchor: number[] = srcPoints3D[srcPoints3D.length - 1] ??
    tgtPoints3D[tgtPoints3D.length - 1] ?? [0, 0, 0];

  for (let i = 0; i < maxSubpaths; i++) {
    const src = srcChunks[i];
    const tgt = tgtChunks[i];

    const srcSub = src ?? makeNullSubpathFromReference(tgt ?? [[...lastAnchor]], lastAnchor);
    const tgtSub = tgt ?? makeNullSubpathFromReference(src ?? [[...lastAnchor]], lastAnchor);

    const { srcAligned, tgtAligned } = alignSubpathPairPoints(srcSub, tgtSub);

    srcAlignedAll.push(...srcAligned);
    tgtAlignedAll.push(...tgtAligned);
    alignedLengths.push(srcAligned.length);

    const nextAnchor = srcAligned[srcAligned.length - 1] ?? tgtAligned[tgtAligned.length - 1];
    if (nextAnchor) lastAnchor = [...nextAnchor];
  }

  return {
    srcAlignedPoints: srcAlignedAll,
    tgtAlignedPoints: tgtAlignedAll,
    alignedSubpathLengths: alignedLengths,
  };
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
 * Uses point-in-polygon containment to distinguish holes from disjoint regions.
 */
// eslint-disable-next-line complexity
function buildEarcutFillGeometryMulti(
  points3D: number[][],
  subpathLengths: number[],
  visiblePoints: Point[],
): THREE.BufferGeometry | null {
  void visiblePoints; // kept for API compatibility

  // Sample each subpath into 3D rings, collecting all points for plane computation
  let offset = 0;
  const rings3D: number[][][] = [];
  const allPoints3D: number[][] = [];

  for (const len of subpathLengths) {
    const subPoints = points3D.slice(offset, offset + len);
    offset += len;

    const ring = sampleBezierOutline3D(subPoints, FILL_SAMPLES_PER_SEGMENT);
    if (ring.length >= 3) {
      rings3D.push(ring);
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

  // Determine containment: for each ring, check if it's inside another ring.
  const isHoleOf = new Array<number>(rings2D.length).fill(-1);

  for (let i = 0; i < rings2D.length; i++) {
    for (let j = 0; j < rings2D.length; j++) {
      if (i === j) continue;
      if (pointInPolygon(rings2D[i][0], rings2D[j])) {
        isHoleOf[i] = j;
        break;
      }
    }
  }

  // Collect outer rings (not holes) and their associated holes
  const allPositions: number[] = [];

  for (let i = 0; i < rings2D.length; i++) {
    if (isHoleOf[i] >= 0) continue;

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
