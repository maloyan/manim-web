import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a Cylinder
 */
export interface CylinderOptions {
  /** Radius of the cylinder. Default: 1 */
  radius?: number;
  /** Height of the cylinder. Default: 2 */
  height?: number;
  /** Radius at the top (overrides radius if set). Default: same as radius */
  radiusTop?: number;
  /** Radius at the bottom (overrides radius if set). Default: same as radius */
  radiusBottom?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Number of radial segments. Default: 32 */
  radialSegments?: number;
  /** Whether ends are open. Default: false */
  openEnded?: boolean;
  /** Whether to render as wireframe. Default: false */
  wireframe?: boolean;
}

/**
 * Cylinder - A 3D cylindrical mesh
 *
 * Creates a cylinder using Three.js CylinderGeometry with configurable
 * radius, height, and material properties. Supports different top and bottom
 * radii for creating truncated cones.
 *
 * @example
 * ```typescript
 * // Create a default cylinder
 * const cylinder = new Cylinder();
 *
 * // Create a red cylinder
 * const redCylinder = new Cylinder({
 *   radius: 0.5,
 *   height: 3,
 *   color: '#ff0000'
 * });
 *
 * // Create a truncated cone
 * const cone = new Cylinder({
 *   radiusTop: 0.5,
 *   radiusBottom: 1,
 *   height: 2
 * });
 * ```
 */
export class Cylinder extends Mobject {
  protected _radiusTop: number;
  protected _radiusBottom: number;
  protected _height: number;
  protected _radialSegments: number;
  protected _openEnded: boolean;
  protected _wireframe: boolean;
  protected _centerPoint: Vector3Tuple;

  constructor(options: CylinderOptions = {}) {
    super();

    const {
      radius = 1,
      height = 2,
      radiusTop,
      radiusBottom,
      center = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      radialSegments = 32,
      openEnded = false,
      wireframe = false,
    } = options;

    this._radiusTop = radiusTop ?? radius;
    this._radiusBottom = radiusBottom ?? radius;
    this._height = height;
    this._radialSegments = radialSegments;
    this._openEnded = openEnded;
    this._wireframe = wireframe;
    this._centerPoint = [...center];

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from center
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Create the Three.js cylinder mesh
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.CylinderGeometry(
      this._radiusTop,
      this._radiusBottom,
      this._height,
      this._radialSegments,
      1,
      this._openEnded
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
  protected _updateGeometry(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry.dispose();
      this._threeObject.geometry = new THREE.CylinderGeometry(
        this._radiusTop,
        this._radiusBottom,
        this._height,
        this._radialSegments,
        1,
        this._openEnded
      );
    }
    this._markDirty();
  }

  /**
   * Get the radius at the top
   */
  getRadiusTop(): number {
    return this._radiusTop;
  }

  /**
   * Set the radius at the top
   */
  setRadiusTop(value: number): this {
    this._radiusTop = value;
    this._updateGeometry();
    return this;
  }

  /**
   * Get the radius at the bottom
   */
  getRadiusBottom(): number {
    return this._radiusBottom;
  }

  /**
   * Set the radius at the bottom
   */
  setRadiusBottom(value: number): this {
    this._radiusBottom = value;
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
   * Get whether ends are open
   */
  isOpenEnded(): boolean {
    return this._openEnded;
  }

  /**
   * Set whether ends are open
   */
  setOpenEnded(value: boolean): this {
    this._openEnded = value;
    this._updateGeometry();
    return this;
  }

  /**
   * Get the lateral surface area of the cylinder
   */
  getLateralSurfaceArea(): number {
    const slantHeight = Math.sqrt(
      this._height * this._height +
      Math.pow(this._radiusBottom - this._radiusTop, 2)
    );
    return Math.PI * (this._radiusTop + this._radiusBottom) * slantHeight;
  }

  /**
   * Get the total surface area of the cylinder (including caps)
   */
  getSurfaceArea(): number {
    const lateral = this.getLateralSurfaceArea();
    if (this._openEnded) {
      return lateral;
    }
    const topArea = Math.PI * this._radiusTop * this._radiusTop;
    const bottomArea = Math.PI * this._radiusBottom * this._radiusBottom;
    return lateral + topArea + bottomArea;
  }

  /**
   * Get the volume of the cylinder
   */
  getVolume(): number {
    // Volume of truncated cone formula
    return (Math.PI * this._height / 3) * (
      this._radiusTop * this._radiusTop +
      this._radiusTop * this._radiusBottom +
      this._radiusBottom * this._radiusBottom
    );
  }

  /**
   * Create a copy of this Cylinder
   */
  protected override _createCopy(): Cylinder {
    return new Cylinder({
      radiusTop: this._radiusTop,
      radiusBottom: this._radiusBottom,
      height: this._height,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      radialSegments: this._radialSegments,
      openEnded: this._openEnded,
      wireframe: this._wireframe,
    });
  }
}

/**
 * Options for creating a Cone
 */
export interface ConeOptions {
  /** Radius of the cone base. Default: 1 */
  radius?: number;
  /** Height of the cone. Default: 2 */
  height?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Number of radial segments. Default: 32 */
  radialSegments?: number;
  /** Whether base is open. Default: false */
  openEnded?: boolean;
  /** Whether to render as wireframe. Default: false */
  wireframe?: boolean;
}

/**
 * Cone - A 3D cone mesh (cylinder with top radius = 0)
 *
 * Creates a cone using Three.js CylinderGeometry with the top radius
 * set to 0.
 *
 * @example
 * ```typescript
 * // Create a default cone
 * const cone = new Cone();
 *
 * // Create a tall red cone
 * const tallCone = new Cone({
 *   radius: 0.5,
 *   height: 4,
 *   color: '#ff0000'
 * });
 * ```
 */
export class Cone extends Cylinder {
  constructor(options: ConeOptions = {}) {
    const {
      radius = 1,
      height = 2,
      center = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      radialSegments = 32,
      openEnded = false,
      wireframe = false,
    } = options;

    super({
      radiusTop: 0,
      radiusBottom: radius,
      height,
      center,
      color,
      opacity,
      radialSegments,
      openEnded,
      wireframe,
    });
  }

  /**
   * Get the base radius
   */
  getRadius(): number {
    return this._radiusBottom;
  }

  /**
   * Set the base radius
   */
  setRadius(value: number): this {
    this._radiusBottom = value;
    this._updateGeometry();
    return this;
  }

  /**
   * Create a copy of this Cone
   */
  protected override _createCopy(): Cone {
    return new Cone({
      radius: this._radiusBottom,
      height: this._height,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      radialSegments: this._radialSegments,
      openEnded: this._openEnded,
      wireframe: this._wireframe,
    });
  }
}

export default Cylinder;
