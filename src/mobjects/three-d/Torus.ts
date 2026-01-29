import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a Torus
 */
export interface TorusOptions {
  /** Major radius (distance from center of tube to center of torus). Default: 1 */
  radius?: number;
  /** Minor radius (radius of the tube). Default: 0.3 */
  tubeRadius?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Number of radial segments. Default: 32 */
  radialSegments?: number;
  /** Number of tubular segments. Default: 64 */
  tubularSegments?: number;
  /** Central angle (arc). Default: 2*PI (full torus) */
  arc?: number;
  /** Whether to render as wireframe. Default: false */
  wireframe?: boolean;
}

/**
 * Torus - A 3D torus (donut shape) mesh
 *
 * Creates a torus using Three.js TorusGeometry with configurable
 * major and minor radii, and material properties.
 *
 * @example
 * ```typescript
 * // Create a default torus
 * const torus = new Torus();
 *
 * // Create a red torus with larger tube
 * const redTorus = new Torus({
 *   radius: 2,
 *   tubeRadius: 0.5,
 *   color: '#ff0000'
 * });
 *
 * // Create a half-torus (arc)
 * const halfTorus = new Torus({
 *   arc: Math.PI
 * });
 * ```
 */
export class Torus extends Mobject {
  private _radius: number;
  private _tubeRadius: number;
  private _radialSegments: number;
  private _tubularSegments: number;
  private _arc: number;
  private _wireframe: boolean;
  private _centerPoint: Vector3Tuple;

  constructor(options: TorusOptions = {}) {
    super();

    const {
      radius = 1,
      tubeRadius = 0.3,
      center = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      radialSegments = 32,
      tubularSegments = 64,
      arc = Math.PI * 2,
      wireframe = false,
    } = options;

    this._radius = radius;
    this._tubeRadius = tubeRadius;
    this._radialSegments = radialSegments;
    this._tubularSegments = tubularSegments;
    this._arc = arc;
    this._wireframe = wireframe;
    this._centerPoint = [...center];

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from center
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Create the Three.js torus mesh
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.TorusGeometry(
      this._radius,
      this._tubeRadius,
      this._radialSegments,
      this._tubularSegments,
      this._arc
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
      this._threeObject.geometry = new THREE.TorusGeometry(
        this._radius,
        this._tubeRadius,
        this._radialSegments,
        this._tubularSegments,
        this._arc
      );
    }
    this._markDirty();
  }

  /**
   * Get the major radius
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Set the major radius
   */
  setRadius(value: number): this {
    this._radius = value;
    this._updateGeometry();
    return this;
  }

  /**
   * Get the tube radius
   */
  getTubeRadius(): number {
    return this._tubeRadius;
  }

  /**
   * Set the tube radius
   */
  setTubeRadius(value: number): this {
    this._tubeRadius = value;
    this._updateGeometry();
    return this;
  }

  /**
   * Get the arc angle
   */
  getArc(): number {
    return this._arc;
  }

  /**
   * Set the arc angle
   */
  setArc(value: number): this {
    this._arc = value;
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
   * Get the surface area of the torus
   */
  getSurfaceArea(): number {
    const arcFraction = this._arc / (Math.PI * 2);
    return 4 * Math.PI * Math.PI * this._radius * this._tubeRadius * arcFraction;
  }

  /**
   * Get the volume of the torus
   */
  getVolume(): number {
    const arcFraction = this._arc / (Math.PI * 2);
    return 2 * Math.PI * Math.PI * this._radius * this._tubeRadius * this._tubeRadius * arcFraction;
  }

  /**
   * Get a point on the torus surface
   * @param u Angle around the tube (0 to 2*PI)
   * @param v Angle around the torus (0 to 2*PI)
   */
  pointAtAngles(u: number, v: number): Vector3Tuple {
    const x = (this._radius + this._tubeRadius * Math.cos(v)) * Math.cos(u);
    const y = (this._radius + this._tubeRadius * Math.cos(v)) * Math.sin(u);
    const z = this._tubeRadius * Math.sin(v);
    return [
      x + this.position.x,
      y + this.position.y,
      z + this.position.z,
    ];
  }

  /**
   * Create a copy of this Torus
   */
  protected override _createCopy(): Torus {
    return new Torus({
      radius: this._radius,
      tubeRadius: this._tubeRadius,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      radialSegments: this._radialSegments,
      tubularSegments: this._tubularSegments,
      arc: this._arc,
      wireframe: this._wireframe,
    });
  }
}

export default Torus;
