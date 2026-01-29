import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Base options for all polyhedra
 */
export interface PolyhedronOptions {
  /** Side length of the polyhedron. Default: 1 */
  sideLength?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Whether to render as wireframe. Default: false */
  wireframe?: boolean;
  /** Level of detail (subdivision level). Default: 0 */
  detail?: number;
}

/**
 * Polyhedron - Base class for all platonic solids
 *
 * Provides common functionality for polyhedra including side length,
 * wireframe mode, and material properties.
 *
 * @example
 * ```typescript
 * // Subclasses should be used directly:
 * const tetra = new Tetrahedron({ sideLength: 2, color: '#ff0000' });
 * ```
 */
export abstract class Polyhedron extends Mobject {
  protected _sideLength: number;
  protected _wireframe: boolean;
  protected _centerPoint: Vector3Tuple;
  protected _detail: number;

  constructor(options: PolyhedronOptions = {}) {
    super();

    const {
      sideLength = 1,
      center = [0, 0, 0],
      color = '#ffffff',
      opacity = 1,
      wireframe = false,
      detail = 0,
    } = options;

    this._sideLength = sideLength;
    this._wireframe = wireframe;
    this._centerPoint = [...center];
    this._detail = detail;

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from center
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Get the radius for Three.js geometry based on side length.
   * Subclasses override this to provide correct conversion.
   */
  protected abstract _getRadiusFromSideLength(): number;

  /**
   * Create the Three.js geometry for this polyhedron.
   * Subclasses must implement this.
   */
  protected abstract _createGeometry(): THREE.BufferGeometry;

  /**
   * Create the Three.js mesh
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = this._createGeometry();

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
      this._threeObject.geometry = this._createGeometry();
    }
    this._markDirty();
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
   * Get the detail level
   */
  getDetail(): number {
    return this._detail;
  }

  /**
   * Set the detail level (subdivision)
   */
  setDetail(value: number): this {
    this._detail = Math.max(0, Math.floor(value));
    this._updateGeometry();
    return this;
  }

  /**
   * Get the number of faces for this polyhedron
   */
  abstract getFaceCount(): number;

  /**
   * Get the number of vertices for this polyhedron
   */
  abstract getVertexCount(): number;

  /**
   * Get the number of edges for this polyhedron
   */
  abstract getEdgeCount(): number;
}

/**
 * Options for creating a Tetrahedron
 */
export interface TetrahedronOptions extends PolyhedronOptions {}

/**
 * Tetrahedron - A 4-faced triangular pyramid (platonic solid)
 *
 * Creates a tetrahedron using Three.js TetrahedronGeometry with configurable
 * size and material properties.
 *
 * @example
 * ```typescript
 * // Create a unit tetrahedron
 * const tetra = new Tetrahedron();
 *
 * // Create a red tetrahedron with side length 2
 * const redTetra = new Tetrahedron({ sideLength: 2, color: '#ff0000' });
 *
 * // Create a wireframe tetrahedron
 * const wireframe = new Tetrahedron({ sideLength: 1.5, wireframe: true });
 * ```
 */
export class Tetrahedron extends Polyhedron {
  /**
   * Convert side length to circumradius for Three.js TetrahedronGeometry.
   * For a tetrahedron: circumradius = sideLength * sqrt(6) / 4
   */
  protected _getRadiusFromSideLength(): number {
    return this._sideLength * Math.sqrt(6) / 4;
  }

  protected _createGeometry(): THREE.BufferGeometry {
    const radius = this._getRadiusFromSideLength();
    return new THREE.TetrahedronGeometry(radius, this._detail);
  }

  getFaceCount(): number {
    return 4;
  }

  getVertexCount(): number {
    return 4;
  }

  getEdgeCount(): number {
    return 6;
  }

  /**
   * Get the surface area of the tetrahedron
   */
  getSurfaceArea(): number {
    return Math.sqrt(3) * this._sideLength * this._sideLength;
  }

  /**
   * Get the volume of the tetrahedron
   */
  getVolume(): number {
    return (Math.sqrt(2) / 12) * Math.pow(this._sideLength, 3);
  }

  protected override _createCopy(): Tetrahedron {
    return new Tetrahedron({
      sideLength: this._sideLength,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
      detail: this._detail,
    });
  }
}

/**
 * Options for creating an Octahedron
 */
export interface OctahedronOptions extends PolyhedronOptions {}

/**
 * Octahedron - An 8-faced polyhedron (platonic solid)
 *
 * Creates an octahedron using Three.js OctahedronGeometry with configurable
 * size and material properties. Essentially two square pyramids base-to-base.
 *
 * @example
 * ```typescript
 * // Create a unit octahedron
 * const octa = new Octahedron();
 *
 * // Create a blue octahedron with side length 2
 * const blueOcta = new Octahedron({ sideLength: 2, color: '#0000ff' });
 *
 * // Create a semi-transparent octahedron
 * const transparent = new Octahedron({ sideLength: 1.5, opacity: 0.5 });
 * ```
 */
export class Octahedron extends Polyhedron {
  /**
   * Convert side length to circumradius for Three.js OctahedronGeometry.
   * For an octahedron: circumradius = sideLength / sqrt(2)
   */
  protected _getRadiusFromSideLength(): number {
    return this._sideLength / Math.sqrt(2);
  }

  protected _createGeometry(): THREE.BufferGeometry {
    const radius = this._getRadiusFromSideLength();
    return new THREE.OctahedronGeometry(radius, this._detail);
  }

  getFaceCount(): number {
    return 8;
  }

  getVertexCount(): number {
    return 6;
  }

  getEdgeCount(): number {
    return 12;
  }

  /**
   * Get the surface area of the octahedron
   */
  getSurfaceArea(): number {
    return 2 * Math.sqrt(3) * this._sideLength * this._sideLength;
  }

  /**
   * Get the volume of the octahedron
   */
  getVolume(): number {
    return (Math.sqrt(2) / 3) * Math.pow(this._sideLength, 3);
  }

  protected override _createCopy(): Octahedron {
    return new Octahedron({
      sideLength: this._sideLength,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
      detail: this._detail,
    });
  }
}

/**
 * Options for creating an Icosahedron
 */
export interface IcosahedronOptions extends PolyhedronOptions {}

/**
 * Icosahedron - A 20-faced polyhedron (platonic solid)
 *
 * Creates an icosahedron using Three.js IcosahedronGeometry with configurable
 * size and material properties. All faces are equilateral triangles.
 *
 * @example
 * ```typescript
 * // Create a unit icosahedron
 * const icosa = new Icosahedron();
 *
 * // Create a green icosahedron with side length 2
 * const greenIcosa = new Icosahedron({ sideLength: 2, color: '#00ff00' });
 *
 * // Create a subdivided icosahedron (closer to a sphere)
 * const smooth = new Icosahedron({ sideLength: 1, detail: 2 });
 * ```
 */
export class Icosahedron extends Polyhedron {
  /**
   * Convert side length to circumradius for Three.js IcosahedronGeometry.
   * For an icosahedron: circumradius = sideLength * sqrt(10 + 2*sqrt(5)) / 4
   */
  protected _getRadiusFromSideLength(): number {
    return this._sideLength * Math.sqrt(10 + 2 * Math.sqrt(5)) / 4;
  }

  protected _createGeometry(): THREE.BufferGeometry {
    const radius = this._getRadiusFromSideLength();
    return new THREE.IcosahedronGeometry(radius, this._detail);
  }

  getFaceCount(): number {
    return 20;
  }

  getVertexCount(): number {
    return 12;
  }

  getEdgeCount(): number {
    return 30;
  }

  /**
   * Get the surface area of the icosahedron
   */
  getSurfaceArea(): number {
    return 5 * Math.sqrt(3) * this._sideLength * this._sideLength;
  }

  /**
   * Get the volume of the icosahedron
   */
  getVolume(): number {
    return (5 / 12) * (3 + Math.sqrt(5)) * Math.pow(this._sideLength, 3);
  }

  protected override _createCopy(): Icosahedron {
    return new Icosahedron({
      sideLength: this._sideLength,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
      detail: this._detail,
    });
  }
}

/**
 * Options for creating a Dodecahedron
 */
export interface DodecahedronOptions extends PolyhedronOptions {}

/**
 * Dodecahedron - A 12-faced polyhedron (platonic solid)
 *
 * Creates a dodecahedron using Three.js DodecahedronGeometry with configurable
 * size and material properties. All faces are regular pentagons.
 *
 * @example
 * ```typescript
 * // Create a unit dodecahedron
 * const dodeca = new Dodecahedron();
 *
 * // Create a purple dodecahedron with side length 2
 * const purpleDodeca = new Dodecahedron({ sideLength: 2, color: '#800080' });
 *
 * // Create a wireframe dodecahedron
 * const wireframe = new Dodecahedron({ sideLength: 1.5, wireframe: true });
 * ```
 */
export class Dodecahedron extends Polyhedron {
  /**
   * Convert side length to circumradius for Three.js DodecahedronGeometry.
   * For a dodecahedron: circumradius = sideLength * phi * sqrt(3) / 2
   * where phi = (1 + sqrt(5)) / 2 (golden ratio)
   */
  protected _getRadiusFromSideLength(): number {
    const phi = (1 + Math.sqrt(5)) / 2;
    return this._sideLength * phi * Math.sqrt(3) / 2;
  }

  protected _createGeometry(): THREE.BufferGeometry {
    const radius = this._getRadiusFromSideLength();
    return new THREE.DodecahedronGeometry(radius, this._detail);
  }

  getFaceCount(): number {
    return 12;
  }

  getVertexCount(): number {
    return 20;
  }

  getEdgeCount(): number {
    return 30;
  }

  /**
   * Get the surface area of the dodecahedron
   */
  getSurfaceArea(): number {
    return 3 * Math.sqrt(25 + 10 * Math.sqrt(5)) * this._sideLength * this._sideLength;
  }

  /**
   * Get the volume of the dodecahedron
   */
  getVolume(): number {
    return (1 / 4) * (15 + 7 * Math.sqrt(5)) * Math.pow(this._sideLength, 3);
  }

  protected override _createCopy(): Dodecahedron {
    return new Dodecahedron({
      sideLength: this._sideLength,
      center: this._centerPoint,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
      detail: this._detail,
    });
  }
}

export default Polyhedron;
