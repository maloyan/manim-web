/**
 * Port of ManimCE `manim/utils/space_ops.py` (0.22.0) public API.
 *
 * These helpers mirror the numeric conventions of ManimCE. Low-level 3-vector
 * math (cross, dot, length, normalize) reuses `src/utils/vectors.ts`; this
 * module adds the rotation, quaternion, intersection and polygon helpers that
 * ManimCE exposes. See AGENTS.md > "Geometry conventions".
 *
 * Function declarations use the repository's camelCase convention; the public
 * ManimCE names (snake_case) are exposed through the alias export block at the
 * end of the file.
 *
 * Conventions:
 * - A 3-vector is a `Vector3Tuple` ([x, y, z]).
 * - A 3x3 or 4x4 matrix is a `number[][]` (row-major). `m @ v` means
 *   `matVecMul(m, v)`.
 * - A complex number is the shared `Complex` type (`{ re, im }`).
 */

import type { Vector3Tuple } from '../core/MobjectTypes';
import { DOWN, OUT, RIGHT, UP } from '../core/MobjectTypes';
import type { Complex } from '../mobjects/value-tracker';
import { crossVec, lengthVec, normalizeVec } from './vectors';
import { adjacentPairs } from './iterables';
import { triangulatePolygon } from './triangulate';

const TAU = 2 * Math.PI;

// --- internal matrix helpers -------------------------------------------------

function matTranspose(m: number[][]): number[][] {
  const rows = m.length;
  const cols = m[0].length;
  const out: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const row: number[] = [];
    for (let r = 0; r < rows; r++) row.push(m[r][c]);
    out.push(row);
  }
  return out;
}

function matVecMul(m: number[][], v: number[]): number[] {
  return m.map((row) => row.reduce((acc, val, i) => acc + val * (v[i] ?? 0), 0));
}

// --- norms and products ------------------------------------------------------

/** Squared Euclidean norm `v . v`. */
function normSquared(v: number[]): number {
  return v.reduce((acc, val) => acc + val * val, 0);
}

/**
 * 2D cross product (z-component of the 3D cross of the first two components).
 * ManimCE `cross2d` for single vectors.
 */
function cross2d(a: number[], b: number[]): number {
  return a[0] * b[1] - a[1] * b[0];
}

/**
 * Normalize a vector to unit length, preserving direction. If the norm is 0,
 * returns `fallBack` when supplied, otherwise a zero vector of the same length
 * (ManimCE `normalize`).
 */
function normalize(vect: number[], fallBack?: number[]): number[] {
  const norm = Math.sqrt(normSquared(vect));
  if (norm > 0) return vect.map((x) => x / norm);
  return fallBack ?? vect.map(() => 0);
}

// --- quaternions -------------------------------------------------------------

/** Hamilton product of the given quaternions (ManimCE `quaternion_mult`). */
function quaternionMult(...quats: number[][]): number[] {
  if (quats.length === 0) return [1, 0, 0, 0];
  let result = quats[0];
  for (let i = 1; i < quats.length; i++) {
    const [w1, x1, y1, z1] = result;
    const [w2, x2, y2, z2] = quats[i];
    result = [
      w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
      w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
      w1 * y2 + y1 * w2 + z1 * x2 - x1 * z2,
      w1 * z2 + z1 * w2 + x1 * y2 - y1 * x2,
    ];
  }
  return result;
}

/** Quaternion from an angle and axis (ManimCE `quaternion_from_angle_axis`). */
function quaternionFromAngleAxis(angle: number, axis: number[], axisNormalized = false): number[] {
  const a = axisNormalized ? axis : normalize(axis);
  const s = Math.sin(angle / 2);
  return [Math.cos(angle / 2), s * (a[0] ?? 0), s * (a[1] ?? 0), s * (a[2] ?? 0)];
}

/**
 * Angle (in `[0, PI]`) and axis from a quaternion
 * (ManimCE `angle_axis_from_quaternion`).
 */
function angleAxisFromQuaternion(quaternion: number[]): [number, Vector3Tuple] {
  let axis = normalize(quaternion.slice(1), [1, 0, 0]) as Vector3Tuple;
  let angle = 2 * Math.acos(quaternion[0]);
  if (angle > TAU / 2) {
    angle = TAU - angle;
    axis = [-axis[0], -axis[1], -axis[2]];
  }
  return [angle, axis];
}

/** Conjugate of a quaternion (ManimCE `quaternion_conjugate`). */
function quaternionConjugate(quaternion: number[]): number[] {
  return [quaternion[0], -quaternion[1], -quaternion[2], -quaternion[3]];
}

// --- rotations ---------------------------------------------------------------

/**
 * Rotation matrix in R^3 about `axis` by `angle` (right-handed, Rodrigues'
 * formula — matches ManimCE/`scipy` `Rotation.from_rotvec`). When
 * `homogeneous` is true, returns a 4x4 matrix.
 */
function rotationMatrix(angle: number, axis: number[], homogeneous = false): number[][] {
  const u = normalizeVec(axis);
  const [x, y, z] = u;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  const r = [
    [c + x * x * t, x * y * t - z * s, x * z * t + y * s],
    [x * y * t + z * s, c + y * y * t, y * z * t - x * s],
    [x * z * t - y * s, y * z * t + x * s, c + z * z * t],
  ];
  if (!homogeneous) return r;
  return [
    [...r[0], 0],
    [...r[1], 0],
    [...r[2], 0],
    [0, 0, 0, 1],
  ];
}

/** Rotation matrix about the z-axis (ManimCE `rotation_about_z`). */
function rotationAboutZ(angle: number): number[][] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

/** Transpose of the rotation matrix (ManimCE `rotation_matrix_transpose`). */
function rotationMatrixTranspose(angle: number, axis: number[]): number[][] {
  if ((axis[0] ?? 0) === 0 && (axis[1] ?? 0) === 0) {
    return matTranspose(rotationAboutZ(angle * Math.sign(axis[2] ?? 0)));
  }
  return matTranspose(rotationMatrix(angle, axis));
}

/**
 * Rotate a 2D or 3D vector by `angle` about `axis` (default OUT).
 * Throws if the vector has more than 3 components (ManimCE `rotate_vector`).
 */
function rotateVector(vector: number[], angle: number, axis: number[] = OUT): Vector3Tuple {
  if (vector.length > 3) {
    throw new Error('Vector must have the correct dimensions.');
  }
  const v = vector.length === 2 ? [vector[0], vector[1], 0] : vector;
  const result = matVecMul(rotationMatrix(angle, axis), v);
  return [result[0], result[1], result[2]];
}

/**
 * A matrix in SO(3) taking the z-axis to the normalized `vector`
 * (ManimCE `z_to_vector`).
 */
function zToVector(vector: number[]): number[][] {
  const axisZ = normalizeVec(vector);
  let axisY = normalizeVec(crossVec(axisZ, RIGHT));
  let axisX = crossVec(axisY, axisZ);
  if (lengthVec(axisY) === 0) {
    axisX = normalizeVec(crossVec(UP, axisZ));
    const c = crossVec(axisX, axisZ);
    axisY = [-c[0], -c[1], -c[2]];
  }
  return matTranspose([axisX, axisY, axisZ]);
}

// --- angles ------------------------------------------------------------------

/** Polar angle (theta) of the vector projected onto the xy-plane. */
function angleOfVector(vector: number[]): number {
  return Math.atan2(vector[1] ?? 0, vector[0] ?? 0);
}

/** Angle between two vectors, in `[0, PI]` (ManimCE `angle_between_vectors`). */
function angleBetweenVectors(v1: number[], v2: number[]): number {
  const n1 = normalize(v1);
  const n2 = normalize(v2);
  const diff = n1.map((x, i) => x - n2[i]);
  const sum = n1.map((x, i) => x + n2[i]);
  return 2 * Math.atan2(Math.sqrt(normSquared(diff)), Math.sqrt(normSquared(sum)));
}

/** Unit normal of two vectors (ManimCE `get_unit_normal`). */
function getUnitNormal(v1: number[], v2: number[], tol = 1e-6): Vector3Tuple {
  const div1 = Math.max(...v1.map(Math.abs));
  const div2 = Math.max(...v2.map(Math.abs));
  let u: number[];
  if (div1 === 0) {
    if (div2 === 0) return DOWN;
    u = v2.map((x) => x / div2);
  } else if (div2 === 0) {
    u = v1.map((x) => x / div1);
  } else {
    const u1 = v1.map((x) => x / div1);
    const u2 = v2.map((x) => x / div2);
    const cp = crossVec(u1, u2);
    const cpNorm = Math.sqrt(normSquared(cp));
    if (cpNorm > tol) return [cp[0] / cpNorm, cp[1] / cpNorm, cp[2] / cpNorm];
    u = u1;
  }
  if (Math.abs(u[0]) < tol && Math.abs(u[1]) < tol) return DOWN;
  const cp: Vector3Tuple = [-u[0] * u[2], -u[1] * u[2], u[0] * u[0] + u[1] * u[1]];
  const cpNorm = Math.sqrt(normSquared(cp));
  return [cp[0] / cpNorm, cp[1] / cpNorm, cp[2] / cpNorm];
}

// --- regular polygons --------------------------------------------------------

function compassDirections(n = 4, startVect: Vector3Tuple = RIGHT): Vector3Tuple[] {
  const angle = TAU / n;
  const out: Vector3Tuple[] = [];
  for (let k = 0; k < n; k++) out.push(rotateVector(startVect, k * angle));
  return out;
}

/**
 * Regularly spaced vertices around a circle at the origin
 * (ManimCE `regular_vertices`). Returns `[vertices, startAngle]`.
 */
function regularVertices(
  n: number,
  options: { radius?: number; startAngle?: number } = {},
): [Vector3Tuple[], number] {
  const radius = options.radius ?? 1;
  const startAngle = options.startAngle ?? (n % 2 === 0 ? 0 : TAU / 4);
  const startVector = rotateVector([radius, 0, 0], startAngle);
  return [compassDirections(n, startVector), startAngle];
}

// --- complex <-> R3 ----------------------------------------------------------

/** Map a complex number to a point `[re, im, 0]` (ManimCE `complex_to_R3`). */
function complexToR3(complexNum: Complex): Vector3Tuple {
  return [complexNum.re, complexNum.im, 0];
}

/** Map a point to a complex number `{ re, im }` (ManimCE `R3_to_complex`). */
function r3ToComplex(point: number[]): Complex {
  return { re: point[0] ?? 0, im: point[1] ?? 0 };
}

/** Lift a complex function to a point function (ManimCE `complex_func_to_R3_func`). */
function complexFuncToR3Func(complexFunc: (c: Complex) => Complex): (p: number[]) => Vector3Tuple {
  return (p) => complexToR3(complexFunc(r3ToComplex(p)));
}

// --- centroids and intersections --------------------------------------------

/** Center of mass (unweighted average) of the points (ManimCE `center_of_mass`). */
function centerOfMass(points: number[][]): Vector3Tuple {
  const sum: Vector3Tuple = [0, 0, 0];
  for (const p of points) {
    sum[0] += p[0] ?? 0;
    sum[1] += p[1] ?? 0;
    sum[2] += p[2] ?? 0;
  }
  const n = points.length;
  return [sum[0] / n, sum[1] / n, sum[2] / n];
}

/** Midpoint of two points (ManimCE `midpoint`). */
function midpoint(point1: number[], point2: number[]): Vector3Tuple {
  return centerOfMass([point1, point2]);
}

/**
 * Intersection of two lines, each given by two distinct points in the
 * xy-plane (ManimCE `line_intersection`). Throws if a z-coordinate is nonzero
 * or if the lines are parallel.
 */
function lineIntersection(line1: number[][], line2: number[][]): Vector3Tuple {
  for (const line of [line1, line2]) {
    for (const pt of line) {
      if ((pt[2] ?? 0) !== 0) throw new Error('Coords must be in the xy-plane.');
    }
  }
  const toLine = (line: number[][]): Vector3Tuple =>
    crossVec([line[0][0], line[0][1], 1], [line[1][0], line[1][1], 1]);
  const [x, y, z] = crossVec(toLine(line1), toLine(line2));
  if (z === 0) {
    throw new Error('The lines are parallel, there is no unique intersection point.');
  }
  return [x / z, y / z, 0];
}

/**
 * Intersections of lines `p0 + v0 t` with `p1 + v1 t`
 * (ManimCE `find_intersection`). For 3D inputs, returns the point on the first
 * ray closest to the second.
 */
function findIntersection(
  p0s: number[][],
  v0s: number[][],
  p1s: number[][],
  v1s: number[][],
  threshold = 1e-5,
): Vector3Tuple[] {
  const result: Vector3Tuple[] = [];
  for (let i = 0; i < p0s.length; i++) {
    const p0 = p0s[i];
    const v0 = v0s[i];
    const p1 = p1s[i];
    const v1 = v1s[i];
    const normal = crossVec(v1, crossVec(v0, v1));
    const dotV0 = v0[0] * normal[0] + v0[1] * normal[1] + v0[2] * normal[2];
    const denom = Math.max(dotV0, threshold);
    const diff = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const factor = (diff[0] * normal[0] + diff[1] * normal[1] + diff[2] * normal[2]) / denom;
    result.push([p0[0] + factor * v0[0], p0[1] + factor * v0[1], p0[2] + factor * v0[2]]);
  }
  return result;
}

// --- polygon orientation -----------------------------------------------------

/**
 * 2D trapezoidal integral of `y` over `x` (ManimCE `shoelace`); returns the
 * signed area. Note: this is `np.trapezoid(y, x)` and does NOT implicitly close
 * the polygon, unlike `signedArea2D` in `triangulate.ts`.
 */
function shoelace(xy: number[][]): number {
  let area = 0;
  for (let i = 0; i < xy.length - 1; i++) {
    area += ((xy[i + 1][0] - xy[i][0]) * (xy[i][1] + xy[i + 1][1])) / 2;
  }
  return area;
}

/** `"CW"` or `"CCW"` from the sign of `shoelace` (ManimCE `shoelace_direction`). */
function shoelaceDirection(xy: number[][]): 'CW' | 'CCW' {
  return shoelace(xy) > 0 ? 'CW' : 'CCW';
}

// --- spherical coordinates ---------------------------------------------------

/**
 * Cartesian `[x, y, z]` to spherical `[r, theta, phi]`
 * (ManimCE `cartesian_to_spherical`). `theta` is the azimuth in the xy-plane,
 * `phi` is the polar angle from +z.
 */
function cartesianToSpherical(vec: number[]): Vector3Tuple {
  const r = lengthVec(vec);
  if (r === 0) return [0, 0, 0];
  const phi = Math.acos((vec[2] ?? 0) / r);
  const theta = Math.atan2(vec[1] ?? 0, vec[0] ?? 0);
  return [r, theta, phi];
}

/** Spherical `[r, theta, phi]` to Cartesian (ManimCE `spherical_to_cartesian`). */
function sphericalToCartesian(spherical: number[]): Vector3Tuple {
  const [r, theta, phi] = spherical;
  return [
    r * Math.cos(theta) * Math.sin(phi),
    r * Math.sin(theta) * Math.sin(phi),
    r * Math.cos(phi),
  ];
}

/**
 * Endpoints of the perpendicular bisector of the segment `line`
 * (ManimCE `perpendicular_bisector`).
 */
function perpendicularBisector(
  line: number[][],
  normVector: number[] = OUT,
): [Vector3Tuple, Vector3Tuple] {
  const p1 = line[0];
  const p2 = line[1];
  const direction = crossVec([p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]], normVector);
  const m = midpoint(p1, p2);
  return [
    [m[0] + direction[0], m[1] + direction[1], m[2] + direction[2]],
    [m[0] - direction[0], m[1] - direction[1], m[2] - direction[2]],
  ];
}

// --- matrices and winding ----------------------------------------------------

/**
 * A `dim` x `dim` matrix of 0/1 flags that marks the band near the main
 * diagonal (ManimCE `thick_diagonal`). An entry is 1 when the absolute index
 * difference is less than `thickness`, else 0.
 */
function thickDiagonal(dim: number, thickness = 2): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < dim; r++) {
    const row: number[] = [];
    for (let c = 0; c < dim; c++) row.push(Math.abs(r - c) < thickness ? 1 : 0);
    out.push(row);
  }
  return out;
}

/**
 * The number of times the polygon `points` winds around the origin
 * (ManimCE `get_winding_number`). The orientation is positive counterclockwise.
 */
function getWindingNumber(points: number[][]): number {
  let totalAngle = 0;
  for (const [p1, p2] of adjacentPairs(points)) {
    const rawAngle = angleOfVector(p2) - angleOfVector(p1) + Math.PI;
    // Python-style modulo: the result is always non-negative for a positive TAU.
    const dAngle = (((rawAngle % TAU) + TAU) % TAU) - Math.PI;
    totalAngle += dAngle;
  }
  return totalAngle / TAU;
}

// --- public API (camelCase; ManimCE space_ops parity) ------------------------

export {
  normSquared,
  crossVec as cross,
  cross2d,
  normalize,
  quaternionMult,
  quaternionFromAngleAxis,
  angleAxisFromQuaternion,
  quaternionConjugate,
  rotationMatrix,
  rotationAboutZ,
  rotationMatrixTranspose,
  rotateVector,
  zToVector,
  angleOfVector,
  angleBetweenVectors,
  getUnitNormal,
  compassDirections,
  regularVertices,
  thickDiagonal,
  getWindingNumber,
  triangulatePolygon as earclipTriangulation,
  complexToR3,
  r3ToComplex,
  complexFuncToR3Func,
  centerOfMass,
  midpoint,
  lineIntersection,
  findIntersection,
  shoelace,
  shoelaceDirection,
  cartesianToSpherical,
  sphericalToCartesian,
  perpendicularBisector,
};
