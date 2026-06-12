import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { Vector3Tuple } from '../../core/Mobject';
import { Mobject3D } from './Mobject3D';

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
  /** Two alternating colors for a checkerboard pattern on the surface, e.g. ['#E65A4C', '#CF5044']. */
  checkerboardColors?: [string, string];
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
export class Surface3D extends Mobject3D {
  protected _func: (u: number, v: number) => Vector3Tuple;
  protected _uRange: [number, number];
  protected _vRange: [number, number];
  protected _uResolution: number;
  protected _vResolution: number;
  protected _wireframe: boolean;
  protected _doubleSided: boolean;
  protected _centerPoint: Vector3Tuple;
  protected _checkerboardColors?: [string, string];

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
      checkerboardColors,
    } = options;

    this._func = func;
    this._uRange = [...uRange];
    this._vRange = [...vRange];
    this._uResolution = uResolution;
    this._vResolution = vResolution;
    this._wireframe = wireframe;
    this._doubleSided = doubleSided;
    this._centerPoint = [...center];
    this._checkerboardColors = checkerboardColors;

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;

    // Set position from center
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Build the surface geometry (indexed, or non-indexed with vertex
   * colors when checkerboardColors is set).
   */
  private _buildGeometry(): THREE.BufferGeometry {
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

    const geometry = new ParametricGeometry(paramFunc, this._uResolution, this._vResolution);

    // Compute normals for proper lighting
    geometry.computeVertexNormals();

    if (!this._checkerboardColors) return geometry;

    // Convert to non-indexed so each face can have its own vertex colors.
    // Smooth normals from the indexed geometry are preserved by toNonIndexed().
    const nonIndexed = geometry.toNonIndexed();
    geometry.dispose();

    const posAttr = nonIndexed.getAttribute('position');
    const colors = new Float32Array(posAttr.count * 3);
    const c1 = new THREE.Color(this._checkerboardColors[0]);
    const c2 = new THREE.Color(this._checkerboardColors[1]);

    // Each quad = 2 triangles = 6 vertices
    // Quads go u-major: for each v row, iterate u cols
    let vertexIdx = 0;
    for (let vi = 0; vi < this._vResolution; vi++) {
      for (let ui = 0; ui < this._uResolution; ui++) {
        const c = (ui + vi) % 2 === 0 ? c1 : c2;
        // 2 triangles per quad = 6 vertices
        for (let k = 0; k < 6; k++) {
          colors[vertexIdx * 3] = c.r;
          colors[vertexIdx * 3 + 1] = c.g;
          colors[vertexIdx * 3 + 2] = c.b;
          vertexIdx++;
        }
      }
    }

    nonIndexed.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return nonIndexed;
  }

  /**
   * The depth prepass only helps while the surface is shaded as a
   * translucent solid: opaque surfaces already write depth in the
   * opaque pass, a wireframe must not be occluded by an invisible solid
   * prepass, and a fully faded-out surface must not depth-block other
   * transparent objects (e.g. during FadeOut).
   */
  private _prepassEnabled(): boolean {
    return !this._wireframe && this._opacity > 0 && this._opacity < 1;
  }

  /** Enable/disable the prepass; disabled means skipped entirely by the renderer. */
  private _applyPrepassState(prepassMaterial: THREE.Material): void {
    const enabled = this._prepassEnabled();
    prepassMaterial.depthWrite = enabled;
    prepassMaterial.visible = enabled;
  }

  /** Find the depth-prepass child mesh, if this surface has one. */
  private _getPrepassMesh(): THREE.Mesh | null {
    if (!(this._threeObject instanceof THREE.Mesh)) return null;
    const prepass = this._threeObject.children.find(
      (c) =>
        (c as THREE.Mesh).isMesh &&
        ((c as THREE.Mesh).material as THREE.Material).userData.depthPrepass,
    );
    return (prepass as THREE.Mesh) ?? null;
  }

  /**
   * Create the Three.js parametric surface mesh.
   *
   * A transparent surface is rendered in two passes to fix
   * self-occlusion (issue #416): a depth-only prepass writes the
   * front-most layer into the depth buffer, then the color pass
   * (depthWrite=false per issue #255) depth-tests against it, so e.g. a
   * bell curve always occludes the flat region behind it. The prepass
   * mesh is created BEFORE the color mesh: with equal renderOrder and
   * projected z, three.js' transparent sort tiebreaks on object.id
   * (reversePainterSortStable — an internal invariant, verified at three
   * r0.184 and pinned by tests), so the lower id is guaranteed to draw
   * first. It stays `transparent` so it renders after all opaque
   * objects, which therefore remain visible through the translucent
   * surface.
   *
   * Trade-off: while the prepass is active, another transparent mobject
   * that three.js sorts after this surface gets its fragments behind
   * the surface depth-rejected rather than blended — the surface
   * behaves as a solid translucent layer, not a stack of blendable
   * sheets.
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
    prepassMesh.raycast = () => {}; // depth-only helper; picking must only see the color mesh

    const material = new THREE.MeshStandardMaterial({
      ...(this._checkerboardColors ? { vertexColors: true } : { color: this.color }),
      opacity: this._opacity,
      transparent: this._opacity < 1,
      wireframe: this._wireframe,
      side,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.add(prepassMesh);
    return mesh;
  }

  /**
   * Sync material properties to Three.js object
   */
  protected override _syncMaterialToThree(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      const material = this._threeObject.material as THREE.MeshStandardMaterial;
      if (material) {
        if (!this._checkerboardColors) {
          material.color.set(this.color);
        }
        material.vertexColors = !!this._checkerboardColors;
        material.opacity = this._opacity;
        material.transparent = this._opacity < 1;
        // Also managed by ThreeDScene's depth settings, but Transform
        // targets (FadeMorphStrategy) sync outside any scene and must
        // not depth-block other transparents while translucent.
        material.depthWrite = this._opacity >= 1;
        material.wireframe = this._wireframe;
        material.side = this._doubleSided ? THREE.DoubleSide : THREE.FrontSide;
        material.needsUpdate = true;
      }
      const prepass = this._getPrepassMesh();
      if (prepass) {
        const prepassMaterial = prepass.material as THREE.Material;
        prepassMaterial.side = this._doubleSided ? THREE.DoubleSide : THREE.FrontSide;
        this._applyPrepassState(prepassMaterial);
      }
    }
  }

  /**
   * Update the geometry with current function and parameters
   */
  protected _updateGeometry(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      const oldGeometry = this._threeObject.geometry;
      const geometry = this._buildGeometry();

      // The prepass child shares the geometry, so rebind both before
      // disposing the old one.
      this._threeObject.geometry = geometry;
      const prepass = this._getPrepassMesh();
      if (prepass) prepass.geometry = geometry;
      oldGeometry.dispose();

      if (this._checkerboardColors) {
        const material = this._threeObject.material as THREE.MeshStandardMaterial;
        if (material) {
          material.vertexColors = true;
          material.needsUpdate = true;
        }
      }
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
    return [x + this.position.x, y + this.position.y, z + this.position.z];
  }

  /**
   * Create a copy of this Surface3D
   */
  override copy(): Surface3D {
    const copy = new Surface3D({
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
      checkerboardColors: this._checkerboardColors,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
