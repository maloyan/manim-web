import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a Cube
 */
export interface CubeOptions {
  /** Side length of the cube. Default: 1 */
  sideLength?: number;
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
 * Cube - A 3D cube mesh with equal side lengths
 *
 * Creates a cube using Three.js BoxGeometry with configurable
 * size and material properties.
 *
 * @example
 * ```typescript
 * // Create a unit cube
 * const cube = new Cube();
 *
 * // Create a red cube with side length 2
 * const redCube = new Cube({ sideLength: 2, color: '#ff0000' });
 *
 * // Create a semi-transparent wireframe cube
 * const wireframe = new Cube({
 *   sideLength: 1.5,
 *   wireframe: true,
 *   opacity: 0.7
 * });
 * ```
 */
export class Cube extends Mobject {
  private _sideLength: number;
  private _wireframe: boolean;
  private _centerPoint: Vector3Tuple;

  constructor(options: CubeOptions = {}) {
    super();

    const {
      sideLength = 1,
      center = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      wireframe = false,
    } = options;

    this._sideLength = sideLength;
    this._wireframe = wireframe;
    this._centerPoint = [...center];

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from center
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Create the Three.js box mesh
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.BoxGeometry(
      this._sideLength,
      this._sideLength,
      this._sideLength
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
   * Get the side length
   */
  getSideLength(): number {
    return this._sideLength;
  }

  /**
   * Set the side length
   */
  setSideLength(value: number): this {
    this._sideLength = value;
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry.dispose();
      this._threeObject.geometry = new THREE.BoxGeometry(
        this._sideLength,
        this._sideLength,
        this._sideLength
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
   * Get the surface area of the cube
   */
  getSurfaceArea(): number {
    return 6 * this._sideLength * this._sideLength;
  }

  /**
   * Get the volume of the cube
   */
  getVolume(): number {
    return Math.pow(this._sideLength, 3);
  }

  /**
   * Create a copy of this Cube
   */
  protected override _createCopy(): Cube {
    return new Cube({
      sideLength: this._sideLength,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
    });
  }
}

/**
 * Options for creating a Box3D
 */
export interface Box3DOptions {
  /** Width (x dimension). Default: 1 */
  width?: number;
  /** Height (y dimension). Default: 1 */
  height?: number;
  /** Depth (z dimension). Default: 1 */
  depth?: number;
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
 * Box3D - A 3D box mesh with non-uniform dimensions
 *
 * Creates a box using Three.js BoxGeometry with configurable
 * width, height, depth, and material properties.
 *
 * @example
 * ```typescript
 * // Create a rectangular box
 * const box = new Box3D({ width: 2, height: 1, depth: 3 });
 *
 * // Create a colored box
 * const coloredBox = new Box3D({
 *   width: 1,
 *   height: 2,
 *   depth: 0.5,
 *   color: '#00ff00'
 * });
 * ```
 */
export class Box3D extends Mobject {
  private _width: number;
  private _height: number;
  private _depth: number;
  private _wireframe: boolean;
  private _centerPoint: Vector3Tuple;

  constructor(options: Box3DOptions = {}) {
    super();

    const {
      width = 1,
      height = 1,
      depth = 1,
      center = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      wireframe = false,
    } = options;

    this._width = width;
    this._height = height;
    this._depth = depth;
    this._wireframe = wireframe;
    this._centerPoint = [...center];

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from center
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Create the Three.js box mesh
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.BoxGeometry(
      this._width,
      this._height,
      this._depth
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
   * Get the width
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Set the width
   */
  setWidth(value: number): this {
    this._width = value;
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
   * Get the depth
   */
  getDepth(): number {
    return this._depth;
  }

  /**
   * Set the depth
   */
  setDepth(value: number): this {
    this._depth = value;
    this._updateGeometry();
    return this;
  }

  /**
   * Update the geometry with current dimensions
   */
  private _updateGeometry(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry.dispose();
      this._threeObject.geometry = new THREE.BoxGeometry(
        this._width,
        this._height,
        this._depth
      );
    }
    this._markDirty();
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
   * Get the surface area of the box
   */
  getSurfaceArea(): number {
    return 2 * (
      this._width * this._height +
      this._height * this._depth +
      this._depth * this._width
    );
  }

  /**
   * Get the volume of the box
   */
  getVolume(): number {
    return this._width * this._height * this._depth;
  }

  /**
   * Create a copy of this Box3D
   */
  protected override _createCopy(): Box3D {
    return new Box3D({
      width: this._width,
      height: this._height,
      depth: this._depth,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
    });
  }
}

export default Cube;
