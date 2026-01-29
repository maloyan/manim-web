import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a Surface3D
 */
export interface Surface3DOptions {
  /** Parametric function (u, v) => [x, y, z] */
  func: (u: number, v: number) => Vector3Tuple;
  /** U parameter range [min, max]. Default: [0, 1] */
  uRange?: [number, number];
  /** V parameter range [min, max]. Default: [0, 1] */
  vRange?: [number, number];
  /** Number of segments in U direction. Default: 32 */
  uResolution?: number;
  /** Number of segments in V direction. Default: 32 */
  vResolution?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Whether to render as wireframe. Default: false */
  wireframe?: boolean;
  /** Whether to render both sides. Default: true */
  doubleSided?: boolean;
}

/**
 * Surface3D - A parametric 3D surface
 *
 * Creates a parametric surface using Three.js ParametricGeometry.
 * The surface is defined by a function that maps (u, v) parameters
 * to 3D points.
 *
 * @example
 * ```typescript
 * // Create a paraboloid
 * const paraboloid = new Surface3D({
 *   func: (u, v) => {
 *     const x = u * 2 - 1;
 *     const y = v * 2 - 1;
 *     const z = x * x + y * y;
 *     return [x, y, z];
 *   },
 *   uRange: [0, 1],
 *   vRange: [0, 1]
 * });
 *
 * // Create a sphere using parametric equations
 * const sphere = new Surface3D({
 *   func: (u, v) => {
 *     const theta = u * Math.PI * 2;
 *     const phi = v * Math.PI;
 *     return [
 *       Math.sin(phi) * Math.cos(theta),
 *       Math.sin(phi) * Math.sin(theta),
 *       Math.cos(phi)
 *     ];
 *   }
 * });
 * ```
 */
export class Surface3D extends Mobject {
  protected _func: (u: number, v: number) => Vector3Tuple;
  protected _uRange: [number, number];
  protected _vRange: [number, number];
  protected _uResolution: number;
  protected _vResolution: number;
  protected _wireframe: boolean;
  protected _doubleSided: boolean;
  protected _centerPoint: Vector3Tuple;

  constructor(options: Surface3DOptions) {
    super();

    const {
      func,
      uRange = [0, 1],
      vRange = [0, 1],
      uResolution = 32,
      vResolution = 32,
      center = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      wireframe = false,
      doubleSided = true,
    } = options;

    this._func = func;
    this._uRange = [...uRange];
    this._vRange = [...vRange];
    this._uResolution = uResolution;
    this._vResolution = vResolution;
    this._wireframe = wireframe;
    this._doubleSided = doubleSided;
    this._centerPoint = [...center];

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from center
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Create the Three.js parametric surface mesh
   */
  protected _createThreeObject(): THREE.Object3D {
    const [uMin, uMax] = this._uRange;
    const [vMin, vMax] = this._vRange;
    const uRange = uMax - uMin;
    const vRange = vMax - vMin;

    // Create parametric function for Three.js
    // Three.js ParametricGeometry expects u, v in [0, 1]
    const paramFunc = (u: number, v: number, target: THREE.Vector3) => {
      // Map from [0, 1] to actual range
      const uActual = uMin + u * uRange;
      const vActual = vMin + v * vRange;
      const [x, y, z] = this._func(uActual, vActual);
      target.set(x, y, z);
    };

    const geometry = new ParametricGeometry(
      paramFunc,
      this._uResolution,
      this._vResolution
    );

    // Compute normals for proper lighting
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      wireframe: this._wireframe,
      side: this._doubleSided ? THREE.DoubleSide : THREE.FrontSide,
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
        material.side = this._doubleSided ? THREE.DoubleSide : THREE.FrontSide;
        material.needsUpdate = true;
      }
    }
  }

  /**
   * Update the geometry with current function and parameters
   */
  protected _updateGeometry(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry.dispose();

      const [uMin, uMax] = this._uRange;
      const [vMin, vMax] = this._vRange;
      const uRange = uMax - uMin;
      const vRange = vMax - vMin;

      const paramFunc = (u: number, v: number, target: THREE.Vector3) => {
        const uActual = uMin + u * uRange;
        const vActual = vMin + v * vRange;
        const [x, y, z] = this._func(uActual, vActual);
        target.set(x, y, z);
      };

      const geometry = new ParametricGeometry(
        paramFunc,
        this._uResolution,
        this._vResolution
      );
      geometry.computeVertexNormals();
      this._threeObject.geometry = geometry;
    }
    this._markDirty();
  }

  /**
   * Get the parametric function
   */
  getFunc(): (u: number, v: number) => Vector3Tuple {
    return this._func;
  }

  /**
   * Set the parametric function
   */
  setFunc(func: (u: number, v: number) => Vector3Tuple): this {
    this._func = func;
    this._updateGeometry();
    return this;
  }

  /**
   * Get the U parameter range
   */
  getURange(): [number, number] {
    return [...this._uRange];
  }

  /**
   * Set the U parameter range
   */
  setURange(range: [number, number]): this {
    this._uRange = [...range];
    this._updateGeometry();
    return this;
  }

  /**
   * Get the V parameter range
   */
  getVRange(): [number, number] {
    return [...this._vRange];
  }

  /**
   * Set the V parameter range
   */
  setVRange(range: [number, number]): this {
    this._vRange = [...range];
    this._updateGeometry();
    return this;
  }

  /**
   * Get the U resolution
   */
  getUResolution(): number {
    return this._uResolution;
  }

  /**
   * Set the U resolution
   */
  setUResolution(value: number): this {
    this._uResolution = value;
    this._updateGeometry();
    return this;
  }

  /**
   * Get the V resolution
   */
  getVResolution(): number {
    return this._vResolution;
  }

  /**
   * Set the V resolution
   */
  setVResolution(value: number): this {
    this._vResolution = value;
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
   * Get whether double-sided rendering is enabled
   */
  isDoubleSided(): boolean {
    return this._doubleSided;
  }

  /**
   * Set double-sided rendering
   */
  setDoubleSided(value: boolean): this {
    this._doubleSided = value;
    this._markDirty();
    return this;
  }

  /**
   * Evaluate the surface at given parameters
   * @param u U parameter
   * @param v V parameter
   */
  evaluate(u: number, v: number): Vector3Tuple {
    const [x, y, z] = this._func(u, v);
    return [
      x + this.position.x,
      y + this.position.y,
      z + this.position.z,
    ];
  }

  /**
   * Create a copy of this Surface3D
   */
  protected override _createCopy(): Surface3D {
    return new Surface3D({
      func: this._func,
      uRange: this._uRange,
      vRange: this._vRange,
      uResolution: this._uResolution,
      vResolution: this._vResolution,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
      doubleSided: this._doubleSided,
    });
  }
}

export default Surface3D;
