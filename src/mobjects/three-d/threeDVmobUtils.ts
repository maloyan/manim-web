/**
 * Utility functions for three-dimensional VMobjects.
 *
 * Direct port of Manim CE `manim/mobject/three_d/three_d_utils.py`. Each helper
 * reads a VMobject's control-point array and computes a corner index, a corner
 * point, a unit normal, or the gradient start/end points used by the 3D camera
 * for shading.
 *
 * Point layout: this port stores a shared-anchor cubic Bezier chain, so a chain
 * of `n` cubics has `3n + 1` points and `n + 1` anchors (anchors at indices
 * `0, 3, 6, ...`). This matches CE's step-of-3 index arithmetic exactly.
 *
 * CE reads `vmob.points` (absolute coordinates, since CE bakes transforms into
 * its points). The port keeps a separate transform matrix, so these helpers use
 * `vmob.getPoints()` (world-space 3D points). For a standalone VMobject with no
 * ancestor transform, `getPoints()` equals the raw control points. The `points`
 * getter is not used because it drops the z coordinate.
 */

import { ORIGIN, UP, type Vector3Tuple } from '../../core/MobjectTypes';
import { getUnitNormal } from '../../utils/spaceOps';
import type { VMobject } from '../../core/VMobject';

/** Copy a world point array entry to a fixed-length 3-tuple. */
function toTuple(point: number[]): Vector3Tuple {
  return [point[0], point[1], point[2]];
}

/**
 * The anchors of the shared-anchor cubic chain: the points at indices that are
 * multiples of 3. Mirrors CE `VMobject.get_anchors()` for the gate in
 * {@link get3dVmobUnitNormal} (a path with 2 or fewer anchors has at most one
 * cubic and no well-defined surface normal).
 */
function getAnchors(points: number[][]): number[][] {
  return points.filter((_, i) => i % 3 === 0);
}

/**
 * The gradient start and end points, used by the 3D camera to shade a VMobject.
 * Port of CE `get_3d_vmob_gradient_start_and_end_points`.
 */
export function get3dVmobGradientStartAndEndPoints(vmob: VMobject): [Vector3Tuple, Vector3Tuple] {
  return [get3dVmobStartCorner(vmob), get3dVmobEndCorner(vmob)];
}

/** Index of the start corner (always 0). Port of CE `get_3d_vmob_start_corner_index`. */
export function get3dVmobStartCornerIndex(_vmob: VMobject): number {
  return 0;
}

/** Index of the end corner. Port of CE `get_3d_vmob_end_corner_index`. */
export function get3dVmobEndCornerIndex(vmob: VMobject): number {
  return Math.floor((vmob.getPoints().length - 1) / 6) * 3;
}

/** The start corner point. Port of CE `get_3d_vmob_start_corner`. */
export function get3dVmobStartCorner(vmob: VMobject): Vector3Tuple {
  const points = vmob.getPoints();
  if (points.length === 0) {
    return [...ORIGIN];
  }
  return toTuple(points[get3dVmobStartCornerIndex(vmob)]);
}

/** The end corner point. Port of CE `get_3d_vmob_end_corner`. */
export function get3dVmobEndCorner(vmob: VMobject): Vector3Tuple {
  const points = vmob.getPoints();
  if (points.length === 0) {
    return [...ORIGIN];
  }
  return toTuple(points[get3dVmobEndCornerIndex(vmob)]);
}

/**
 * The unit normal of the VMobject's surface at the given point index.
 * Port of CE `get_3d_vmob_unit_normal`.
 */
export function get3dVmobUnitNormal(vmob: VMobject, pointIndex: number): Vector3Tuple {
  const points = vmob.getPoints();
  const nPoints = points.length;
  if (getAnchors(points).length <= 2) {
    return [...UP];
  }
  const i = pointIndex;
  const im3 = i > 2 ? i - 3 : nPoints - 4;
  const ip3 = i < nPoints - 3 ? i + 3 : 3;
  const unitNormal = getUnitNormal(
    points[ip3].map((x, k) => x - points[i][k]),
    points[im3].map((x, k) => x - points[i][k]),
  );
  if (Math.hypot(...unitNormal) === 0) {
    return [...UP];
  }
  return unitNormal;
}

/** The unit normal at the start corner. Port of CE `get_3d_vmob_start_corner_unit_normal`. */
export function get3dVmobStartCornerUnitNormal(vmob: VMobject): Vector3Tuple {
  return get3dVmobUnitNormal(vmob, get3dVmobStartCornerIndex(vmob));
}

/** The unit normal at the end corner. Port of CE `get_3d_vmob_end_corner_unit_normal`. */
export function get3dVmobEndCornerUnitNormal(vmob: VMobject): Vector3Tuple {
  return get3dVmobUnitNormal(vmob, get3dVmobEndCornerIndex(vmob));
}
