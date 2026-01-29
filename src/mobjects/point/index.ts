/**
 * Point-based mobjects rendered as particles using THREE.js Points.
 * Unlike VMobjects which render connected paths, PMobjects render
 * discrete points as particles for efficient visualization.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple, RIGHT } from '../../core/Mobject';
import { WHITE } from '../../constants';

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

  /** THREE.js geometry for points */
  protected _geometry: THREE.BufferGeometry | null = null;

  /** THREE.js material for points */
  protected _material: THREE.PointsMaterial | null = null;

  constructor(options: PMobjectOptions = {}) {
    super();

    const {
      points = [],
      color = WHITE,
      opacity = 1,
      pointSize = 10,
    } = options;

    this.color = color;
    this._opacity = opacity;
    this._pointSize = pointSize;

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
   * Get all points
   * @returns Copy of the points array
   */
  getPoints(): PointData[] {
    return this._points.map(p => ({
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
  override setOpacity(opacity: number): this {
    super.setOpacity(opacity);
    for (const point of this._points) {
      point.opacity = opacity;
    }
    return this;
  }

  /**
   * Get the center of all points
   * @returns Center position as [x, y, z]
   */
  override getCenter(): Vector3Tuple {
    if (this._points.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

    let sumX = 0, sumY = 0, sumZ = 0;
    for (const point of this._points) {
      sumX += point.position[0];
      sumY += point.position[1];
      sumZ += point.position[2];
    }

    const count = this._points.length;
    return [
      this.position.x + sumX / count,
      this.position.y + sumY / count,
      this.position.z + sumZ / count
    ];
  }

  /**
   * Shift all points by a delta
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    super.shift(delta);
    for (const point of this._points) {
      point.position[0] += delta[0];
      point.position[1] += delta[1];
      point.position[2] += delta[2];
    }
    return this;
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

    this._geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    this._geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
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
        sizeAttenuation: false, // Points stay same size regardless of distance
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

  /**
   * Create a copy of this PMobject
   */
  protected override _createCopy(): PMobject {
    return new PMobject({
      points: this.getPoints(),
      color: this.color,
      opacity: this._opacity,
      pointSize: this._pointSize,
    });
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

/**
 * Options for creating a PGroup
 */
export interface PGroupOptions {
  /** Initial PMobjects to add */
  pmobjects?: PMobject[];
}

/**
 * PGroup - Group of PMobjects
 *
 * Similar to Group but specifically for PMobjects. Operations
 * applied to the group cascade to all children.
 *
 * @example
 * ```typescript
 * const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
 * const p2 = new PMobject({ points: [{ position: [1, 1, 0] }] });
 * const group = new PGroup({ pmobjects: [p1, p2] });
 *
 * // Move all PMobjects
 * group.shift([1, 0, 0]);
 * ```
 */
export class PGroup extends Mobject {
  constructor(options: PGroupOptions = {}) {
    super();

    const { pmobjects = [] } = options;

    for (const pmobject of pmobjects) {
      this.add(pmobject);
    }
  }

  /**
   * Add a PMobject to this group
   * @param pmobject - PMobject to add
   * @returns this for chaining
   */
  addPMobject(pmobject: PMobject): this {
    return this.add(pmobject);
  }

  /**
   * Add multiple PMobjects to this group
   * @param pmobjects - PMobjects to add
   * @returns this for chaining
   */
  addPMobjects(...pmobjects: PMobject[]): this {
    for (const pmobject of pmobjects) {
      this.add(pmobject);
    }
    return this;
  }

  /**
   * Remove a PMobject from this group
   * @param pmobject - PMobject to remove
   * @returns this for chaining
   */
  removePMobject(pmobject: PMobject): this {
    return this.remove(pmobject);
  }

  /**
   * Get the center of the group
   * @returns Center position as [x, y, z]
   */
  override getCenter(): Vector3Tuple {
    if (this.children.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

    let sumX = 0, sumY = 0, sumZ = 0;
    for (const child of this.children) {
      const center = child.getCenter();
      sumX += center[0];
      sumY += center[1];
      sumZ += center[2];
    }

    const count = this.children.length;
    return [
      this.position.x + sumX / count,
      this.position.y + sumY / count,
      this.position.z + sumZ / count
    ];
  }

  /**
   * Shift all children by the given delta
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    super.shift(delta);
    for (const child of this.children) {
      child.shift(delta);
    }
    return this;
  }

  /**
   * Move the group center to the given point
   * @param point - Target position [x, y, z]
   * @returns this for chaining
   */
  override moveTo(point: Vector3Tuple): this {
    const currentCenter = this.getCenter();
    const delta: Vector3Tuple = [
      point[0] - currentCenter[0],
      point[1] - currentCenter[1],
      point[2] - currentCenter[2]
    ];
    return this.shift(delta);
  }

  /**
   * Set the color of all children
   * @param color - CSS color string
   * @returns this for chaining
   */
  override setColor(color: string): this {
    super.setColor(color);
    for (const child of this.children) {
      child.setColor(color);
    }
    return this;
  }

  /**
   * Set the opacity of all children
   * @param opacity - Opacity value (0-1)
   * @returns this for chaining
   */
  override setOpacity(opacity: number): this {
    super.setOpacity(opacity);
    for (const child of this.children) {
      child.setOpacity(opacity);
    }
    return this;
  }

  /**
   * Set the point size of all PMobject children
   * @param size - Size in pixels
   * @returns this for chaining
   */
  setPointSize(size: number): this {
    for (const child of this.children) {
      if (child instanceof PMobject) {
        child.setPointSize(size);
      }
    }
    return this;
  }

  /**
   * Arrange children in a row or column
   * @param direction - Direction to arrange
   * @param buff - Buffer between children
   * @returns this for chaining
   */
  arrange(direction: Vector3Tuple = RIGHT, buff: number = 0.25): this {
    if (this.children.length === 0) return this;

    const originalCenter = this.getCenter();

    let prevChild = this.children[0];
    for (let i = 1; i < this.children.length; i++) {
      const child = this.children[i];
      child.nextTo(prevChild, direction, buff);
      prevChild = child;
    }

    this.moveTo(originalCenter);
    this._markDirty();
    return this;
  }

  /**
   * Create the Three.js backing object
   */
  protected override _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    for (const child of this.children) {
      group.add(child.getThreeObject());
    }

    return group;
  }

  /**
   * Create a copy of this PGroup
   */
  protected override _createCopy(): PGroup {
    return new PGroup();
  }

  /**
   * Get the number of PMobjects in this group
   */
  get length(): number {
    return this.children.length;
  }

  /**
   * Get a PMobject by index
   * @param index - Index of the PMobject
   */
  get(index: number): PMobject | undefined {
    return this.children[index] as PMobject | undefined;
  }

  /**
   * Iterate over all PMobjects in the group
   */
  [Symbol.iterator](): Iterator<PMobject> {
    return (this.children as PMobject[])[Symbol.iterator]();
  }
}

/**
 * Options for creating a PointMobject
 */
export interface PointMobjectOptions {
  /** Position [x, y, z]. Default: [0, 0, 0] */
  position?: Vector3Tuple;
  /** Color as CSS color string. Default: white (#FFFFFF) */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Size in pixels. Default: 8 */
  size?: number;
}

/**
 * PointMobject - Single point mobject
 *
 * Renders as a single dot/particle. Lightweight, no stroke.
 * Uses THREE.js Points for efficient rendering.
 *
 * @example
 * ```typescript
 * // Create a point at the origin
 * const point = new PointMobject();
 *
 * // Create a red point at a specific position
 * const redPoint = new PointMobject({
 *   position: [1, 2, 0],
 *   color: '#ff0000',
 *   size: 12,
 * });
 * ```
 */
export class PointMobject extends PMobject {
  constructor(options: PointMobjectOptions = {}) {
    const {
      position = [0, 0, 0],
      color = WHITE,
      opacity = 1,
      size = 8,
    } = options;

    super({
      points: [{ position, color, opacity }],
      color,
      opacity,
      pointSize: size,
    });
  }

  /**
   * Get the position of the point
   * @returns Position as [x, y, z]
   */
  getPosition(): Vector3Tuple {
    if (this._points.length > 0) {
      return [...this._points[0].position] as Vector3Tuple;
    }
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Set the position of the point
   * @param position - New position [x, y, z]
   * @returns this for chaining
   */
  setPosition(position: Vector3Tuple): this {
    if (this._points.length > 0) {
      this._points[0].position = [...position];
      this._markDirty();
    }
    return this;
  }

  /**
   * Get the center (same as position for a single point)
   */
  override getCenter(): Vector3Tuple {
    return this.getPosition();
  }

  /**
   * Move the point to a new position
   * @param point - Target position [x, y, z]
   */
  override moveTo(point: Vector3Tuple): this {
    return this.setPosition(point);
  }

  /**
   * Create a copy of this PointMobject
   */
  protected override _createCopy(): PointMobject {
    return new PointMobject({
      position: this.getPosition(),
      color: this.color,
      opacity: this._opacity,
      size: this._pointSize,
    });
  }
}

/**
 * Options for creating a PointCloudDot
 */
export interface PointCloudDotOptions {
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Radius of the dot. Default: 0.08 */
  radius?: number;
  /** Number of particles. Default: 50 */
  numParticles?: number;
  /** Color as CSS color string. Default: white (#FFFFFF) */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Size of each particle in pixels. Default: 4 */
  particleSize?: number;
  /** Spread pattern: 'uniform' for even distribution, 'gaussian' for center-heavy. Default: 'gaussian' */
  distribution?: 'uniform' | 'gaussian';
}

/**
 * PointCloudDot - Dot rendered as multiple particles
 *
 * Creates a "fuzzy" dot effect by rendering multiple particles
 * within a radius. The particles create a soft, glowing appearance.
 *
 * @example
 * ```typescript
 * // Create a fuzzy dot at the origin
 * const dot = new PointCloudDot();
 *
 * // Create a large, dense fuzzy dot
 * const bigDot = new PointCloudDot({
 *   center: [1, 0, 0],
 *   radius: 0.2,
 *   numParticles: 100,
 *   color: '#ff6600',
 *   distribution: 'gaussian',
 * });
 * ```
 */
export class PointCloudDot extends PMobject {
  protected _center: Vector3Tuple;
  protected _radius: number;
  protected _numParticles: number;
  protected _distribution: 'uniform' | 'gaussian';

  constructor(options: PointCloudDotOptions = {}) {
    const {
      center = [0, 0, 0],
      radius = 0.08,
      numParticles = 50,
      color = WHITE,
      opacity = 1,
      particleSize = 4,
      distribution = 'gaussian',
    } = options;

    super({
      color,
      opacity,
      pointSize: particleSize,
    });

    this._center = [...center];
    this._radius = radius;
    this._numParticles = numParticles;
    this._distribution = distribution;

    this._generateParticles();
  }

  /**
   * Generate particles within the radius
   */
  protected _generateParticles(): void {
    this.clearPoints();

    for (let i = 0; i < this._numParticles; i++) {
      let x: number, y: number, z: number;

      if (this._distribution === 'gaussian') {
        // Gaussian distribution - more particles near center
        const r = this._radius * Math.sqrt(-2 * Math.log(Math.random())) * 0.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        x = this._center[0] + r * Math.sin(phi) * Math.cos(theta);
        y = this._center[1] + r * Math.sin(phi) * Math.sin(theta);
        z = this._center[2] + r * Math.cos(phi);
      } else {
        // Uniform distribution within sphere
        const r = this._radius * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        x = this._center[0] + r * Math.sin(phi) * Math.cos(theta);
        y = this._center[1] + r * Math.sin(phi) * Math.sin(theta);
        z = this._center[2] + r * Math.cos(phi);
      }

      // Opacity varies based on distance from center for softer edges
      const distFromCenter = Math.sqrt(
        (x - this._center[0]) ** 2 +
        (y - this._center[1]) ** 2 +
        (z - this._center[2]) ** 2
      );
      const normalizedDist = distFromCenter / this._radius;
      const pointOpacity = this._opacity * (1 - normalizedDist * 0.5);

      this._points.push({
        position: [x, y, z],
        color: this.color,
        opacity: Math.max(0, pointOpacity),
      });
    }

    this._markDirty();
  }

  /**
   * Get the center of the dot
   */
  override getCenter(): Vector3Tuple {
    return [...this._center];
  }

  /**
   * Move the dot to a new position
   * @param point - Target position [x, y, z]
   */
  override moveTo(point: Vector3Tuple): this {
    const delta: Vector3Tuple = [
      point[0] - this._center[0],
      point[1] - this._center[1],
      point[2] - this._center[2]
    ];
    this._center = [...point];
    return this.shift(delta);
  }

  /**
   * Get the radius of the dot
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Set the radius and regenerate particles
   * @param radius - New radius
   * @returns this for chaining
   */
  setRadius(radius: number): this {
    this._radius = Math.max(0, radius);
    this._generateParticles();
    return this;
  }

  /**
   * Get the number of particles
   */
  getNumParticles(): number {
    return this._numParticles;
  }

  /**
   * Set the number of particles and regenerate
   * @param count - New particle count
   * @returns this for chaining
   */
  setNumParticles(count: number): this {
    this._numParticles = Math.max(1, Math.round(count));
    this._generateParticles();
    return this;
  }

  /**
   * Set the distribution pattern and regenerate
   * @param distribution - 'uniform' or 'gaussian'
   * @returns this for chaining
   */
  setDistribution(distribution: 'uniform' | 'gaussian'): this {
    this._distribution = distribution;
    this._generateParticles();
    return this;
  }

  /**
   * Regenerate the particles (useful after changing properties)
   * @returns this for chaining
   */
  regenerate(): this {
    this._generateParticles();
    return this;
  }

  /**
   * Create a copy of this PointCloudDot
   */
  protected override _createCopy(): PointCloudDot {
    return new PointCloudDot({
      center: this._center,
      radius: this._radius,
      numParticles: this._numParticles,
      color: this.color,
      opacity: this._opacity,
      particleSize: this._pointSize,
      distribution: this._distribution,
    });
  }
}

/**
 * Options for creating a Mobject1D
 */
export interface Mobject1DOptions {
  /** Start point [x, y, z]. Default: [-1, 0, 0] */
  start?: Vector3Tuple;
  /** End point [x, y, z]. Default: [1, 0, 0] */
  end?: Vector3Tuple;
  /** Number of points along the line. Default: 20 */
  numPoints?: number;
  /** Alternative to numPoints: density (points per unit length). Overrides numPoints if provided. */
  density?: number;
  /** Color as CSS color string. Default: white (#FFFFFF) */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Size of each point in pixels. Default: 6 */
  pointSize?: number;
}

/**
 * Mobject1D - 1D point distribution along a line
 *
 * Points are distributed along a line segment between start and end.
 * You can specify either a fixed number of points or a density
 * (points per unit length).
 *
 * @example
 * ```typescript
 * // Create a line of 10 points from origin to (2, 0, 0)
 * const line = new Mobject1D({
 *   start: [0, 0, 0],
 *   end: [2, 0, 0],
 *   numPoints: 10,
 * });
 *
 * // Create a line with density of 5 points per unit
 * const denseLine = new Mobject1D({
 *   start: [-1, -1, 0],
 *   end: [1, 1, 0],
 *   density: 5,
 *   color: '#00ff00',
 * });
 * ```
 */
export class Mobject1D extends PMobject {
  protected _start: Vector3Tuple;
  protected _end: Vector3Tuple;
  protected _numPointsConfig: number;
  protected _density?: number;

  constructor(options: Mobject1DOptions = {}) {
    const {
      start = [-1, 0, 0],
      end = [1, 0, 0],
      numPoints = 20,
      density,
      color = WHITE,
      opacity = 1,
      pointSize = 6,
    } = options;

    super({
      color,
      opacity,
      pointSize,
    });

    this._start = [...start];
    this._end = [...end];
    this._numPointsConfig = numPoints;
    this._density = density;

    this._generatePoints();
  }

  /**
   * Calculate the length of the line segment
   */
  getLength(): number {
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get the actual number of points based on config or density
   */
  protected _getActualNumPoints(): number {
    if (this._density !== undefined) {
      const length = this.getLength();
      return Math.max(2, Math.round(length * this._density));
    }
    return this._numPointsConfig;
  }

  /**
   * Generate points along the line
   */
  protected _generatePoints(): void {
    this.clearPoints();

    const actualNumPoints = this._getActualNumPoints();
    if (actualNumPoints < 1) return;

    for (let i = 0; i < actualNumPoints; i++) {
      const t = actualNumPoints === 1 ? 0.5 : i / (actualNumPoints - 1);

      const x = this._start[0] + t * (this._end[0] - this._start[0]);
      const y = this._start[1] + t * (this._end[1] - this._start[1]);
      const z = this._start[2] + t * (this._end[2] - this._start[2]);

      this._points.push({
        position: [x, y, z],
        color: this.color,
        opacity: this._opacity,
      });
    }

    this._markDirty();
  }

  /**
   * Get the start point
   */
  getStart(): Vector3Tuple {
    return [...this._start];
  }

  /**
   * Get the end point
   */
  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  /**
   * Set the start point and regenerate
   * @param start - New start point [x, y, z]
   * @returns this for chaining
   */
  setStart(start: Vector3Tuple): this {
    this._start = [...start];
    this._generatePoints();
    return this;
  }

  /**
   * Set the end point and regenerate
   * @param end - New end point [x, y, z]
   * @returns this for chaining
   */
  setEnd(end: Vector3Tuple): this {
    this._end = [...end];
    this._generatePoints();
    return this;
  }

  /**
   * Set both endpoints and regenerate
   * @param start - New start point [x, y, z]
   * @param end - New end point [x, y, z]
   * @returns this for chaining
   */
  setEndpoints(start: Vector3Tuple, end: Vector3Tuple): this {
    this._start = [...start];
    this._end = [...end];
    this._generatePoints();
    return this;
  }

  /**
   * Set the number of points and regenerate (clears density)
   * @param count - Number of points
   * @returns this for chaining
   */
  setNumPoints(count: number): this {
    this._numPointsConfig = Math.max(1, Math.round(count));
    this._density = undefined;
    this._generatePoints();
    return this;
  }

  /**
   * Set the density and regenerate (overrides numPoints)
   * @param density - Points per unit length
   * @returns this for chaining
   */
  setDensity(density: number): this {
    this._density = Math.max(0.1, density);
    this._generatePoints();
    return this;
  }

  /**
   * Get the center of the line segment
   */
  override getCenter(): Vector3Tuple {
    return [
      (this._start[0] + this._end[0]) / 2,
      (this._start[1] + this._end[1]) / 2,
      (this._start[2] + this._end[2]) / 2,
    ];
  }

  /**
   * Move the line to center at a new position
   * @param point - Target center position [x, y, z]
   */
  override moveTo(point: Vector3Tuple): this {
    const currentCenter = this.getCenter();
    const delta: Vector3Tuple = [
      point[0] - currentCenter[0],
      point[1] - currentCenter[1],
      point[2] - currentCenter[2]
    ];

    this._start[0] += delta[0];
    this._start[1] += delta[1];
    this._start[2] += delta[2];
    this._end[0] += delta[0];
    this._end[1] += delta[1];
    this._end[2] += delta[2];

    return this.shift(delta);
  }

  /**
   * Shift the line by a delta
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    // Update internal endpoints (but don't double-shift since super.shift updates _points)
    // Actually we need to regenerate since _generatePoints uses _start/_end
    this._start[0] += delta[0];
    this._start[1] += delta[1];
    this._start[2] += delta[2];
    this._end[0] += delta[0];
    this._end[1] += delta[1];
    this._end[2] += delta[2];

    // Shift the actual points
    for (const point of this._points) {
      point.position[0] += delta[0];
      point.position[1] += delta[1];
      point.position[2] += delta[2];
    }

    this.position.x += delta[0];
    this.position.y += delta[1];
    this.position.z += delta[2];
    this._markDirty();

    return this;
  }

  /**
   * Regenerate the points
   * @returns this for chaining
   */
  regenerate(): this {
    this._generatePoints();
    return this;
  }

  /**
   * Create a copy of this Mobject1D
   */
  protected override _createCopy(): Mobject1D {
    const copy = new Mobject1D({
      start: this._start,
      end: this._end,
      numPoints: this._numPointsConfig,
      density: this._density,
      color: this.color,
      opacity: this._opacity,
      pointSize: this._pointSize,
    });
    return copy;
  }
}

/**
 * Distribution type for Mobject2D
 */
export type Distribution2D = 'grid' | 'random';

/**
 * Options for creating a Mobject2D
 */
export interface Mobject2DOptions {
  /** Center of the region [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Width of the region (along x-axis). Default: 2 */
  width?: number;
  /** Height of the region (along y-axis). Default: 2 */
  height?: number;
  /** Number of points along width for grid, or total points for random. Default: 10 */
  numPointsX?: number;
  /** Number of points along height for grid. Default: 10 */
  numPointsY?: number;
  /** Alternative to numPoints: density (points per unit area for random, per unit length for grid). */
  density?: number;
  /** Distribution pattern: 'grid' or 'random'. Default: 'grid' */
  distribution?: Distribution2D;
  /** Color as CSS color string. Default: white (#FFFFFF) */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Size of each point in pixels. Default: 6 */
  pointSize?: number;
}

/**
 * Mobject2D - 2D point distribution in a rectangular plane
 *
 * Points are distributed within a rectangular region. Supports
 * grid distribution (evenly spaced rows and columns) or random
 * distribution within the bounds.
 *
 * @example
 * ```typescript
 * // Create a 10x10 grid of points
 * const grid = new Mobject2D({
 *   center: [0, 0, 0],
 *   width: 4,
 *   height: 4,
 *   numPointsX: 10,
 *   numPointsY: 10,
 *   distribution: 'grid',
 * });
 *
 * // Create random points in a region
 * const randomCloud = new Mobject2D({
 *   center: [0, 0, 0],
 *   width: 3,
 *   height: 2,
 *   numPointsX: 100,  // total points for random
 *   distribution: 'random',
 *   color: '#ff00ff',
 * });
 *
 * // Use density instead of explicit counts
 * const densePlane = new Mobject2D({
 *   width: 2,
 *   height: 2,
 *   density: 5,  // 5 points per unit (grid) or 5 per unit area (random)
 *   distribution: 'grid',
 * });
 * ```
 */
export class Mobject2D extends PMobject {
  protected _center2D: Vector3Tuple;
  protected _width: number;
  protected _height: number;
  protected _numPointsX: number;
  protected _numPointsY: number;
  protected _density?: number;
  protected _distribution: Distribution2D;

  constructor(options: Mobject2DOptions = {}) {
    const {
      center = [0, 0, 0],
      width = 2,
      height = 2,
      numPointsX = 10,
      numPointsY = 10,
      density,
      distribution = 'grid',
      color = WHITE,
      opacity = 1,
      pointSize = 6,
    } = options;

    super({
      color,
      opacity,
      pointSize,
    });

    this._center2D = [...center];
    this._width = width;
    this._height = height;
    this._numPointsX = numPointsX;
    this._numPointsY = numPointsY;
    this._density = density;
    this._distribution = distribution;

    this._generatePoints();
  }

  /**
   * Get the area of the region
   */
  getArea(): number {
    return this._width * this._height;
  }

  /**
   * Get actual point counts based on density or config
   */
  protected _getActualPointCounts(): { x: number; y: number; total: number } {
    if (this._density !== undefined) {
      if (this._distribution === 'grid') {
        // Density = points per unit length
        const xCount = Math.max(2, Math.round(this._width * this._density));
        const yCount = Math.max(2, Math.round(this._height * this._density));
        return { x: xCount, y: yCount, total: xCount * yCount };
      } else {
        // Density = points per unit area for random
        const totalPoints = Math.max(1, Math.round(this.getArea() * this._density));
        return { x: totalPoints, y: 1, total: totalPoints };
      }
    }
    return {
      x: this._numPointsX,
      y: this._numPointsY,
      total: this._distribution === 'grid'
        ? this._numPointsX * this._numPointsY
        : this._numPointsX,
    };
  }

  /**
   * Generate points in the rectangular region
   */
  protected _generatePoints(): void {
    this.clearPoints();

    const counts = this._getActualPointCounts();
    const halfWidth = this._width / 2;
    const halfHeight = this._height / 2;

    if (this._distribution === 'grid') {
      // Grid distribution
      for (let i = 0; i < counts.x; i++) {
        for (let j = 0; j < counts.y; j++) {
          const tx = counts.x === 1 ? 0.5 : i / (counts.x - 1);
          const ty = counts.y === 1 ? 0.5 : j / (counts.y - 1);

          const x = this._center2D[0] - halfWidth + tx * this._width;
          const y = this._center2D[1] - halfHeight + ty * this._height;
          const z = this._center2D[2];

          this._points.push({
            position: [x, y, z],
            color: this.color,
            opacity: this._opacity,
          });
        }
      }
    } else {
      // Random distribution
      for (let i = 0; i < counts.total; i++) {
        const x = this._center2D[0] - halfWidth + Math.random() * this._width;
        const y = this._center2D[1] - halfHeight + Math.random() * this._height;
        const z = this._center2D[2];

        this._points.push({
          position: [x, y, z],
          color: this.color,
          opacity: this._opacity,
        });
      }
    }

    this._markDirty();
  }

  /**
   * Get the width of the region
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Get the height of the region
   */
  getHeight(): number {
    return this._height;
  }

  /**
   * Set the width and regenerate
   * @param width - New width
   * @returns this for chaining
   */
  setWidth(width: number): this {
    this._width = Math.max(0, width);
    this._generatePoints();
    return this;
  }

  /**
   * Set the height and regenerate
   * @param height - New height
   * @returns this for chaining
   */
  setHeight(height: number): this {
    this._height = Math.max(0, height);
    this._generatePoints();
    return this;
  }

  /**
   * Set both dimensions and regenerate
   * @param width - New width
   * @param height - New height
   * @returns this for chaining
   */
  setDimensions(width: number, height: number): this {
    this._width = Math.max(0, width);
    this._height = Math.max(0, height);
    this._generatePoints();
    return this;
  }

  /**
   * Set point counts for grid distribution (clears density)
   * @param xCount - Points along width
   * @param yCount - Points along height
   * @returns this for chaining
   */
  setPointCounts(xCount: number, yCount: number): this {
    this._numPointsX = Math.max(1, Math.round(xCount));
    this._numPointsY = Math.max(1, Math.round(yCount));
    this._density = undefined;
    this._generatePoints();
    return this;
  }

  /**
   * Set the density and regenerate (overrides point counts)
   * @param density - Points per unit length (grid) or per unit area (random)
   * @returns this for chaining
   */
  setDensity(density: number): this {
    this._density = Math.max(0.1, density);
    this._generatePoints();
    return this;
  }

  /**
   * Set the distribution pattern and regenerate
   * @param distribution - 'grid' or 'random'
   * @returns this for chaining
   */
  setDistribution(distribution: Distribution2D): this {
    this._distribution = distribution;
    this._generatePoints();
    return this;
  }

  /**
   * Get the distribution pattern
   */
  getDistribution(): Distribution2D {
    return this._distribution;
  }

  /**
   * Get the center of the region
   */
  override getCenter(): Vector3Tuple {
    return [...this._center2D];
  }

  /**
   * Move the region to center at a new position
   * @param point - Target center position [x, y, z]
   */
  override moveTo(point: Vector3Tuple): this {
    const delta: Vector3Tuple = [
      point[0] - this._center2D[0],
      point[1] - this._center2D[1],
      point[2] - this._center2D[2]
    ];

    this._center2D = [...point];
    return this.shift(delta);
  }

  /**
   * Shift the region by a delta
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    this._center2D[0] += delta[0];
    this._center2D[1] += delta[1];
    this._center2D[2] += delta[2];

    // Shift the actual points
    for (const point of this._points) {
      point.position[0] += delta[0];
      point.position[1] += delta[1];
      point.position[2] += delta[2];
    }

    this.position.x += delta[0];
    this.position.y += delta[1];
    this.position.z += delta[2];
    this._markDirty();

    return this;
  }

  /**
   * Regenerate the points (useful for random distribution refresh)
   * @returns this for chaining
   */
  regenerate(): this {
    this._generatePoints();
    return this;
  }

  /**
   * Create a copy of this Mobject2D
   */
  protected override _createCopy(): Mobject2D {
    return new Mobject2D({
      center: this._center2D,
      width: this._width,
      height: this._height,
      numPointsX: this._numPointsX,
      numPointsY: this._numPointsY,
      density: this._density,
      distribution: this._distribution,
      color: this.color,
      opacity: this._opacity,
      pointSize: this._pointSize,
    });
  }
}

export default PMobject;
