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
 * Evaluate a cubic Bezier curve at parameter t.
 * Uses the standard cubic Bernstein polynomial:
 *   B(t) = (1-t)^3 * p0 + 3*(1-t)^2*t * p1 + 3*(1-t)*t^2 * p2 + t^3 * p3
 *
 * The z-component uses nullish coalescing (p[2] ?? 0) so that 2D points
 * (without an explicit z) are handled safely.
 */
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
