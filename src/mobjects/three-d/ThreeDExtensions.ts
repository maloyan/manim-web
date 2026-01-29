import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';

/**
 * Options for creating a Prism
 */
export interface PrismOptions {
  /** Number of sides for the base polygon. Default: 6 (hexagonal) */
  sides?: number;
  /** Radius of the circumscribed circle of the base polygon. Default: 1 */
  radius?: number;
  /** Height of the prism. Default: 2 */
  height?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Whether to render as wireframe. Default: false */
  wireframe?: boolean;
}

/**
 * Prism - A 3D prism with a configurable regular polygon base
 *
 * Creates a prism using Three.js CylinderGeometry with the specified
 * number of radial segments to form the polygon base.
 *
 * @example
 * ```typescript
 * // Create a hexagonal prism (default)
 * const prism = new Prism();
 *
 * // Create a triangular prism
 * const triangularPrism = new Prism({ sides: 3, radius: 1.5 });
 *
 * // Create an octagonal prism
 * const octagonalPrism = new Prism({
 *   sides: 8,
 *   radius: 1,
 *   height: 3,
 *   color: '#00ff00'
 * });
 * ```
 */
export class Prism extends Mobject {
  private _sides: number;
  private _radius: number;
  private _height: number;
  private _wireframe: boolean;
  private _centerPoint: Vector3Tuple;

  constructor(options: PrismOptions = {}) {
    super();

    const {
      sides = 6,
      radius = 1,
      height = 2,
      center = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      wireframe = false,
    } = options;

    // Ensure at least 3 sides for a valid polygon
    this._sides = Math.max(3, Math.floor(sides));
    this._radius = radius;
    this._height = height;
    this._wireframe = wireframe;
    this._centerPoint = [...center];

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from center
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Create the Three.js prism mesh
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.CylinderGeometry(
      this._radius,
      this._radius,
      this._height,
      this._sides, // radialSegments = number of sides
      1,
      false
    );

    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      wireframe: this._wireframe,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  /**
   * Sync material properties to Three.js object
   */
  protected override _syncMaterialToThree(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      const material = this._threeObject.material as THREE.MeshStandardMaterial;
      if (material) {
        material.color.set(this.color);
        material.opacity = this._opacity;
        material.transparent = this._opacity < 1;
        material.wireframe = this._wireframe;
        material.needsUpdate = true;
      }
    }
  }

  /**
   * Update the geometry with current dimensions
   */
  private _updateGeometry(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry.dispose();
      this._threeObject.geometry = new THREE.CylinderGeometry(
        this._radius,
        this._radius,
        this._height,
        this._sides,
        1,
        false
      );
    }
    this._markDirty();
  }

  /**
   * Get the number of sides
   */
  getSides(): number {
    return this._sides;
  }

  /**
   * Set the number of sides
   */
  setSides(value: number): this {
    this._sides = Math.max(3, Math.floor(value));
    this._updateGeometry();
    return this;
  }

  /**
   * Get the base radius
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Set the base radius
   */
  setRadius(value: number): this {
    this._radius = value;
    this._updateGeometry();
    return this;
  }

  /**
   * Get the height
   */
  getHeight(): number {
    return this._height;
  }

  /**
   * Set the height
   */
  setHeight(value: number): this {
    this._height = value;
    this._updateGeometry();
    return this;
  }

  /**
   * Get whether wireframe mode is enabled
   */
  isWireframe(): boolean {
    return this._wireframe;
  }

  /**
   * Set wireframe mode
   */
  setWireframe(value: boolean): this {
    this._wireframe = value;
    this._markDirty();
    return this;
  }

  /**
   * Get the lateral surface area of the prism
   */
  getLateralSurfaceArea(): number {
    // Side length of regular polygon
    const sideLength = 2 * this._radius * Math.sin(Math.PI / this._sides);
    return this._sides * sideLength * this._height;
  }

  /**
   * Get the base area of the prism
   */
  getBaseArea(): number {
    // Area of regular polygon
    return (
      (this._sides * this._radius * this._radius * Math.sin((2 * Math.PI) / this._sides)) / 2
    );
  }

  /**
   * Get the total surface area of the prism
   */
  getSurfaceArea(): number {
    return this.getLateralSurfaceArea() + 2 * this.getBaseArea();
  }

  /**
   * Get the volume of the prism
   */
  getVolume(): number {
    return this.getBaseArea() * this._height;
  }

  /**
   * Create a copy of this Prism
   */
  protected override _createCopy(): Prism {
    return new Prism({
      sides: this._sides,
      radius: this._radius,
      height: this._height,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
    });
  }
}

/**
 * Options for creating a Dot3D
 */
export interface Dot3DOptions {
  /** Radius of the dot. Default: 0.08 */
  radius?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  point?: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Whether to add a glow effect. Default: false */
  glow?: boolean;
  /** Glow intensity multiplier. Default: 1.5 */
  glowIntensity?: number;
  /** Glow radius multiplier (relative to dot radius). Default: 3 */
  glowRadius?: number;
  /** Resolution of the sphere. Default: 16 */
  resolution?: number;
}

/**
 * Dot3D - A small sphere used as a 3D point marker
 *
 * Creates a small sphere that serves as a visual marker for a point
 * in 3D space. Optionally includes a glow effect for emphasis.
 *
 * @example
 * ```typescript
 * // Create a simple white dot
 * const dot = new Dot3D();
 *
 * // Create a red dot at a specific position
 * const redDot = new Dot3D({
 *   point: [1, 2, 3],
 *   color: '#ff0000'
 * });
 *
 * // Create a glowing dot
 * const glowingDot = new Dot3D({
 *   point: [0, 0, 0],
 *   color: '#ffff00',
 *   glow: true,
 *   glowIntensity: 2
 * });
 * ```
 */
export class Dot3D extends Mobject {
  private _radius: number;
  private _pointPosition: Vector3Tuple;
  private _glow: boolean;
  private _glowIntensity: number;
  private _glowRadius: number;
  private _resolution: number;
  private _glowMesh: THREE.Mesh | null = null;

  constructor(options: Dot3DOptions = {}) {
    super();

    const {
      radius = 0.08,
      point = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      glow = false,
      glowIntensity = 1.5,
      glowRadius = 3,
      resolution = 16,
    } = options;

    this._radius = radius;
    this._pointPosition = [...point];
    this._glow = glow;
    this._glowIntensity = glowIntensity;
    this._glowRadius = glowRadius;
    this._resolution = resolution;

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from point
    this.position.set(point[0], point[1], point[2]);
  }

  /**
   * Create the Three.js dot mesh with optional glow
   */
  protected _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    // Create the main dot sphere
    const geometry = new THREE.SphereGeometry(
      this._radius,
      this._resolution,
      this._resolution
    );

    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      emissive: this._glow ? new THREE.Color(this.color) : undefined,
      emissiveIntensity: this._glow ? this._glowIntensity * 0.5 : 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Create glow effect if enabled
    if (this._glow) {
      this._createGlow(group);
    }

    return group;
  }

  /**
   * Create the glow effect mesh
   */
  private _createGlow(group: THREE.Group): void {
    const glowGeometry = new THREE.SphereGeometry(
      this._radius * this._glowRadius,
      this._resolution,
      this._resolution
    );

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: this._opacity * 0.3 / this._glowIntensity,
      side: THREE.BackSide,
    });

    this._glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(this._glowMesh);
  }

  /**
   * Sync material properties to Three.js object
   */
  protected override _syncMaterialToThree(): void {
    if (this._threeObject instanceof THREE.Group) {
      const mainMesh = this._threeObject.children[0] as THREE.Mesh;
      if (mainMesh) {
        const material = mainMesh.material as THREE.MeshStandardMaterial;
        if (material) {
          material.color.set(this.color);
          material.opacity = this._opacity;
          material.transparent = this._opacity < 1;
          if (this._glow) {
            material.emissive = new THREE.Color(this.color);
            material.emissiveIntensity = this._glowIntensity * 0.5;
          }
          material.needsUpdate = true;
        }
      }

      // Update glow mesh if it exists
      if (this._glowMesh) {
        const glowMaterial = this._glowMesh.material as THREE.MeshBasicMaterial;
        if (glowMaterial) {
          glowMaterial.color.set(this.color);
          glowMaterial.opacity = this._opacity * 0.3 / this._glowIntensity;
          glowMaterial.needsUpdate = true;
        }
      }
    }
  }

  /**
   * Get the radius
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Set the radius
   */
  setRadius(value: number): this {
    this._radius = value;
    this._rebuildGeometry();
    return this;
  }

  /**
   * Get whether glow is enabled
   */
  hasGlow(): boolean {
    return this._glow;
  }

  /**
   * Enable or disable glow effect
   */
  setGlow(value: boolean): this {
    if (this._glow !== value) {
      this._glow = value;
      this._rebuildGeometry();
    }
    return this;
  }

  /**
   * Get the glow intensity
   */
  getGlowIntensity(): number {
    return this._glowIntensity;
  }

  /**
   * Set the glow intensity
   */
  setGlowIntensity(value: number): this {
    this._glowIntensity = value;
    this._markDirty();
    return this;
  }

  /**
   * Rebuild the geometry (for when radius or glow changes)
   */
  private _rebuildGeometry(): void {
    if (this._threeObject instanceof THREE.Group) {
      // Dispose old geometries
      for (const child of this._threeObject.children) {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      }

      // Clear children
      while (this._threeObject.children.length > 0) {
        this._threeObject.remove(this._threeObject.children[0]);
      }

      // Recreate main sphere
      const geometry = new THREE.SphereGeometry(
        this._radius,
        this._resolution,
        this._resolution
      );

      const material = new THREE.MeshStandardMaterial({
        color: this.color,
        opacity: this._opacity,
        transparent: this._opacity < 1,
        emissive: this._glow ? new THREE.Color(this.color) : undefined,
        emissiveIntensity: this._glow ? this._glowIntensity * 0.5 : 0,
      });

      const mesh = new THREE.Mesh(geometry, material);
      this._threeObject.add(mesh);

      // Recreate glow if enabled
      this._glowMesh = null;
      if (this._glow) {
        this._createGlow(this._threeObject);
      }
    }
    this._markDirty();
  }

  /**
   * Get the point position
   */
  getPoint(): Vector3Tuple {
    return [...this._pointPosition];
  }

  /**
   * Move the dot to a new point
   */
  moveToPoint(point: Vector3Tuple): this {
    this._pointPosition = [...point];
    this.position.set(point[0], point[1], point[2]);
    this._markDirty();
    return this;
  }

  /**
   * Create a copy of this Dot3D
   */
  protected override _createCopy(): Dot3D {
    return new Dot3D({
      radius: this._radius,
      point: this._pointPosition,
      color: this.color,
      opacity: this._opacity,
      glow: this._glow,
      glowIntensity: this._glowIntensity,
      glowRadius: this._glowRadius,
      resolution: this._resolution,
    });
  }
}

/**
 * Options for creating a ThreeDVMobject
 */
export interface ThreeDVMobjectOptions {
  /** Initial points in 3D space. Default: [] */
  points?: number[][];
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Fill opacity from 0 to 1. Default: 0.5 */
  fillOpacity?: number;
  /** Stroke width. Default: 4 */
  strokeWidth?: number;
  /** Whether this is a closed path. Default: false */
  closePath?: boolean;
}

/**
 * ThreeDVMobject - Base class for 3D vector mobjects
 *
 * Extends VMobject with proper 3D support, allowing paths and shapes
 * to exist fully in 3D space with proper Z-coordinate handling.
 * This is useful for creating 3D curves, paths, and shapes that
 * aren't restricted to a plane.
 *
 * @example
 * ```typescript
 * // Create a 3D path
 * const path = new ThreeDVMobject({
 *   points: [
 *     [0, 0, 0],
 *     [1, 0, 0],
 *     [1, 1, 0.5],
 *     [1, 1, 1]
 *   ],
 *   color: '#00ff00',
 *   strokeWidth: 3
 * });
 *
 * // Create a 3D spiral
 * const spiralPoints: number[][] = [];
 * for (let t = 0; t <= 4 * Math.PI; t += 0.1) {
 *   spiralPoints.push([
 *     Math.cos(t),
 *     Math.sin(t),
 *     t / (4 * Math.PI)
 *   ]);
 * }
 * const spiral = new ThreeDVMobject({
 *   points: spiralPoints,
 *   color: '#ff00ff'
 * });
 * ```
 */
export class ThreeDVMobject extends VMobject {
  private _closePath: boolean;

  constructor(options: ThreeDVMobjectOptions = {}) {
    super();

    const {
      points = [],
      color = '#ffffff',
      opacity = 1,
      fillOpacity = 0.5,
      strokeWidth = 4,
      closePath = false,
    } = options;

    this._closePath = closePath;
    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    if (points.length > 0) {
      this.setPoints3D(points);
    }
  }

  /**
   * Set whether the path should be closed
   */
  setClosePath(value: boolean): this {
    this._closePath = value;
    this._markDirty();
    return this;
  }

  /**
   * Get whether the path is closed
   */
  isClosedPath(): boolean {
    return this._closePath;
  }

  /**
   * Add a 3D point to the path
   * @param point - The 3D point [x, y, z]
   */
  addPoint3D(point: number[]): this {
    this._points3D.push([...point]);
    this._points2D.push({ x: point[0], y: point[1] });
    this._markDirty();
    return this;
  }

  /**
   * Add a cubic Bezier curve segment in 3D
   * @param handle1 - First control point
   * @param handle2 - Second control point
   * @param anchor - End anchor point
   */
  addCubicBezierCurveTo(handle1: number[], handle2: number[], anchor: number[]): this {
    this._points3D.push([...handle1], [...handle2], [...anchor]);
    this._points2D.push(
      { x: handle1[0], y: handle1[1] },
      { x: handle2[0], y: handle2[1] },
      { x: anchor[0], y: anchor[1] }
    );
    this._markDirty();
    return this;
  }

  /**
   * Add a line segment in 3D (creates degenerate Bezier)
   * @param end - End point
   */
  addLineTo(end: number[]): this {
    if (this._points3D.length === 0) {
      this._points3D.push([0, 0, 0]);
      this._points2D.push({ x: 0, y: 0 });
    }

    const start = this._points3D[this._points3D.length - 1];

    // Create a degenerate cubic Bezier (handles on the line)
    const handle1 = [
      start[0] + (end[0] - start[0]) / 3,
      start[1] + (end[1] - start[1]) / 3,
      start[2] + (end[2] - start[2]) / 3,
    ];
    const handle2 = [
      start[0] + (2 * (end[0] - start[0])) / 3,
      start[1] + (2 * (end[1] - start[1])) / 3,
      start[2] + (2 * (end[2] - start[2])) / 3,
    ];

    return this.addCubicBezierCurveTo(handle1, handle2, end);
  }

  /**
   * Start a new subpath at the given point
   * @param point - Starting point
   */
  startNewPath(point: number[]): this {
    this._points3D.push([...point]);
    this._points2D.push({ x: point[0], y: point[1] });
    this._markDirty();
    return this;
  }

  /**
   * Close the current path by connecting back to the start
   */
  closePath(): this {
    if (this._points3D.length < 2) return this;

    const start = this._points3D[0];
    const end = this._points3D[this._points3D.length - 1];

    // If not already closed, add a line back to start
    const dist = Math.sqrt(
      Math.pow(end[0] - start[0], 2) +
      Math.pow(end[1] - start[1], 2) +
      Math.pow(end[2] - start[2], 2)
    );

    if (dist > 0.0001) {
      this.addLineTo(start);
    }

    this._closePath = true;
    return this;
  }

  /**
   * Get the center of this 3D VMobject based on its points
   */
  override getCenter(): Vector3Tuple {
    if (this._points3D.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

    // Calculate centroid of all 3D points
    let sumX = 0, sumY = 0, sumZ = 0;
    for (const point of this._points3D) {
      sumX += point[0];
      sumY += point[1];
      sumZ += point[2];
    }
    const count = this._points3D.length;

    return [
      this.position.x + sumX / count,
      this.position.y + sumY / count,
      this.position.z + sumZ / count,
    ];
  }

  /**
   * Get the bounding box in 3D
   */
  getBounds3D(): { min: Vector3Tuple; max: Vector3Tuple } {
    if (this._points3D.length === 0) {
      return {
        min: [this.position.x, this.position.y, this.position.z],
        max: [this.position.x, this.position.y, this.position.z],
      };
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const point of this._points3D) {
      minX = Math.min(minX, point[0]);
      minY = Math.min(minY, point[1]);
      minZ = Math.min(minZ, point[2]);
      maxX = Math.max(maxX, point[0]);
      maxY = Math.max(maxY, point[1]);
      maxZ = Math.max(maxZ, point[2]);
    }

    return {
      min: [
        this.position.x + minX,
        this.position.y + minY,
        this.position.z + minZ,
      ],
      max: [
        this.position.x + maxX,
        this.position.y + maxY,
        this.position.z + maxZ,
      ],
    };
  }

  /**
   * Create a copy of this ThreeDVMobject
   */
  protected override _createCopy(): ThreeDVMobject {
    const copy = new ThreeDVMobject({
      points: this._points3D.map(p => [...p]),
      color: this.color,
      opacity: this._opacity,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
      closePath: this._closePath,
    });
    return copy;
  }
}

export default Prism;
