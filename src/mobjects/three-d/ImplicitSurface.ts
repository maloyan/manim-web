import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { meshMaterial } from '../../core/threeMaterial';
import { Mobject3D } from './Mobject3D';
import { marchingCubes, type ScalarField3D } from './marchingCubes';

/**
 * Options for creating an ImplicitSurface.
 */
export interface ImplicitSurfaceOptions {
  /** The scalar field f(x, y, z). The surface is the level set f = isoLevel. */
  func: ScalarField3D;
  /** X range [min, max]. Default: [-2, 2] */
  xRange?: [number, number];
  /** Y range [min, max]. Default: [-2, 2] */
  yRange?: [number, number];
  /** Z range [min, max]. Default: [-2, 2] */
  zRange?: [number, number];
  /** Grid cells per axis for the marching-cubes sampling. Default: 24 */
  resolution?: number;
  /** The iso level of the extracted surface. Default: 0 */
  isoLevel?: number;
  /** Color as CSS color string. Default: '#58c4dd' (Manim blue) */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Render as wireframe. Default: false */
  wireframe?: boolean;
  /** Render both sides. Default: true */
  doubleSided?: boolean;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * ImplicitSurface - the 3D isosurface f(x, y, z) = isoLevel.
 *
 * The surface is built with marching cubes (see {@link marchingCubes}) over a
 * sampled grid, so an arbitrary smooth scalar field can be visualised without a
 * parametrisation. It extends {@link Mobject3D} and reuses the Surface3D
 * material and depth conventions, including the transparent depth prepass from
 * issue #416, so a translucent isosurface occludes itself correctly.
 *
 * @example
 * ```typescript
 * // A unit sphere: x^2 + y^2 + z^2 = 1
 * const sphere = new ImplicitSurface({
 *   func: (x, y, z) => x * x + y * y + z * z,
 *   isoLevel: 1,
 *   resolution: 32,
 * });
 *
 * // A torus implicit surface
 * const torus = new ImplicitSurface({
 *   func: (x, y, z) => {
 *     const q = Math.sqrt(x * x + y * y) - 1;
 *     return q * q + z * z;
 *   },
 *   isoLevel: 0.09,
 *   opacity: 0.6,
 * });
 * ```
 */
export class ImplicitSurface extends Mobject3D {
  private _func: ScalarField3D;
  private _xRange: [number, number];
  private _yRange: [number, number];
  private _zRange: [number, number];
  private _resolution: number;
  private _isoLevel: number;
  private _wireframe: boolean;
  private _doubleSided: boolean;
  private _centerPoint: Vector3Tuple;
  private _positions: Float32Array;
  private _triangleCount: number;

  constructor(options: ImplicitSurfaceOptions) {
    super();

    const {
      func,
      xRange = [-2, 2],
      yRange = [-2, 2],
      zRange = [-2, 2],
      resolution = 24,
      isoLevel = 0,
      color = '#58c4dd',
      opacity = 1,
      wireframe = false,
      doubleSided = true,
      center = [0, 0, 0],
    } = options;

    this._func = func;
    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._zRange = [...zRange];
    this._resolution = resolution;
    this._isoLevel = isoLevel;
    this._wireframe = wireframe;
    this._doubleSided = doubleSided;
    this._centerPoint = [...center];
    this._positions = new Float32Array(0);
    this._triangleCount = 0;

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;
    this.position.set(center[0], center[1], center[2]);

    this._computeSurface();
  }

  /** Run marching cubes and cache the resulting triangle soup. */
  private _computeSurface(): void {
    const result = marchingCubes({
      field: this._func,
      xRange: this._xRange,
      yRange: this._yRange,
      zRange: this._zRange,
      resolution: this._resolution,
      isoLevel: this._isoLevel,
    });
    this._positions = result.positions;
    this._triangleCount = result.triangleCount;
  }

  /** Build an indexed-free BufferGeometry with smooth normals from the cache. */
  private _buildGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  /**
   * The depth prepass only helps a translucent solid. An opaque surface
   * already writes depth, a wireframe must stay visible, and a faded-out
   * surface must not depth-block other transparent objects.
   */
  private _prepassEnabled(): boolean {
    return !this._wireframe && this._opacity > 0 && this._opacity < 1;
  }

  /** Enable or disable the prepass; disabled means skipped by the renderer. */
  private _applyPrepassState(prepassMaterial: THREE.Material): void {
    const enabled = this._prepassEnabled();
    prepassMaterial.depthWrite = enabled;
    prepassMaterial.visible = enabled;
  }

  /** Find the depth-prepass child mesh, if this surface has one. */
  private _getPrepassMesh(): THREE.Mesh | null {
    const mesh = this.getMesh();
    if (!mesh) return null;
    const prepass = mesh.children.find(
      (c): c is THREE.Mesh => c instanceof THREE.Mesh && !!meshMaterial(c).userData.depthPrepass,
    );
    return prepass ?? null;
  }

  /**
   * Create the Three.js mesh. A transparent surface renders in two passes to
   * fix self-occlusion (issue #416): a depth-only prepass writes the front-most
   * layer, then the color pass depth-tests against it. The prepass mesh is
   * created before the color mesh so its lower object.id wins three.js'
   * reversePainterSortStable tiebreak and draws first.
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = this._buildGeometry();
    const side = this._doubleSided ? THREE.DoubleSide : THREE.FrontSide;

    const prepassMaterial = new THREE.MeshBasicMaterial({
      colorWrite: false,
      transparent: true,
      side,
    });
    this._applyPrepassState(prepassMaterial);
    prepassMaterial.userData.depthPrepass = true;
    const prepassMesh = new THREE.Mesh(geometry, prepassMaterial);
    prepassMesh.raycast = () => {}; // depth-only helper; picking sees the color mesh only

    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      depthWrite: this._opacity >= 1,
      wireframe: this._wireframe,
      side,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.add(prepassMesh);
    return mesh;
  }

  /** Sync material properties to the Three.js object. */
  protected override _syncMaterialToThree(): void {
    const material = this.getMeshMaterial<THREE.MeshStandardMaterial>();
    if (material) {
      material.color.set(this.color);
      material.opacity = this._opacity;
      material.transparent = this._opacity < 1;
      material.depthWrite = this._opacity >= 1;
      material.wireframe = this._wireframe;
      material.side = this._doubleSided ? THREE.DoubleSide : THREE.FrontSide;
      material.needsUpdate = true;
    }
    const prepass = this._getPrepassMesh();
    if (prepass) {
      const prepassMaterial = meshMaterial(prepass);
      prepassMaterial.side = this._doubleSided ? THREE.DoubleSide : THREE.FrontSide;
      this._applyPrepassState(prepassMaterial);
    }
  }

  /** Recompute the surface and rebind the geometry on both meshes. */
  private _updateGeometry(): void {
    this._computeSurface();
    if (this._threeObject instanceof THREE.Mesh) {
      const oldGeometry = this._threeObject.geometry;
      const geometry = this._buildGeometry();
      this._threeObject.geometry = geometry;
      const prepass = this._getPrepassMesh();
      if (prepass) prepass.geometry = geometry;
      oldGeometry.dispose();
    }
    this._markDirty();
  }

  /** The flat vertex positions of the surface triangles. */
  getPositions(): Float32Array {
    return this._positions;
  }

  /** The number of triangles in the surface. */
  getTriangleCount(): number {
    return this._triangleCount;
  }

  /** Get the scalar field. */
  getFunc(): ScalarField3D {
    return this._func;
  }

  /** Set a new scalar field and rebuild the surface. */
  setFunc(func: ScalarField3D): this {
    this._func = func;
    this._updateGeometry();
    return this;
  }

  /** Get the iso level. */
  getIsoLevel(): number {
    return this._isoLevel;
  }

  /** Set the iso level and rebuild the surface. */
  setIsoLevel(isoLevel: number): this {
    this._isoLevel = isoLevel;
    this._updateGeometry();
    return this;
  }

  /** Get the grid resolution. */
  getResolution(): number {
    return this._resolution;
  }

  /** Set the grid resolution and rebuild the surface. */
  setResolution(resolution: number): this {
    this._resolution = resolution;
    this._updateGeometry();
    return this;
  }

  /** Whether wireframe mode is enabled. */
  isWireframe(): boolean {
    return this._wireframe;
  }

  /** Set wireframe mode. */
  setWireframe(value: boolean): this {
    this._wireframe = value;
    this._markDirty();
    return this;
  }

  override copy(): ImplicitSurface {
    const copy = new ImplicitSurface({
      func: this._func,
      xRange: this._xRange,
      yRange: this._yRange,
      zRange: this._zRange,
      resolution: this._resolution,
      isoLevel: this._isoLevel,
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
      doubleSided: this._doubleSided,
      center: [...this._centerPoint],
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
