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
export { alignCompoundPathsForTransform } from './VMobjectTransformAlignment';
export type { CompoundAlignmentResult } from './VMobjectTransformAlignment';

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

  return buildGeometryFromTriangleIndices(outline3D, indices);
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

  // Sample each subpath into 3D rings.
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
  const { origin, v1, v2 } = projectOutlineToPlane(allPoints3D);

  // Project each 3D ring to 2D using the shared plane basis
  const rings2D: number[][][] = rings3D.map((ring) =>
    ring.map((p) => projectToPlane(p, origin, v1, v2)),
  );

  // Heuristic classification: pick longest ring as primary outer contour.
  // Treat only rings INSIDE that contour as holes; rings outside stay
  // independent outers (prevents '=' turning into one bar).
  let primaryOuterRingIndex = 0;
  let primaryOuterPerimeter = ringPerimeter2D(rings2D[0]);
  for (let i = 1; i < rings2D.length; i++) {
    const perimeter = ringPerimeter2D(rings2D[i]);
    if (perimeter > primaryOuterPerimeter) {
      primaryOuterPerimeter = perimeter;
      primaryOuterRingIndex = i;
    }
  }

  const allPositions: number[] = [];

  const insidePrimaryHoleRings: number[][][] = [];
  const independentOuterRingIndices: number[] = [];

  for (let i = 0; i < rings2D.length; i++) {
    if (i === primaryOuterRingIndex) continue;

    if (pointInPolygon(rings2D[i][0], rings2D[primaryOuterRingIndex])) {
      insidePrimaryHoleRings.push(rings2D[i]);
    } else {
      independentOuterRingIndices.push(i);
    }
  }

  const primaryIndices = triangulatePolygon(
    rings2D[primaryOuterRingIndex],
    insidePrimaryHoleRings.length > 0 ? insidePrimaryHoleRings : undefined,
  );
  if (primaryIndices.length > 0) {
    const primaryVerts3D: number[][] = [...rings3D[primaryOuterRingIndex]];
    for (let i = 0; i < rings2D.length; i++) {
      if (i === primaryOuterRingIndex) continue;
      if (pointInPolygon(rings2D[i][0], rings2D[primaryOuterRingIndex])) {
        primaryVerts3D.push(...rings3D[i]);
      }
    }

    for (const idx of primaryIndices) {
      const v = primaryVerts3D[idx];
      allPositions.push(v[0], v[1], v[2] ?? 0);
    }
  }

  for (const ringIndex of independentOuterRingIndices) {
    const indices = triangulatePolygon(rings2D[ringIndex]);
    if (indices.length === 0) continue;

    const verts3D = rings3D[ringIndex];
    for (const idx of indices) {
      const v = verts3D[idx];
      allPositions.push(v[0], v[1], v[2] ?? 0);
    }
  }

  if (allPositions.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allPositions), 3));
  return geometry;
}

function buildGeometryFromTriangleIndices(
  vertices3D: number[][],
  indices: number[],
): THREE.BufferGeometry {
  const positions = new Float32Array(indices.length * 3);
  for (let i = 0; i < indices.length; i++) {
    const v = vertices3D[indices[i]];
    positions[i * 3] = v[0];
    positions[i * 3 + 1] = v[1];
    positions[i * 3 + 2] = v[2] ?? 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function ringPerimeter2D(ring: number[][]): number {
  if (ring.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    perimeter += Math.hypot(dx, dy);
  }
  return perimeter;
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
