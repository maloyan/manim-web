/**
 * Shared math utility functions used across the codebase.
 */

/**
 * Linear interpolation between two numbers.
 * Returns a + (b - a) * t.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two 3D points, component-wise.
 * Each point is represented as a number array [x, y, z].
 */
export function lerpPoint(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Hermite smoothstep interpolation.
 * Maps t in [0, 1] to a smooth S-curve: 3t^2 - 2t^3.
 * Commonly used for smooth camera movements and animation easing.
 */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Convert graph coordinates to visual point coordinates.
 *
 * @param x - X coordinate in graph space
 * @param y - Y coordinate in graph space
 * @param xRange - X-axis range as [min, max, ...] (only first two elements used)
 * @param yRange - Y-axis range as [min, max, ...] (only first two elements used)
 * @param xLength - Visual length of the x-axis
 * @param yLength - Visual length of the y-axis
 * @returns The visual point [x, y, 0]
 */
export function coordsToPoint(
  x: number,
  y: number,
  xRange: [number, number, ...number[]],
  yRange: [number, number, ...number[]],
  xLength: number,
  yLength: number,
): [number, number, number] {
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;

  const xNorm = xMax !== xMin ? (x - xMin) / (xMax - xMin) : 0.5;
  const yNorm = yMax !== yMin ? (y - yMin) / (yMax - yMin) : 0.5;

  return [(xNorm - 0.5) * xLength, (yNorm - 0.5) * yLength, 0];
}

/**
 * Convert visual point coordinates to graph coordinates.
 *
 * @param point - Visual point [x, y, z] (z is ignored)
 * @param xRange - X-axis range as [min, max, ...] (only first two elements used)
 * @param yRange - Y-axis range as [min, max, ...] (only first two elements used)
 * @param xLength - Visual length of the x-axis
 * @param yLength - Visual length of the y-axis
 * @returns Graph coordinates [x, y]
 */
export function pointToCoords(
  point: [number, number, number],
  xRange: [number, number, ...number[]],
  yRange: [number, number, ...number[]],
  xLength: number,
  yLength: number,
): [number, number] {
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;

  const xNorm = point[0] / xLength + 0.5;
  const yNorm = point[1] / yLength + 0.5;

  return [xNorm * (xMax - xMin) + xMin, yNorm * (yMax - yMin) + yMin];
}

/**
 * Apply a 2x2 or 3x3 transformation matrix to a single point,
 * relative to an aboutPoint (defaults to origin).
 *
 * Returns the original point unchanged if the matrix dimensions are invalid.
 */
export function transformPointByMatrix(
  point: number[],
  matrix: number[][],
  aboutPoint: number[] = [0, 0, 0],
): number[] {
  const x = point[0] - aboutPoint[0];
  const y = point[1] - aboutPoint[1];
  const z = point[2] - aboutPoint[2];

  let nx: number, ny: number, nz: number;

  if (matrix.length === 2 && matrix[0].length === 2) {
    nx = matrix[0][0] * x + matrix[0][1] * y;
    ny = matrix[1][0] * x + matrix[1][1] * y;
    nz = z;
  } else if (matrix.length === 3 && matrix[0].length === 3) {
    nx = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z;
    ny = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z;
    nz = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z;
  } else {
    return point;
  }

  return [nx + aboutPoint[0], ny + aboutPoint[1], nz + aboutPoint[2]];
}

/**
 * Evaluate a cubic Bezier curve at parameter t.
 * Uses the standard cubic Bernstein polynomial:
 *   B(t) = (1-t)^3 * p0 + 3*(1-t)^2*t * p1 + 3*(1-t)*t^2 * p2 + t^3 * p3
 *
 * The z-component uses nullish coalescing (p[2] ?? 0) so that 2D points
 * (without an explicit z) are handled safely.
 */
export function evalCubicBezier(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  t: number,
): number[] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return [
    mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0],
    mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1],
    (p0[2] ?? 0) * mt3 +
      (p1[2] ?? 0) * 3 * mt2 * t +
      (p2[2] ?? 0) * 3 * mt * t2 +
      (p3[2] ?? 0) * t3,
  ];
}

// ---------------------------------------------------------------------------
// Plane basis extraction
// ---------------------------------------------------------------------------

/**
 * Select 3 maximally scattered points from a point set.
 *
 * Algorithm: first point → furthest from first → furthest from both.
 * This tends to pick a wide triangle, which gives a more stable plane basis.
 *
 * @returns Indices of 3 scattered points (fewer if not enough input)
 */
export function selectScatteredPoints(points: number[][]): number[] {
  const n = points.length;
  if (n < 3) return n === 0 ? [] : n === 1 ? [0] : [0, 1];

  const dist2 = (i: number, j: number) => {
    const dx = points[i][0] - points[j][0];
    const dy = points[i][1] - points[j][1];
    const dz = (points[i][2] ?? 0) - (points[j][2] ?? 0);
    return dx * dx + dy * dy + dz * dz;
  };

  // Find point furthest from 0
  let i1 = 1;
  for (let i = 2; i < n; i++) if (dist2(0, i) > dist2(0, i1)) i1 = i;

  // Find point furthest from both 0 and i1
  let i2 = i1 === 0 ? 1 : 0;
  for (let i = 0; i < n; i++) {
    if (i === 0 || i === i1) continue;
    if (dist2(0, i) + dist2(i1, i) > dist2(0, i2) + dist2(i1, i2)) i2 = i;
  }

  return [0, i1, i2];
}

/**
 * Extract two vectors from 3 points [p0, p1, p2]: v1 = p1-p0, v2 = p2-p0.
 * These span the plane containing the points.
 * Returns null if < 3 points.
 */
export function extractVectorsFrom3Points(
  points: number[][],
): { v1: number[]; v2: number[] } | null {
  if (points.length < 3) return null;
  const [p0, p1, p2] = points;
  return {
    v1: [p1[0] - p0[0], p1[1] - p0[1], (p1[2] ?? 0) - (p0[2] ?? 0)],
    v2: [p2[0] - p0[0], p2[1] - p0[1], (p2[2] ?? 0) - (p0[2] ?? 0)],
  };
}

/**
 * Project a 3D point onto a 2D plane basis.
 *
 * @param point - 3D point to project
 * @param origin - Plane origin point
 * @param v1 - First basis vector (becomes x-axis)
 * @param v2 - Second basis vector (becomes y-axis)
 * @returns [u, v] coordinates on the plane
 */
export function projectToPlane(
  point: number[],
  origin: number[],
  v1: number[],
  v2: number[],
): [number, number] {
  const dx = point[0] - origin[0];
  const dy = point[1] - origin[1];
  const dz = (point[2] ?? 0) - (origin[2] ?? 0);
  // Dot products with basis vectors
  const u = dx * v1[0] + dy * v1[1] + dz * v1[2];
  const v = dx * v2[0] + dy * v2[1] + dz * v2[2];
  return [u, v];
}

/**
 * Get orthonormalized basis vectors from two spanning vectors.
 * Uses Gram-Schmidt: normalizes v1, then makes v2 orthogonal to v1 and normalizes.
 *
 * @returns Object with orthonormal v1, v2 and the original (for reversal)
 */
export function orthonormalizeBasis(
  v1: number[],
  v2: number[],
): {
  v1: number[];
  v2: number[];
} {
  const len1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2 + v1[2] ** 2);
  if (len1 < 1e-10) {
    return { v1: [1, 0, 0], v2: [0, 1, 0] };
  }
  const u1 = [v1[0] / len1, v1[1] / len1, v1[2] / len1];

  // v2' = v2 - (v2·u1) * u1
  const dot = v2[0] * u1[0] + v2[1] * u1[1] + v2[2] * u1[2];
  const v2p = [v2[0] - dot * u1[0], v2[1] - dot * u1[1], v2[2] - dot * u1[2]];

  const len2 = Math.sqrt(v2p[0] ** 2 + v2p[1] ** 2 + v2p[2] ** 2);
  if (len2 < 1e-10) {
    // v1 and v2 were collinear, pick perpendicular
    const perp = Math.abs(u1[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const perpDot = perp[0] * u1[0] + perp[1] * u1[1] + perp[2] * u1[2];
    const u2 = [perp[0] - perpDot * u1[0], perp[1] - perpDot * u1[1], perp[2] - perpDot * u1[2]];
    const u2len = Math.sqrt(u2[0] ** 2 + u2[1] ** 2 + u2[2] ** 2);
    return { v1: u1, v2: [u2[0] / u2len, u2[1] / u2len, u2[2] / u2len] };
  }

  return { v1: u1, v2: [v2p[0] / len2, v2p[1] / len2, v2p[2] / len2] };
}
