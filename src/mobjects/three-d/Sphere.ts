import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a Sphere
 */
export interface SphereOptions {
  /** Radius of the sphere. Default: 1 */
  radius?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Number of segments for sphere geometry. Default: 32 */
  resolution?: number;
  /** Whether to render as wireframe. Default: false */
  wireframe?: boolean;
}

/**
 * Sphere - A 3D spherical mesh
 *
 * Creates a sphere using Three.js SphereGeometry with configurable
 * radius, resolution, and material properties.
 *
 * @example
 * ```typescript
 * // Create a unit sphere
 * const sphere = new Sphere();
 *
 * // Create a red sphere with radius 2
 * const redSphere = new Sphere({ radius: 2, color: '#ff0000' });
 *
 * // Create a semi-transparent wireframe sphere
 * const wireframe = new Sphere({
 *   radius: 1.5,
 *   wireframe: true,
 *   opacity: 0.7
 * });
 * ```
 */
export class Sphere extends Mobject {
  private _radius: number;
  private _resolution: number;
  private _wireframe: boolean;
  private _centerPoint: Vector3Tuple;

  constructor(options: SphereOptions = {}) {
    super();

    const {
      radius = 1,
      center = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      resolution = 32,
      wireframe = false,
    } = options;

    this._radius = radius;
    this._resolution = resolution;
    this._wireframe = wireframe;
    this._centerPoint = [...center];

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from center
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Create the Three.js sphere mesh
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.SphereGeometry(
      this._radius,
      this._resolution,
      this._resolution
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
    // Recreate geometry with new radius
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry.dispose();
      this._threeObject.geometry = new THREE.SphereGeometry(
        this._radius,
        this._resolution,
        this._resolution
      );
    }
    this._markDirty();
    return this;
  }

  /**
   * Get the resolution (number of segments)
   */
  getResolution(): number {
    return this._resolution;
  }

  /**
   * Set the resolution
   */
  setResolution(value: number): this {
    this._resolution = value;
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry.dispose();
      this._threeObject.geometry = new THREE.SphereGeometry(
        this._radius,
        this._resolution,
        this._resolution
      );
    }
    this._markDirty();
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
   * Get the surface area of the sphere
   */
  getSurfaceArea(): number {
    return 4 * Math.PI * this._radius * this._radius;
  }

  /**
   * Get the volume of the sphere
   */
  getVolume(): number {
    return (4 / 3) * Math.PI * Math.pow(this._radius, 3);
  }

  /**
   * Get a point on the sphere at given spherical coordinates
   * @param theta Azimuthal angle (0 to 2*PI)
   * @param phi Polar angle (0 to PI)
   */
  pointAtAngles(theta: number, phi: number): Vector3Tuple {
    const x = this._radius * Math.sin(phi) * Math.cos(theta);
    const y = this._radius * Math.sin(phi) * Math.sin(theta);
    const z = this._radius * Math.cos(phi);
    return [
      x + this.position.x,
      y + this.position.y,
      z + this.position.z,
    ];
  }

  /**
   * Create a copy of this Sphere
   */
  protected override _createCopy(): Sphere {
    return new Sphere({
      radius: this._radius,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      resolution: this._resolution,
      wireframe: this._wireframe,
    });
  }
}

export default Sphere;
