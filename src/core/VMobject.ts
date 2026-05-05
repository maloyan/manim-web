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

  /** Base subpath-length metadata (intrinsic topology, e.g. SVG compound paths). */
  protected _baseSubpathLengths?: number[];

  /** Transform-time override for subpath lengths (compound-path metadata). */
  protected _transformSubpathLengths?: number[];

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
  // Transform subpath metadata
  // -----------------------------------------------------------------------

  /**
   * Set base subpath-length metadata for this VMobject.
   * Represents intrinsic topology (e.g. outer contour + holes from SVG parsing).
   */
  setBaseSubpathLengths(lengths: number[] | undefined): void {
    this._baseSubpathLengths = lengths ? [...lengths] : undefined;
    this._geometryDirty = true;
    this._markDirtyUpward();
  }

  /**
   * Get base subpath lengths (intrinsic topology metadata).
   * Subclasses may override this to compute dynamic metadata.
   */
  getSubpathLengths(): number[] | undefined {
    return this._baseSubpathLengths ? [...this._baseSubpathLengths] : undefined;
  }

  /**
   * Set transform-time subpath lengths override.
   * Used by Transform animations to preserve compound-path structure.
   * @param lengths - Array of subpath lengths, or undefined to clear
   */
  setTransformSubpathLengths(lengths: number[] | undefined): void {
    if (lengths === undefined) {
      this._transformSubpathLengths = undefined;
    } else {
      this._transformSubpathLengths = [...lengths];
    }
    this._geometryDirty = true;
    this._markDirtyUpward();
  }

  /**
   * Get effective subpath lengths for rendering.
   * Returns transform override if present, else base/subclass metadata.
   */
  getEffectiveSubpathLengths(): number[] | undefined {
    if (this._transformSubpathLengths !== undefined) {
      return [...this._transformSubpathLengths];
    }
    return this.getSubpathLengths?.();
  }

  /**
   * Get orientation sign for each subpath: +1 (CCW) or -1 (CW).
   * Returns undefined when subpath metadata is missing or inconsistent.
   */
  getSubpathOrientationSigns(lengths?: number[]): Array<1 | -1> | undefined {
    const effective = lengths ?? this.getEffectiveSubpathLengths();
    if (!effective || effective.length === 0) return undefined;

    const signs: Array<1 | -1> = [];
    let offset = 0;
    for (const len of effective) {
      if (len <= 0 || offset + len > this._points3D.length) return undefined;
      const chunk = this._points3D.slice(offset, offset + len);
      const area = VMobject._signedArea2D(chunk);
      signs.push(area < 0 ? -1 : 1);
      offset += len;
    }

    if (offset !== this._points3D.length) return undefined;
    return signs;
  }

  /**
   * Get orientation sign for a specific subpath index: +1 (CCW) or -1 (CW).
   */
  getSubpathOrientationSign(index: number): 1 | -1 {
    const signs = this.getSubpathOrientationSigns();
    if (signs && index >= 0 && index < signs.length) {
      return signs[index];
    }
    return VMobject._signedArea2D(this._points3D) < 0 ? -1 : 1;
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
    if (this._transformSubpathLengths !== undefined) {
      clone._transformSubpathLengths = [...this._transformSubpathLengths];
    }
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
    if (this._transformSubpathLengths !== undefined) {
      vmobject._transformSubpathLengths = [...this._transformSubpathLengths];
    }
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
   * Get the center of this VMobject based on its own local points.
   * Uses bounding box center (matching Python Manim's get_center behavior)
   * rather than point centroid, which is inaccurate for Bezier control points.
   */
  override getCenter(): Vector3Tuple {
    const localCenter = VMobject._boundingBoxCenter(this._points3D);
    if (!localCenter) {
      return [this.position.x, this.position.y, this.position.z];
    }

    return [
      this.position.x + localCenter[0],
      this.position.y + localCenter[1],
      this.position.z + localCenter[2],
    ];
  }

  /**
   * Compute local bounding-box center for a list of points.
   */
  private static _boundingBoxCenter(points: number[][]): Vector3Tuple | null {
    if (points.length === 0) return null;

    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    for (const p of points) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
      if (p[2] < minZ) minZ = p[2];
      if (p[2] > maxZ) maxZ = p[2];
    }

    return [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
  }

  /**
   * Compute local bounding-box center across this VMobject and all descendants
   * that expose point data.
   */
  private _familyPointsCenter(): Vector3Tuple | null {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;
    let hasPoints = false;

    for (const m of this.getFamily()) {
      const asAny = m as unknown as { getPoints?: () => number[][] };
      if (typeof asAny.getPoints !== 'function') continue;

      for (const p of asAny.getPoints()) {
        hasPoints = true;
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
        if (p[2] < minZ) minZ = p[2];
        if (p[2] > maxZ) maxZ = p[2];
      }
    }

    if (!hasPoints) return null;
    return [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
  }

  /**
   * Centers local geometry around the origin and updates position accordingly.
   *
   * This scans all descendant VMobject points (not only this._points3D), so
   * container-style VMobjects (e.g. MathTex/SVGMobject/CurvesAsSubmobjects)
   * are also centered correctly.
   *
   * @returns this for chaining
   */
  centerPointsAroundPosition(): this {
    const center = this._familyPointsCenter();
    if (!center) {
      return this;
    }

    // Translate descendant geometry by -center in local coordinates.
    for (const m of this.getFamily()) {
      if (m instanceof VMobject) {
        for (const p of m._points3D) {
          p[0] -= center[0];
          p[1] -= center[1];
          p[2] -= center[2];
        }
        m._geometryDirty = true;
        m._markDirty();
      }
    }

    // Update root position to compensate so world-space appearance is unchanged.
    this.position.x += center[0];
    this.position.y += center[1];
    this.position.z += center[2];

    this._geometryDirty = true;
    this._markDirtyUpward();

    return this;
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

// Re-export curve utilities for backward compatibility
// Curve utilities (getNumCurves, getNthCurve, curvesAsSubmobjects, CurvesAsSubmobjects)
// are available from './VMobjectCurveUtils' - import directly to avoid circular dependency
