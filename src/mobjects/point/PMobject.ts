/**
 * Point-based mobjects rendered as particles using THREE.js Points.
 * Unlike VMobjects which render connected paths, PMobjects render
 * discrete points as particles for efficient visualization.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';
import { computePointBounds } from '../../core/PointBounds';

let circleTexture: THREE.CanvasTexture | null = null;

function getCircleTexture(): THREE.CanvasTexture {
  if (circleTexture) return circleTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  circleTexture = new THREE.CanvasTexture(canvas);
  return circleTexture;
}

/**
 * A single point with position, color, and opacity.
 */
export interface PointData {
  /** Position [x, y, z] */
  position: Vector3Tuple;
  /** Color as CSS color string */
  color?: string;
  /** Opacity from 0 to 1 */
  opacity?: number;
}

/**
 * Options for creating a PMobject
 */
export interface PMobjectOptions {
  /** Initial points to add */
  points?: PointData[];
  /** Default color for points. Default: white (#FFFFFF) */
  color?: string;
  /** Default opacity for points. Default: 1 */
  opacity?: number;
  /** Size of each point in pixels. Default: 10 */
  pointSize?: number;
  /** Render points as circles instead of squares. Default: true */
  roundPoints?: boolean;
}

/**
 * PMobject - Point-based mobject (not vector-based like VMobject)
 *
 * A collection of points rendered as particles using THREE.js Points
 * and PointsMaterial. Each point has position, color, and opacity.
 * Points are not connected like VMobject paths.
 *
 * @example
 * ```typescript
 * // Create a PMobject with some points
 * const points = new PMobject({
 *   points: [
 *     { position: [0, 0, 0] },
 *     { position: [1, 0, 0], color: '#ff0000' },
 *     { position: [0, 1, 0], color: '#00ff00', opacity: 0.5 },
 *   ],
 *   pointSize: 15,
 * });
 * ```
 */
export class PMobject extends Mobject {
  /** Internal point data storage */
  protected _points: PointData[] = [];

  /** Point size in pixels */
  protected _pointSize: number = 10;

  /** Whether to render points as circles */
  protected _roundPoints: boolean = true;

  /** THREE.js geometry for points */
  protected _geometry: THREE.BufferGeometry | null = null;

  /** THREE.js material for points */
  protected _material: THREE.PointsMaterial | null = null;

  constructor(options: PMobjectOptions = {}) {
    super();

    const { points = [], color = WHITE, opacity = 1, pointSize = 10, roundPoints = true } = options;

    this.color = color;
    this._opacity = opacity;
    this._pointSize = pointSize;
    this._roundPoints = roundPoints;

    // Add initial points
    for (const point of points) {
      this.addPoint(point);
    }
  }

  /**
   * Add a single point to the mobject
   * @param point - Point data with position and optional color/opacity
   * @returns this for chaining
   */
  addPoint(point: PointData): this {
    this._points.push({
      position: [...point.position],
      color: point.color ?? this.color,
      opacity: point.opacity ?? this._opacity,
    });
    this._markDirty();
    return this;
  }

  /**
   * Add multiple points to the mobject
   * @param points - Array of point data
   * @returns this for chaining
   */
  addPoints(points: PointData[]): this {
    for (const point of points) {
      this.addPoint(point);
    }
    return this;
  }

  /**
   * Remove a point by index
   * @param index - Index of point to remove
   * @returns this for chaining
   */
  removePoint(index: number): this {
    if (index >= 0 && index < this._points.length) {
      this._points.splice(index, 1);
      this._markDirty();
    }
    return this;
  }

  /**
   * Clear all points
   * @returns this for chaining
   */
  clearPoints(): this {
    this._points = [];
    this._markDirty();
    return this;
  }

  /**
   * Get all points in world coordinates as number[][] (consistent with VMobject).
   *
   * Applies this mobject's own transform **and** every ancestor transform in the
   * parent chain (Group/PGroup/etc.). The render-only z-layering offset added
   * by `_syncToThree` is intentionally excluded.
   *
   * For untransformed local-space coordinates, use {@link getLocalPoints}.
   * For world points with color/opacity, use {@link getPointsData}.
   */
  getPoints(): number[][] {
    const worldMatrix = this._worldMatrix();
    const scratch = new THREE.Vector3();
    return this._points.map((p) => {
      scratch.set(p.position[0], p.position[1], p.position[2]).applyMatrix4(worldMatrix);
      return [scratch.x, scratch.y, scratch.z];
    });
  }

  /**
   * Get all points in world coordinates as PointData[] (with color and opacity).
   *
   * For untransformed local-space coordinates, use {@link getLocalPoints}.
   */
  getPointsData(): PointData[] {
    const worldMatrix = this._worldMatrix();
    const scratch = new THREE.Vector3();
    return this._points.map((p) => {
      scratch.set(p.position[0], p.position[1], p.position[2]).applyMatrix4(worldMatrix);
      return {
        position: [scratch.x, scratch.y, scratch.z] as Vector3Tuple,
        color: p.color,
        opacity: p.opacity,
      };
    });
  }

  /**
   * @pre  fn(pts).length === pts.length
   * @post getPoints()[i] === fn(old.getPoints().map(p => p - aboutPoint))[i] + aboutPoint
   */
  protected override _applyFunctionAboutPoint(
    fn: (pts: number[][]) => number[][],
    aboutPoint: number[],
  ): void {
    const pts = this.getPoints();
    if (pts.length === 0) return;
    const shifted = pts.map((p) => [
      p[0] - aboutPoint[0],
      p[1] - aboutPoint[1],
      p[2] - aboutPoint[2],
    ]);
    const worldResult = fn(shifted).map((p) => [
      p[0] + aboutPoint[0],
      p[1] + aboutPoint[1],
      p[2] + aboutPoint[2],
    ]);
    const inverseWorld = this._worldMatrix().clone().invert();
    const scratch = new THREE.Vector3();
    worldResult.forEach((p, i) => {
      scratch.set(p[0], p[1], p[2]).applyMatrix4(inverseWorld);
      this._points[i].position = [scratch.x, scratch.y, scratch.z];
    });
    this._markDirty();
  }

  /**
   * Get all points in local coordinates.
   * @returns Copy of the local points array
   */
  getLocalPoints(): PointData[] {
    return this._points.map((p) => ({
      position: [...p.position] as Vector3Tuple,
      color: p.color,
      opacity: p.opacity,
    }));
  }

  /**
   * Get the number of points
   */
  get numPoints(): number {
    return this._points.length;
  }

  /**
   * Set the point size
   * @param size - Size in pixels
   * @returns this for chaining
   */
  setPointSize(size: number): this {
    this._pointSize = Math.max(1, size);
    this._markDirty();
    return this;
  }

  /**
   * Get the point size
   */
  getPointSize(): number {
    return this._pointSize;
  }

  /**
   * Set the color of all points
   * @param color - CSS color string
   * @returns this for chaining
   */
  override setColor(color: string): this {
    super.setColor(color);
    for (const point of this._points) {
      point.color = color;
    }
    return this;
  }

  /**
   * Set the opacity of all points
   * @param opacity - Opacity value (0-1)
   * @returns this for chaining
   */
  override setStrokeOpacity(opacity: number): this {
    super.setStrokeOpacity(opacity);
    for (const point of this._points) {
      point.opacity = opacity;
    }
    return this;
  }

  /**
   * Get world-space center from world-point bounds.
   */
  override getCenter(): Vector3Tuple {
    const worldPoints = this.getPoints();
    const bounds = computePointBounds(worldPoints);
    if (!bounds) {
      return this._localToWorld([0, 0, 0]);
    }
    return [
      (bounds.min.x + bounds.max.x) / 2,
      (bounds.min.y + bounds.max.y) / 2,
      (bounds.min.z + bounds.max.z) / 2,
    ];
  }

  /**
   * Get center in parent coordinates by averaging points after this node's own transform.
   */
  override getLocalCenter(): Vector3Tuple {
    if (this._points.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

    const localMatrix = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(this.rotation);
    localMatrix.compose(this.position, q, this.scaleVector);

    const scratch = new THREE.Vector3();
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    for (const point of this._points) {
      scratch
        .set(point.position[0], point.position[1], point.position[2])
        .applyMatrix4(localMatrix);
      sumX += scratch.x;
      sumY += scratch.y;
      sumZ += scratch.z;
    }

    const count = this._points.length;
    return [sumX / count, sumY / count, sumZ / count];
  }

  /**
   * Get center of mass in world coordinates by averaging all world-space points.
   *
   * Unlike {@link getCenter} (which uses bbox midpoint), this is the true
   * centroid — equal to getCenter() only when points are symmetrically distributed.
   */
  getCenterOfMass(): Vector3Tuple {
    const pts = this.getPoints();
    if (pts.length === 0) {
      throw new Error('getCenterOfMass: PMobject has 0 points');
    }
    let sx = 0,
      sy = 0,
      sz = 0;
    for (const p of pts) {
      sx += p[0];
      sy += p[1];
      sz += p[2];
    }
    const n = pts.length;
    return [sx / n, sy / n, sz / n];
  }

  moveCenterOfMassTo(target: Vector3Tuple): this {
    this.shift([
      target[0] - this.getCenterOfMass()[0],
      target[1] - this.getCenterOfMass()[1],
      target[2] - this.getCenterOfMass()[2],
    ]);
    return this;
  }

  /**
   * Flatten into absolute coordinates: bake `worldMatrix` into every point, then
   * reset the local transform to identity and recurse into children.
   *
   * @post old.getPoints()[i] === this.getPoints()[i]  // world geometry preserved
   * @post this._computeOwnMatrix() === Identity
   */
  override normalizeTransform(worldMatrix: THREE.Matrix4 = this._ownMatrix()): this {
    if (this._points.length > 0) {
      const v = new THREE.Vector3();
      for (const point of this._points) {
        v.set(point.position[0], point.position[1], point.position[2]).applyMatrix4(worldMatrix);
        point.position[0] = v.x;
        point.position[1] = v.y;
        point.position[2] = v.z;
      }
    }
    return this._flattenAsContainer(worldMatrix);
  }

  /**
   * Create the Three.js backing object
   */
  protected override _createThreeObject(): THREE.Object3D {
    this._updateGeometry();
    this._updateMaterial();

    const points = new THREE.Points(this._geometry!, this._material!);
    return points;
  }

  /**
   * Update or create the geometry from points
   */
  protected _updateGeometry(): void {
    const positions: number[] = [];
    const colors: number[] = [];

    const tempColor = new THREE.Color();

    for (const point of this._points) {
      positions.push(point.position[0], point.position[1], point.position[2]);

      // Parse color
      tempColor.set(point.color ?? this.color);
      colors.push(tempColor.r, tempColor.g, tempColor.b);
    }

    if (!this._geometry) {
      this._geometry = new THREE.BufferGeometry();
    }

    this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this._geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  /**
   * Update or create the material
   */
  protected _updateMaterial(): void {
    if (!this._material) {
      this._material = new THREE.PointsMaterial({
        size: this._pointSize,
        vertexColors: true,
        transparent: true,
        opacity: this._opacity,
        sizeAttenuation: false,
        ...(this._roundPoints && { map: getCircleTexture(), alphaTest: 0.5 }),
      });
    } else {
      this._material.size = this._pointSize;
      this._material.opacity = this._opacity;
      this._material.needsUpdate = true;
    }
  }

  /**
   * Sync material properties to Three.js
   */
  protected override _syncMaterialToThree(): void {
    this._updateGeometry();
    this._updateMaterial();

    if (this._threeObject instanceof THREE.Points) {
      this._threeObject.geometry = this._geometry!;
      this._threeObject.material = this._material!;
    }
  }

  override copy(): PMobject {
    const copy = new PMobject({
      points: this.getLocalPoints(),
      color: this.color,
      opacity: this._opacity,
      pointSize: this._pointSize,
      roundPoints: this._roundPoints,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }

  /**
   * Clean up Three.js resources
   */
  override dispose(): void {
    super.dispose();
    this._geometry?.dispose();
    this._material?.dispose();
  }
}
