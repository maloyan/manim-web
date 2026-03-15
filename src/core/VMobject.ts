/**
 * Vectorized Mobject - a mobject defined by cubic Bezier curves.
 * This is the base class for all path-based shapes.
 *
 * Points are stored as cubic Bezier control points:
 * [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]
 *
 * Each curve segment uses 4 points: anchor -> handle -> handle -> anchor
 * Consecutive segments share the anchor point.
 */

import * as THREE from 'three';
import { Vector3Tuple } from './Mobject';
import { VMobjectRendering } from './VMobjectRendering';
import { lerp, lerpPoint as lerpPoint3D } from '../utils/math';
import type { Point } from './VMobjectCurves';
import { getNumCurvesFromPoints } from './VMobjectCurves';
import {
  isNearlyLinear,
  pointInPolygon,
  sampleBezierOutline,
  sampleBezierPath,
  isClosedPath,
} from './VMobjectGeometry';

// Re-export Point type so existing `import { Point } from './VMobject'` keeps working.
export type { Point } from './VMobjectCurves';

/**
 * Vectorized mobject class for path-based shapes.
 */
export class VMobject extends VMobjectRendering {
  /**
   * Array of cubic Bezier control points in 3D.
   * Each point is [x, y, z].
   * Stored as: [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]
   */
  protected _points3D: number[][] = [];

  /** Number of points visible (for Create animation) */
  protected _visiblePointCount: number | null = null;

  constructor() {
    super();
    // VMobjects have visible fill by default
    this.fillOpacity = 0.5;
    this._style.fillOpacity = 0.5;
    this._style.strokeOpacity = 1;
  }

  // -----------------------------------------------------------------------
  // Point access
  // -----------------------------------------------------------------------

  /**
   * Get all points as 2D Point objects (derived from _points3D)
   */
  get points(): Point[] {
    return this._points3D.map((p) => ({ x: p[0], y: p[1] }));
  }

  /**
   * Set the points defining this VMobject.
   * Accepts either Point[] ({x, y} objects) or number[][] ([x, y, z] arrays).
   * @param points - Array of points in either format
   * @returns this for chaining
   */
  setPoints(points: Point[] | number[][]): this {
    if (points.length === 0) {
      this._points3D = [];
    } else if (Array.isArray(points[0])) {
      // points is number[][]
      const points3D = points as number[][];
      this._points3D = points3D.map((p) => [...p]);
    } else {
      // points is Point[]
      const points2D = points as Point[];
      this._points3D = points2D.map((p) => [p.x, p.y, 0]);
    }
    this._visiblePointCount = null;
    this._geometryDirty = true;
    // Propagate dirty upward so parent containers (e.g. Group holding grid
    // lines) are traversed by _syncToThree and children's geometry rebuilds.
    this._markDirtyUpward();
    return this;
  }

  /**
   * Set the points defining this VMobject using 3D arrays (alias for setPoints with number[][])
   * @param points - Array of [x, y, z] control points for cubic Bezier curves
   * @returns this for chaining
   */
  setPoints3D(points: number[][]): this {
    return this.setPoints(points);
  }

  /**
   * Get all points defining this VMobject as 3D arrays
   * @returns Copy of the points array
   */
  getPoints(): number[][] {
    return this._points3D.map((p) => [...p]);
  }

  /**
   * Get the number of points
   */
  get numPoints(): number {
    return this._points3D.length;
  }

  /**
   * Get the number of visible points (for Create animation)
   */
  get visiblePointCount(): number {
    return this._visiblePointCount ?? this._points3D.length;
  }

  /**
   * Set the number of visible points (for Create animation)
   */
  set visiblePointCount(count: number) {
    this._visiblePointCount = Math.max(0, Math.min(this._points3D.length, count));
    this._geometryDirty = true;
    this._markDirty();
  }

  /**
   * Get points that should be visible (for rendering) as 2D Points
   */
  getVisiblePoints(): Point[] {
    const count = this.visiblePointCount;
    return this._points3D.slice(0, count).map((p) => ({ x: p[0], y: p[1] }));
  }

  /**
   * Get points that should be visible (for rendering) as 3D arrays
   */
  getVisiblePoints3D(): number[][] {
    const count = this.visiblePointCount;
    return this._points3D.slice(0, count).map((p) => [...p]);
  }

  /**
   * Set visible point count for progressive creation animations.
   * Use null to show all points.
   */
  setVisiblePointCount(count: number | null): void {
    this._visiblePointCount = count;
    this._geometryDirty = true;
    this._markDirty();
  }

  /**
   * Get the visible point count (null means all points visible).
   */
  getVisiblePointCount(): number | null {
    return this._visiblePointCount;
  }

  // -----------------------------------------------------------------------
  // Point manipulation
  // -----------------------------------------------------------------------

  /**
   * Add points to this VMobject using 2D Point objects
   */
  addPoints(...points: Point[]): this {
    this._points3D.push(...points.map((p) => [p.x, p.y, 0]));
    this._geometryDirty = true;
    this._markDirty();
    return this;
  }

  /**
   * Set the points to form straight line segments between corner points.
   * Each pair of consecutive corners becomes a cubic Bezier with linear handles.
   * Matches Manim's set_points_as_corners.
   * @param corners Array of [x, y, z] corner points
   * @returns this for chaining
   */
  setPointsAsCorners(corners: number[][]): this {
    if (corners.length < 2) {
      if (corners.length === 1) {
        return this.setPoints([corners[0]]);
      }
      return this.setPoints([]);
    }

    const points: number[][] = [];
    for (let i = 0; i < corners.length - 1; i++) {
      const p0 = corners[i];
      const p1 = corners[i + 1];
      if (i === 0) {
        points.push([p0[0], p0[1], p0[2] || 0]);
      }
      // handle1 = lerp(p0, p1, 1/3)
      points.push([
        p0[0] + (p1[0] - p0[0]) / 3,
        p0[1] + (p1[1] - p0[1]) / 3,
        (p0[2] || 0) + ((p1[2] || 0) - (p0[2] || 0)) / 3,
      ]);
      // handle2 = lerp(p0, p1, 2/3)
      points.push([
        p0[0] + (2 * (p1[0] - p0[0])) / 3,
        p0[1] + (2 * (p1[1] - p0[1])) / 3,
        (p0[2] || 0) + (2 * ((p1[2] || 0) - (p0[2] || 0))) / 3,
      ]);
      // anchor2 = p1
      points.push([p1[0], p1[1], p1[2] || 0]);
    }

    return this.setPoints(points);
  }

  /**
   * Add straight line segments from the last point to each corner.
   * Each corner creates a new cubic Bezier segment with linear handles.
   * Matches Manim's add_points_as_corners.
   * @param corners Array of [x, y, z] corner points to connect to
   * @returns this for chaining
   */
  addPointsAsCorners(corners: number[][]): this {
    for (const corner of corners) {
      if (this._points3D.length === 0) {
        this.setPointsAsCorners([corner]);
        continue;
      }

      const last = this._points3D[this._points3D.length - 1];
      const cz = corner[2] || 0;
      const lz = last[2] || 0;
      // handle1 = lerp(last, corner, 1/3)
      const h1 = [
        last[0] + (corner[0] - last[0]) / 3,
        last[1] + (corner[1] - last[1]) / 3,
        lz + (cz - lz) / 3,
      ];
      // handle2 = lerp(last, corner, 2/3)
      const h2 = [
        last[0] + (2 * (corner[0] - last[0])) / 3,
        last[1] + (2 * (corner[1] - last[1])) / 3,
        lz + (2 * (cz - lz)) / 3,
      ];
      const anchor = [corner[0], corner[1], cz];

      this._points3D.push(h1, h2, anchor);
      this._geometryDirty = true;
      this._markDirtyUpward();
    }
    return this;
  }

  /**
   * Clear all points
   */
  clearPoints(): this {
    this._points3D = [];
    this._visiblePointCount = null;
    this._geometryDirty = true;
    this._markDirty();
    return this;
  }

  // -----------------------------------------------------------------------
  // Interpolation and alignment
  // -----------------------------------------------------------------------

  /**
   * Interpolate this VMobject towards a target VMobject
   * @param target - The target VMobject to interpolate towards
   * @param alpha - Progress from 0 (this) to 1 (target)
   * @returns this for chaining
   */
  interpolate(target: VMobject, alpha: number): this {
    // Ensure we have the same number of points
    if (this._points3D.length !== target._points3D.length) {
      this.alignPoints(target);
    }

    // Interpolate each 3D point
    for (let i = 0; i < this._points3D.length; i++) {
      this._points3D[i] = lerpPoint3D(this._points3D[i], target._points3D[i], alpha);
    }

    // Interpolate style properties
    this._opacity = lerp(this._opacity, target._opacity, alpha);
    this.fillOpacity = lerp(this.fillOpacity, target.fillOpacity, alpha);
    this.strokeWidth = lerp(this.strokeWidth, target.strokeWidth, alpha);

    // Also interpolate _style for backward compatibility
    if (this._style.fillOpacity !== undefined && target._style.fillOpacity !== undefined) {
      this._style.fillOpacity = lerp(this._style.fillOpacity, target._style.fillOpacity, alpha);
    }
    if (this._style.strokeOpacity !== undefined && target._style.strokeOpacity !== undefined) {
      this._style.strokeOpacity = lerp(
        this._style.strokeOpacity,
        target._style.strokeOpacity,
        alpha,
      );
    }
    if (this._style.strokeWidth !== undefined && target._style.strokeWidth !== undefined) {
      this._style.strokeWidth = lerp(this._style.strokeWidth, target._style.strokeWidth, alpha);
    }

    // Interpolate position
    this.position.lerp(target.position, alpha);

    // Interpolate scale
    this.scaleVector.lerp(target.scaleVector, alpha);

    this._geometryDirty = true;
    this._markDirty();
    return this;
  }

  /**
   * Align points between this VMobject and a target so they have the same
   * count, consistent winding, and optimal rotation for smooth morphing.
   * @param target - The target VMobject to align with
   */
  alignPoints(target: VMobject): void {
    const thisCount = this._points3D.length;
    const targetCount = target._points3D.length;

    const maxCount = Math.max(thisCount, targetCount);

    // Interpolate points to match counts
    if (thisCount < maxCount) {
      this._points3D = this._interpolatePointList3D(this._points3D, maxCount);
    }
    if (targetCount < maxCount) {
      target._points3D = this._interpolatePointList3D(target._points3D, maxCount);
    }

    // Need at least 4 points (one cubic bezier segment) to optimize
    if (this._points3D.length < 4) return;

    // Ensure consistent winding direction between source and target.
    // Opposite winding causes collapsed/twisted intermediate shapes.
    const srcWinding = VMobject._signedArea2D(this._points3D);
    const tgtWinding = VMobject._signedArea2D(target._points3D);
    if (srcWinding * tgtWinding < 0) {
      // Opposite winding — reverse target points (preserve bezier structure)
      target._points3D = VMobject._reverseBezierPath(target._points3D);
    }

    // Find the cyclic rotation of target points that minimises total
    // squared distance to the source, so corresponding points are
    // geometrically close and the morph looks smooth.
    target._points3D = VMobject._bestRotation(this._points3D, target._points3D);
  }

  /**
   * Compute the signed area of a 2D polygon formed by the anchor points.
   * Positive = counter-clockwise, negative = clockwise.
   */
  private static _signedArea2D(pts: number[][]): number {
    // Use only anchor points (every 3rd starting from 0 for cubic bezier)
    const stride = 3;
    const anchors: number[][] = [];
    for (let i = 0; i < pts.length; i += stride) {
      anchors.push(pts[i]);
    }
    if (anchors.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < anchors.length; i++) {
      const j = (i + 1) % anchors.length;
      area += anchors[i][0] * anchors[j][1];
      area -= anchors[j][0] * anchors[i][1];
    }
    return area / 2;
  }

  /**
   * Reverse a cubic-bezier point path while preserving bezier structure.
   * For cubic segments [A0, H1, H2, A1, H3, H4, A2, ...],
   * reversing means the path goes in the opposite direction.
   */
  private static _reverseBezierPath(pts: number[][]): number[][] {
    if (pts.length < 2) return pts.map((p) => [...p]);
    // Simply reverse the entire array — this reverses the path direction
    // and swaps control handle order within each segment, which is correct
    // for cubic beziers.
    return [...pts].reverse().map((p) => [...p]);
  }

  /**
   * Find the cyclic rotation of `target` anchor points that minimises
   * total squared distance to `source`, then apply that rotation.
   * Only rotates by multiples of the bezier stride (3) to preserve
   * the cubic bezier segment structure.
   */
  private static _bestRotation(source: number[][], target: number[][]): number[][] {
    const n = target.length;
    if (n < 4) return target;

    // Detect closed path: first point ≈ last point
    const first = target[0];
    const last = target[n - 1];
    const closed = Math.abs(first[0] - last[0]) < 1e-6 && Math.abs(first[1] - last[1]) < 1e-6;

    // For closed paths, the "open" portion is points 0..n-2 (length = n-1).
    // We rotate within this open portion, then duplicate the first point.
    const openLen = closed ? n - 1 : n;

    const stride = 3; // cubic bezier: each segment = 3 new points
    const numRotations = Math.floor(openLen / stride);
    if (numRotations <= 1) return target;

    let bestDist = Infinity;
    let bestShift = 0;

    for (let r = 0; r < numRotations; r++) {
      const shift = r * stride;
      let dist = 0;
      for (let i = 0; i < openLen; i++) {
        const si = source[i];
        const ti = target[(i + shift) % openLen];
        const dx = si[0] - ti[0];
        const dy = si[1] - ti[1];
        dist += dx * dx + dy * dy;
      }
      if (dist < bestDist) {
        bestDist = dist;
        bestShift = shift;
      }
    }

    if (bestShift === 0) return target;

    // Apply the rotation within the open portion
    const rotated: number[][] = [];
    for (let i = 0; i < openLen; i++) {
      const srcIdx = (i + bestShift) % openLen;
      rotated.push([...target[srcIdx]]);
    }
    // Re-close the path
    if (closed) {
      rotated.push([...rotated[0]]);
    }
    return rotated;
  }

  /**
   * Interpolate a 3D point list to have a specific number of points.
   */
  protected _interpolatePointList3D(points: number[][], targetCount: number): number[][] {
    if (points.length === 0) {
      return Array(targetCount)
        .fill(null)
        .map(() => [0, 0, 0]);
    }

    if (points.length === targetCount) {
      return points.map((p) => [...p]);
    }

    if (points.length === 1) {
      return Array(targetCount)
        .fill(null)
        .map(() => [...points[0]]);
    }

    const result: number[][] = [];
    const ratio = (points.length - 1) / (targetCount - 1);

    for (let i = 0; i < targetCount; i++) {
      const t = i * ratio;
      const index = Math.floor(t);
      const frac = t - index;

      if (index >= points.length - 1) {
        result.push([...points[points.length - 1]]);
      } else {
        result.push(lerpPoint3D(points[index], points[index + 1], frac));
      }
    }

    return result;
  }

  // -----------------------------------------------------------------------
  // Copy / clone
  // -----------------------------------------------------------------------

  /**
   * Create a copy of this VMobject.
   * Subclasses override _createCopy() to produce an instance of the right
   * concrete type (Circle, Square, etc.), but those constructors typically
   * regenerate points from their own parameters (radius, sideLength, ...).
   * After a Transform animation has morphed the point data, the regenerated
   * points no longer match the actual visual state.  We therefore always
   * overwrite the clone's _points3D with the source's current data.
   */
  override copy(): VMobject {
    const clone = super.copy() as VMobject;
    // Overwrite points so they reflect current (possibly morphed) state,
    // not whatever _createCopy()'s constructor regenerated.
    clone._points3D = this._points3D.map((p) => [...p]);
    clone._visiblePointCount = this._visiblePointCount;
    clone._geometryDirty = true;
    return clone;
  }

  /**
   * Create a copy of this VMobject
   */
  protected override _createCopy(): VMobject {
    const vmobject = new VMobject();
    vmobject._points3D = this._points3D.map((p) => [...p]);
    vmobject._visiblePointCount = this._visiblePointCount;
    return vmobject;
  }

  // -----------------------------------------------------------------------
  // Geometry queries
  // -----------------------------------------------------------------------

  /**
   * Get the unit vector from the first to the last point of this VMobject,
   * accounting for the object's current rotation transform.
   */
  getUnitVector(): Vector3Tuple {
    const points = this._points3D;
    if (points.length < 2) {
      return [1, 0, 0];
    }
    const start = points[0];
    const end = points[points.length - 1];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (mag < 1e-10) return [1, 0, 0];
    // Apply the object's rotation to the local direction vector
    const vec = new THREE.Vector3(dx / mag, dy / mag, dz / mag);
    const quat = new THREE.Quaternion().setFromEuler(this.rotation);
    vec.applyQuaternion(quat);
    return [vec.x, vec.y, vec.z];
  }

  /**
   * Get the center of this VMobject based on its points.
   * Uses bounding box center (matching Python Manim's get_center behavior)
   * rather than point centroid, which is inaccurate for Bezier control points.
   */
  override getCenter(): Vector3Tuple {
    if (this._points3D.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;
    for (const p of this._points3D) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
      if (p[2] < minZ) minZ = p[2];
      if (p[2] > maxZ) maxZ = p[2];
    }

    return [
      this.position.x + (minX + maxX) / 2,
      this.position.y + (minY + maxY) / 2,
      this.position.z + (minZ + maxZ) / 2,
    ];
  }

  // -----------------------------------------------------------------------
  // Geometry utility wrappers (delegate to standalone functions)
  // -----------------------------------------------------------------------

  /** @internal Check if a Bezier segment is nearly linear. */
  protected static _isNearlyLinear(
    p0: number[],
    p1: number[],
    p2: number[],
    p3: number[],
  ): boolean {
    return isNearlyLinear(p0, p1, p2, p3);
  }

  /** @internal Ray-casting point-in-polygon test. */
  protected static _pointInPolygon(point: number[], ring: number[][]): boolean {
    return pointInPolygon(point, ring);
  }

  /** @internal Sample Bezier outline for earcut triangulation. */
  protected _sampleBezierOutline(points: number[][], samplesPerSegment: number): number[][] {
    return sampleBezierOutline(points, samplesPerSegment);
  }

  /** @internal Sample Bezier path for stroke rendering. */
  protected _sampleBezierPath(points: number[][], samplesPerSegment?: number): number[][] {
    return sampleBezierPath(points, samplesPerSegment);
  }

  /** @internal Check if Bezier control points form a closed path. */
  protected _isClosedPath(points3D: number[][]): boolean {
    return isClosedPath(points3D);
  }

  // -----------------------------------------------------------------------
  // Disposal
  // -----------------------------------------------------------------------

  /**
   * Clean up Three.js resources
   */
  override dispose(): void {
    this._disposeRenderingResources();
    super.dispose();
  }
}

/**
 * Get the number of curve segments in a VMobject.
 * Each cubic Bezier segment uses 4 points (anchor, handle, handle, anchor),
 * with consecutive segments sharing anchors.
 * @param vmobject - The VMobject to count curves from
 * @returns Number of curve segments
 */
export function getNumCurves(vmobject: VMobject): number {
  return getNumCurvesFromPoints(vmobject.getPoints());
}

/**
 * Get the nth curve segment from a VMobject as a new VMobject.
 * @param vmobject - The source VMobject
 * @param n - Index of the curve segment (0-based)
 * @returns A new VMobject containing just that curve segment
 */
export function getNthCurve(vmobject: VMobject, n: number): VMobject {
  const points = vmobject.getPoints();
  const numCurves = getNumCurvesFromPoints(points);

  if (n < 0 || n >= numCurves) {
    throw new Error(`Curve index ${n} out of range. VMobject has ${numCurves} curves.`);
  }

  const startIndex = n * 3;
  const curvePoints = points.slice(startIndex, startIndex + 4);

  const curve = new VMobject();
  curve.setPoints(curvePoints);

  curve.setColor(vmobject.color);
  curve.setOpacity(vmobject.opacity);
  curve.setStrokeWidth(vmobject.strokeWidth);
  curve.setFillOpacity(vmobject.fillOpacity);

  return curve;
}

/**
 * Split a VMobject's curves into separate VMobject submobjects.
 * Each cubic Bezier curve segment becomes its own VMobject child.
 * Useful for animating parts of a path independently (e.g., staggered animations).
 *
 * @param vmobject - The VMobject to split
 * @returns A new VMobject with each curve as a child submobject
 *
 * @example
 * ```typescript
 * const path = new VMobject();
 * path.setPoints([...complex path with multiple curves...]);
 *
 * // Split into individual curves for staggered animation
 * const curves = curvesAsSubmobjects(path);
 *
 * // Now animate each curve independently
 * for (const curve of curves.children) {
 *   scene.play(Create(curve));
 * }
 * ```
 */
export function curvesAsSubmobjects(vmobject: VMobject): VMobject {
  const numCurves = getNumCurvesFromPoints(vmobject.getPoints());

  const parent = new VMobject();

  parent.position.copy(vmobject.position);
  parent.rotation.copy(vmobject.rotation);
  parent.scaleVector.copy(vmobject.scaleVector);

  parent.clearPoints();
  parent.setFillOpacity(0);

  for (let i = 0; i < numCurves; i++) {
    const curve = getNthCurve(vmobject, i);
    parent.add(curve);
  }

  return parent;
}

/**
 * CurvesAsSubmobjects class - Splits a VMobject's curves into separate submobjects.
 *
 * This class extends VMobject and creates children where each child is a single
 * cubic Bezier curve segment from the source VMobject. This is useful for:
 * - Staggered animations (animate each curve segment with delay)
 * - Per-curve styling (color each segment differently)
 * - Selective curve manipulation
 *
 * @example
 * ```typescript
 * const path = new VMobject();
 * path.setPoints([...]);
 *
 * const curves = new CurvesAsSubmobjects(path);
 *
 * // Access individual curves
 * curves.children[0].setColor('red');
 * curves.children[1].setColor('blue');
 * ```
 */
export class CurvesAsSubmobjects extends VMobject {
  /** The source VMobject this was created from */
  protected _source: VMobject | null = null;

  /**
   * Create a CurvesAsSubmobjects from a VMobject.
   * @param vmobject - The VMobject to split into curve submobjects
   */
  constructor(vmobject?: VMobject) {
    super();

    // No fill for the container
    this.fillOpacity = 0;
    this._style.fillOpacity = 0;

    if (vmobject) {
      this.setFromVMobject(vmobject);
    }
  }

  /**
   * Set up this object from a VMobject, splitting its curves into children.
   * @param vmobject - The source VMobject
   * @returns this for chaining
   */
  setFromVMobject(vmobject: VMobject): this {
    this._source = vmobject;

    // Clear existing children
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }

    // Clear own points
    this.clearPoints();

    // Copy transform properties
    this.position.copy(vmobject.position);
    this.rotation.copy(vmobject.rotation);
    this.scaleVector.copy(vmobject.scaleVector);

    // Extract each curve as a child
    const numCurves = getNumCurvesFromPoints(vmobject.getPoints());
    for (let i = 0; i < numCurves; i++) {
      const curve = getNthCurve(vmobject, i);
      this.add(curve);
    }

    this._markDirty();
    return this;
  }

  /**
   * Get the number of curve segments (same as number of children).
   */
  get numCurves(): number {
    return this.children.length;
  }

  /**
   * Get the nth curve as a VMobject.
   * @param n - Index of the curve (0-based)
   * @returns The curve VMobject at that index
   */
  getCurve(n: number): VMobject {
    if (n < 0 || n >= this.children.length) {
      throw new Error(`Curve index ${n} out of range. Has ${this.children.length} curves.`);
    }
    return this.children[n] as VMobject;
  }

  /**
   * Iterate over all curves.
   */
  [Symbol.iterator](): Iterator<VMobject> {
    return (this.children as VMobject[])[Symbol.iterator]();
  }

  /**
   * Apply a function to each curve.
   * @param fn - Function to apply
   * @returns this for chaining
   */
  forEach(fn: (curve: VMobject, index: number) => void): this {
    (this.children as VMobject[]).forEach(fn);
    return this;
  }

  /**
   * Map over all curves.
   * @param fn - Mapping function
   * @returns Array of mapped values
   */
  map<T>(fn: (curve: VMobject, index: number) => T): T[] {
    return (this.children as VMobject[]).map(fn);
  }

  /**
   * Create a copy of this CurvesAsSubmobjects.
   */
  protected override _createCopy(): VMobject {
    const copy = new CurvesAsSubmobjects();
    copy._source = this._source;
    return copy;
  }
}
