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
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Mobject, Vector3Tuple } from './Mobject';

/**
 * 2D Point interface for backward compatibility
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Helper function for linear interpolation between numbers
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Helper function to interpolate between two 3D points
 */
function lerpPoint3D(a: number[], b: number[], t: number): number[] {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t)
  ];
}

/**
 * Helper function to interpolate between two 2D Points
 */
function lerpPoint2D(a: Point, b: Point, t: number): Point {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t)
  };
}

/**
 * Vectorized mobject class for path-based shapes.
 */
export class VMobject extends Mobject {
  /**
   * Array of 2D points for backward compatibility.
   * Each point is {x, y}.
   */
  protected _points2D: Point[] = [];

  /**
   * Array of cubic Bezier control points in 3D.
   * Each point is [x, y, z].
   * Stored as: [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]
   */
  protected _points3D: number[][] = [];

  /** Number of points visible (for Create animation) */
  protected _visiblePointCount: number | null = null;

  /** Three.js stroke material (Line2 LineMaterial for thick strokes) */
  protected _strokeMaterial: LineMaterial | null = null;

  /** Three.js fill material */
  protected _fillMaterial: THREE.MeshBasicMaterial | null = null;

  /** Whether geometry needs rebuild (separate from material dirty) */
  protected _geometryDirty: boolean = true;

  /** Cached Line2 for in-place geometry updates (avoids dispose/recreate) */
  private _cachedLine2: Line2 | null = null;

  /** Cached fill mesh for in-place geometry updates */
  private _cachedFillMesh: THREE.Mesh | null = null;

  /** Renderer resolution for LineMaterial (set by Scene) */
  static _rendererWidth: number = 800;
  static _rendererHeight: number = 450;

  constructor() {
    super();
    // VMobjects have visible fill by default
    this.fillOpacity = 0.5;
    this._style.fillOpacity = 0.5;
    this._style.strokeOpacity = 1;
  }

  /**
   * Get all points as 2D Point objects (backward compatibility)
   */
  get points(): Point[] {
    return this._points2D.map(p => ({ ...p }));
  }

  /**
   * Set the points defining this VMobject.
   * Accepts either Point[] ({x, y} objects) or number[][] ([x, y, z] arrays).
   * @param points - Array of points in either format
   * @returns this for chaining
   */
  setPoints(points: Point[] | number[][]): this {
    if (points.length === 0) {
      this._points2D = [];
      this._points3D = [];
    } else if (Array.isArray(points[0])) {
      // points is number[][]
      const points3D = points as number[][];
      this._points3D = points3D.map(p => [...p]);
      this._points2D = points3D.map(p => ({ x: p[0], y: p[1] }));
    } else {
      // points is Point[]
      const points2D = points as Point[];
      this._points2D = points2D.map(p => ({ ...p }));
      this._points3D = points2D.map(p => [p.x, p.y, 0]);
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
    return this._points3D.map(p => [...p]);
  }

  /**
   * Get the number of points
   */
  get numPoints(): number {
    return this._points2D.length;
  }

  /**
   * Get the number of visible points (for Create animation)
   */
  get visiblePointCount(): number {
    return this._visiblePointCount ?? this._points2D.length;
  }

  /**
   * Set the number of visible points (for Create animation)
   */
  set visiblePointCount(count: number) {
    this._visiblePointCount = Math.max(0, Math.min(this._points2D.length, count));
    this._geometryDirty = true;
    this._markDirty();
  }

  /**
   * Get points that should be visible (for rendering) as 2D Points
   */
  getVisiblePoints(): Point[] {
    const count = this.visiblePointCount;
    return this._points2D.slice(0, count).map(p => ({ ...p }));
  }

  /**
   * Get points that should be visible (for rendering) as 3D arrays
   */
  getVisiblePoints3D(): number[][] {
    const count = this.visiblePointCount;
    return this._points3D.slice(0, count).map(p => [...p]);
  }

  /**
   * Add points to this VMobject using 2D Point objects
   */
  addPoints(...points: Point[]): this {
    this._points2D.push(...points.map(p => ({ ...p })));
    this._points3D.push(...points.map(p => [p.x, p.y, 0]));
    this._geometryDirty = true;
    this._markDirty();
    return this;
  }

  /**
   * Clear all points
   */
  clearPoints(): this {
    this._points2D = [];
    this._points3D = [];
    this._visiblePointCount = null;
    this._geometryDirty = true;
    this._markDirty();
    return this;
  }

  /**
   * Interpolate this VMobject towards a target VMobject
   * @param target - The target VMobject to interpolate towards
   * @param alpha - Progress from 0 (this) to 1 (target)
   * @returns this for chaining
   */
  interpolate(target: VMobject, alpha: number): this {
    // Ensure we have the same number of points
    if (this._points2D.length !== target._points2D.length) {
      this.alignPoints(target);
    }

    // Interpolate each 2D point
    for (let i = 0; i < this._points2D.length; i++) {
      this._points2D[i] = lerpPoint2D(this._points2D[i], target._points2D[i], alpha);
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
      this._style.strokeOpacity = lerp(this._style.strokeOpacity, target._style.strokeOpacity, alpha);
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
   * Align points between this VMobject and a target so they have the same count.
   * This is necessary for smooth morphing animations.
   * @param target - The target VMobject to align with
   */
  alignPoints(target: VMobject): void {
    const thisCount = this._points2D.length;
    const targetCount = target._points2D.length;

    if (thisCount === targetCount) return;

    const maxCount = Math.max(thisCount, targetCount);

    // Interpolate points to match counts
    if (thisCount < maxCount) {
      this._points2D = this._interpolatePointList2D(this._points2D, maxCount);
      this._points3D = this._interpolatePointList3D(this._points3D, maxCount);
    }
    if (targetCount < maxCount) {
      target._points2D = this._interpolatePointList2D(target._points2D, maxCount);
      target._points3D = this._interpolatePointList3D(target._points3D, maxCount);
    }
  }

  /**
   * Interpolate a 2D point list to have a specific number of points.
   */
  protected _interpolatePointList2D(points: Point[], targetCount: number): Point[] {
    if (points.length === 0) {
      return Array(targetCount).fill(null).map(() => ({ x: 0, y: 0 }));
    }

    if (points.length === targetCount) {
      return points.map(p => ({ ...p }));
    }

    if (points.length === 1) {
      return Array(targetCount).fill(null).map(() => ({ ...points[0] }));
    }

    const result: Point[] = [];
    const ratio = (points.length - 1) / (targetCount - 1);

    for (let i = 0; i < targetCount; i++) {
      const t = i * ratio;
      const index = Math.floor(t);
      const frac = t - index;

      if (index >= points.length - 1) {
        result.push({ ...points[points.length - 1] });
      } else {
        result.push(lerpPoint2D(points[index], points[index + 1], frac));
      }
    }

    return result;
  }

  /**
   * Interpolate a 3D point list to have a specific number of points.
   */
  protected _interpolatePointList3D(points: number[][], targetCount: number): number[][] {
    if (points.length === 0) {
      return Array(targetCount).fill(null).map(() => [0, 0, 0]);
    }

    if (points.length === targetCount) {
      return points.map(p => [...p]);
    }

    if (points.length === 1) {
      return Array(targetCount).fill(null).map(() => [...points[0]]);
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

  /**
   * Convert Bezier control points to a Three.js Shape for filled rendering.
   * @returns THREE.Shape representing the path
   */
  protected _pointsToShape(): THREE.Shape {
    const shape = new THREE.Shape();
    const points = this.getVisiblePoints();

    if (points.length === 0) {
      return shape;
    }

    // Move to first point
    shape.moveTo(points[0].x, points[0].y);

    // Process cubic Bezier segments
    // Points are: anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...
    // Each segment needs 4 points, subsequent segments share the anchor
    let i = 0;
    while (i + 3 < points.length) {
      const handle1 = points[i + 1];
      const handle2 = points[i + 2];
      const anchor2 = points[i + 3];

      shape.bezierCurveTo(
        handle1.x, handle1.y,
        handle2.x, handle2.y,
        anchor2.x, anchor2.y
      );

      // Move to next segment (skip by 3 to share anchor)
      i += 3;
    }

    // If we have remaining points that don't form a full Bezier, draw lines
    while (i < points.length) {
      shape.lineTo(points[i].x, points[i].y);
      i++;
    }

    return shape;
  }

  /**
   * Convert points to a THREE.CurvePath for stroke rendering
   */
  protected _pointsToCurvePath(): THREE.CurvePath<THREE.Vector3> {
    const path = new THREE.CurvePath<THREE.Vector3>();
    const points = this.getVisiblePoints3D();

    if (points.length < 2) {
      return path;
    }

    // Process cubic Bezier segments
    let i = 0;
    while (i + 3 < points.length) {
      const p0 = new THREE.Vector3(points[i][0], points[i][1], points[i][2]);
      const p1 = new THREE.Vector3(points[i + 1][0], points[i + 1][1], points[i + 1][2]);
      const p2 = new THREE.Vector3(points[i + 2][0], points[i + 2][1], points[i + 2][2]);
      const p3 = new THREE.Vector3(points[i + 3][0], points[i + 3][1], points[i + 3][2]);

      path.add(new THREE.CubicBezierCurve3(p0, p1, p2, p3));
      i += 3;
    }

    // Handle remaining points as lines
    while (i + 1 < points.length) {
      const p0 = new THREE.Vector3(points[i][0], points[i][1], points[i][2]);
      const p1 = new THREE.Vector3(points[i + 1][0], points[i + 1][1], points[i + 1][2]);
      path.add(new THREE.LineCurve3(p0, p1));
      i++;
    }

    return path;
  }

  /**
   * Create the Three.js backing object for this VMobject.
   * Creates both stroke (using Line2 for thick, smooth strokes) and fill meshes.
   */
  protected _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    // Create stroke material using LineMaterial for thick strokes
    this._strokeMaterial = new LineMaterial({
      color: new THREE.Color(this.color).getHex(),
      linewidth: this.strokeWidth,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      resolution: new THREE.Vector2(VMobject._rendererWidth, VMobject._rendererHeight),
      dashed: false,
    });

    // Create fill material
    this._fillMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.color),
      transparent: true,
      opacity: this._opacity * this.fillOpacity,
      side: THREE.DoubleSide
    });

    this._updateGeometry(group);

    return group;
  }

  /**
   * Update the geometry within the Three.js group.
   * Reuses existing Line2 / Mesh objects when possible to avoid expensive
   * dispose-and-recreate cycles during per-frame animation updates.
   */
  protected _updateGeometry(group: THREE.Group): void {
    const points3D = this.getVisiblePoints3D();
    if (points3D.length < 2) {
      // Clear everything
      this._disposeGroupChildren(group);
      this._cachedLine2 = null;
      this._cachedFillMesh = null;
      return;
    }

    // Convert Bezier points to sampled path for rendering
    const sampledPoints = this._sampleBezierPath(points3D, 16);

    // --- Stroke (Line2) ---
    // Note: always create geometry even at opacity 0 — visibility is controlled by the material.
    // Otherwise, if geometry is first built while opacity=0 (e.g. during Create animation begin()),
    // the Line2 is never created and _geometryDirty is consumed, so it never gets a chance to rebuild.
    if (this.strokeWidth > 0 && sampledPoints.length >= 2) {
      const positions: number[] = [];
      for (const pt of sampledPoints) {
        positions.push(pt[0], pt[1], pt[2]);
      }

      if (this._cachedLine2) {
        // Reuse existing Line2: just swap geometry
        this._cachedLine2.geometry.dispose();
        const geometry = new LineGeometry();
        geometry.setPositions(positions);
        this._cachedLine2.geometry = geometry;
        this._cachedLine2.computeLineDistances();
      } else {
        const geometry = new LineGeometry();
        geometry.setPositions(positions);
        const line = new Line2(geometry, this._strokeMaterial!);
        line.computeLineDistances();
        // Line2 bounding sphere computation is unreliable with parent transforms
        // (negative scale, rotation), so disable frustum culling to ensure visibility
        line.frustumCulled = false;
        group.add(line);
        this._cachedLine2 = line;
      }
    } else if (this._cachedLine2) {
      // No longer need stroke — remove it
      this._cachedLine2.geometry.dispose();
      group.remove(this._cachedLine2);
      this._cachedLine2 = null;
    }

    // --- Fill mesh ---
    if (this.fillOpacity > 0 && points3D.length >= 4) {
      const shape = this._pointsToShape();
      if (shape) {
        if (this._cachedFillMesh) {
          // Reuse existing mesh: swap geometry
          this._cachedFillMesh.geometry.dispose();
          this._cachedFillMesh.geometry = new THREE.ShapeGeometry(shape);
        } else {
          const fillGeometry = new THREE.ShapeGeometry(shape);
          const fillMesh = new THREE.Mesh(fillGeometry, this._fillMaterial!);
          fillMesh.position.z = -0.001; // Slightly behind stroke
          group.add(fillMesh);
          this._cachedFillMesh = fillMesh;
        }
      }
    } else if (this._cachedFillMesh) {
      this._cachedFillMesh.geometry.dispose();
      group.remove(this._cachedFillMesh);
      this._cachedFillMesh = null;
    }
  }

  /**
   * Dispose and remove all children from a Three.js group
   */
  private _disposeGroupChildren(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof Line2) {
        (child as THREE.Mesh | THREE.Line | Line2).geometry?.dispose();
      }
    }
  }

  /**
   * Sample Bezier curves for smooth rendering.
   * Uses adaptive sampling: nearly-linear segments (from prepareForNonlinearTransform)
   * use only their endpoints, avoiding expensive per-sample Bezier evaluation.
   *
   * @param points - Bezier control points
   * @param samplesPerSegment - Number of samples per curved Bezier segment
   * @returns Sampled points along the path
   */
  private _sampleBezierPath(points: number[][], samplesPerSegment: number = 4): number[][] {
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
      const samples = VMobject._isNearlyLinear(p0, p1, p2, p3) ? 1 : samplesPerSegment;

      for (let t = 0; t <= samples; t++) {
        const u = t / samples;
        const pt = this._evalCubicBezier(p0, p1, p2, p3, u);
        // Avoid duplicate points
        if (t === 0 || result.length === 0 ||
            Math.abs(pt[0] - result[result.length - 1][0]) > 0.0001 ||
            Math.abs(pt[1] - result[result.length - 1][1]) > 0.0001) {
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
   * Check if a cubic Bezier segment is nearly linear by measuring the maximum
   * distance from handles to the chord (p0 → p3).
   */
  private static _isNearlyLinear(p0: number[], p1: number[], p2: number[], p3: number[]): boolean {
    const dx = p3[0] - p0[0];
    const dy = p3[1] - p0[1];
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-10) return true; // degenerate segment

    const invLen = 1 / Math.sqrt(len2);
    // Perpendicular distance from p1 to chord
    const d1 = Math.abs((p1[0] - p0[0]) * (-dy) + (p1[1] - p0[1]) * dx) * invLen;
    // Perpendicular distance from p2 to chord
    const d2 = Math.abs((p2[0] - p0[0]) * (-dy) + (p2[1] - p0[1]) * dx) * invLen;

    return Math.max(d1, d2) < 0.01; // < 0.01 world-units off the chord
  }

  /**
   * Evaluate a cubic Bezier curve at parameter t
   */
  private _evalCubicBezier(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return [
      mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0],
      mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1],
      mt3 * p0[2] + 3 * mt2 * t * p1[2] + 3 * mt * t2 * p2[2] + t3 * p3[2],
    ];
  }

  /**
   * Sync material properties to Three.js
   */
  protected override _syncMaterialToThree(): void {
    if (this._strokeMaterial) {
      this._strokeMaterial.color.set(this.color);
      this._strokeMaterial.opacity = this._opacity;
      this._strokeMaterial.transparent = this._opacity < 1;
      this._strokeMaterial.linewidth = this.strokeWidth;
      // Update resolution for proper line width rendering
      this._strokeMaterial.resolution.set(VMobject._rendererWidth, VMobject._rendererHeight);
    }

    if (this._fillMaterial) {
      this._fillMaterial.color.set(this.color);
      this._fillMaterial.opacity = this._opacity * this.fillOpacity;
    }

    // Only rebuild geometry if points actually changed
    if (this._geometryDirty && this._threeObject instanceof THREE.Group) {
      this._updateGeometry(this._threeObject);
      this._geometryDirty = false;
    }
  }

  /**
   * Create a copy of this VMobject
   */
  protected override _createCopy(): VMobject {
    const vmobject = new VMobject();
    vmobject._points2D = this._points2D.map(p => ({ ...p }));
    vmobject._points3D = this._points3D.map(p => [...p]);
    vmobject._visiblePointCount = this._visiblePointCount;
    return vmobject;
  }

  /**
   * Override copy to also copy VMobject-specific properties
   */
  override copy(): VMobject {
    const clone = super.copy() as VMobject;
    return clone;
  }

  /**
   * Get the center of this VMobject based on its points
   */
  override getCenter(): Vector3Tuple {
    if (this._points2D.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

    // Calculate centroid of all points
    let sumX = 0, sumY = 0;
    for (const point of this._points2D) {
      sumX += point.x;
      sumY += point.y;
    }
    const count = this._points2D.length;

    return [
      this.position.x + sumX / count,
      this.position.y + sumY / count,
      this.position.z
    ];
  }

  /**
   * Clean up Three.js resources
   */
  override dispose(): void {
    this._strokeMaterial?.dispose();
    this._fillMaterial?.dispose();
    this._cachedLine2 = null;
    this._cachedFillMesh = null;
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
  const points = vmobject.getPoints();
  if (points.length < 4) return 0;
  // Each curve uses 4 points, subsequent curves share anchor (step by 3)
  return Math.floor((points.length - 1) / 3);
}

/**
 * Get the nth curve segment from a VMobject as a new VMobject.
 * @param vmobject - The source VMobject
 * @param n - Index of the curve segment (0-based)
 * @returns A new VMobject containing just that curve segment
 */
export function getNthCurve(vmobject: VMobject, n: number): VMobject {
  const points = vmobject.getPoints();
  const numCurves = getNumCurves(vmobject);

  if (n < 0 || n >= numCurves) {
    throw new Error(`Curve index ${n} out of range. VMobject has ${numCurves} curves.`);
  }

  // Extract the 4 points for this curve segment
  const startIndex = n * 3;
  const curvePoints = points.slice(startIndex, startIndex + 4);

  // Create a new VMobject with these points
  const curve = new VMobject();
  curve.setPoints(curvePoints);

  // Copy style properties from source
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
  const numCurves = getNumCurves(vmobject);

  // Create a parent VMobject to hold the curve submobjects
  const parent = new VMobject();

  // Copy transform properties from source
  parent.position.copy(vmobject.position);
  parent.rotation.copy(vmobject.rotation);
  parent.scaleVector.copy(vmobject.scaleVector);

  // Clear parent's own points (it only contains children)
  parent.clearPoints();
  parent.setFillOpacity(0);

  // Extract each curve as a child VMobject
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
    const numCurves = getNumCurves(vmobject);
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

export default VMobject;
