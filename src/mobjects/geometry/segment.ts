import { Vector3Tuple } from '../../core/Mobject';

/**
 * Pure endpoint geometry shared by Line, Arrow and DoubleArrow.
 *
 * Every function takes the two endpoints already resolved to the SAME frame
 * (in practice the caller's world-space `getStart()` / `getEnd()`), so the
 * results stay correct under any group transform. This is the single source of
 * truth for segment-derived quantities; callers must not recompute them from
 * cached/local endpoints, which go stale under rotation/scale.
 */

/** Euclidean length of the segment. */
export function segmentLength(start: Vector3Tuple, end: Vector3Tuple): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Unit direction from start to end. Returns [1, 0, 0] for a zero-length
 * segment (matching the historical Line/Arrow fallback).
 */
export function segmentDirection(start: Vector3Tuple, end: Vector3Tuple): Vector3Tuple {
  const length = segmentLength(start, end);
  if (length === 0) return [1, 0, 0];
  return [(end[0] - start[0]) / length, (end[1] - start[1]) / length, (end[2] - start[2]) / length];
}

/** Angle of the segment in the XY plane, in radians. */
export function segmentAngle(start: Vector3Tuple, end: Vector3Tuple): number {
  return Math.atan2(end[1] - start[1], end[0] - start[0]);
}

/** Midpoint of the segment. */
export function segmentMidpoint(start: Vector3Tuple, end: Vector3Tuple): Vector3Tuple {
  return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2];
}

/** Point at parameter t along the segment (0 = start, 1 = end). */
export function segmentPointAt(start: Vector3Tuple, end: Vector3Tuple, t: number): Vector3Tuple {
  return [
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
    start[2] + (end[2] - start[2]) * t,
  ];
}
