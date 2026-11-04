import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { Mobject3D } from '../three-d/Mobject3D';
import { VIRIDIS, valueToColor } from './colormap';

/** A 2D scalar field g(x, y). */
export type ScalarField2D = (x: number, y: number) => number;

/**
 * Options for creating a HeatMap.
 */
export interface HeatMapOptions {
  /** The scalar field g(x, y) to visualize. */
  func: ScalarField2D;
  /** X range [min, max]. Default: [-5, 5] */
  xRange?: [number, number];
  /** Y range [min, max]. Default: [-5, 5] */
  yRange?: [number, number];
  /** Grid cells per axis, or [nx, ny]. Default: 64 */
  resolution?: number | [number, number];
  /** Value domain [min, max] mapped across the palette. Auto-computed if omitted. */
  domain?: [number, number];
  /** Ordered hex color stops. Default: a viridis-like palette. */
  palette?: readonly string[];
  /** Blend the palette in perceptually-uniform Oklab space. Default: false */
  useOklab?: boolean;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * HeatMap - a colored plane that encodes a 2D scalar field g(x, y).
 *
 * The region is sampled on a regular grid and rendered as a flat mesh in the
 * z = 0 plane. Each grid vertex is colored by its field value through a color
 * map (see `colormap`), and the GPU interpolates the color across each cell,
 * so the plane shows a smooth heat gradient. The value domain is taken from the
 * sampled minimum and maximum unless an explicit `domain` is given.
 *
 * @example
 * ```typescript
 * // A 2D Gaussian bump
 * const heat = new HeatMap({
 *   func: (x, y) => Math.exp(-(x * x + y * y) / 4),
 *   xRange: [-3, 3],
 *   yRange: [-3, 3],
 *   domain: [0, 1],
 * });
 * ```
 */
export class HeatMap extends Mobject3D {
  private _func: ScalarField2D;
  private _xRange: [number, number];
  private _yRange: [number, number];
  private _nx: number;
  private _ny: number;
  private _palette: readonly string[];
  private _useOklab: boolean;
  private _centerPoint: Vector3Tuple;
  private _domain: [number, number];
  private _domainExplicit: boolean;

  constructor(options: HeatMapOptions) {
    super();

    const {
      func,
      xRange = [-5, 5],
      yRange = [-5, 5],
      resolution = 64,
      domain,
      palette = VIRIDIS,
      useOklab = false,
      opacity = 1,
      center = [0, 0, 0],
    } = options;

    const [nx, ny] = Array.isArray(resolution) ? resolution : [resolution, resolution];
    this._func = func;
    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._nx = Math.max(1, Math.floor(nx));
    this._ny = Math.max(1, Math.floor(ny));
    this._palette = [...palette];
    this._useOklab = useOklab;
    this._centerPoint = [...center];
    this._domainExplicit = domain !== undefined;
    this._domain = domain ? [...domain] : this._autoDomain();

    this._opacity = opacity;
    this.fillOpacity = opacity;
    this.position.set(center[0], center[1], center[2]);
  }

  /** The x coordinate of grid column `ix`. */
  private _coordX(ix: number): number {
    const [xMin, xMax] = this._xRange;
    return xMin + (ix / this._nx) * (xMax - xMin);
  }

  /** The y coordinate of grid row `iy`. */
  private _coordY(iy: number): number {
    const [yMin, yMax] = this._yRange;
    return yMin + (iy / this._ny) * (yMax - yMin);
  }

  /** Scan the grid for the value range when no explicit domain is given. */
  private _autoDomain(): [number, number] {
    let min = Infinity;
    let max = -Infinity;
    for (let iy = 0; iy <= this._ny; iy++) {
      for (let ix = 0; ix <= this._nx; ix++) {
        const v = this._func(this._coordX(ix), this._coordY(iy));
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    // A constant field has no span; widen it so every value maps to one color.
    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
      return [
        min === max && Number.isFinite(min) ? min : 0,
        min === max && Number.isFinite(min) ? min : 1,
      ];
    }
    return [min, max];
  }

  /** Build the indexed plane geometry with a per-vertex color attribute. */
  private _buildGeometry(): THREE.BufferGeometry {
    const cols = this._nx + 1;
    const rows = this._ny + 1;
    const vertexCount = cols * rows;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const [dMin, dMax] = this._domain;
    // The palette color is sRGB. Convert it to the renderer's working space, so
    // three.js color management does not show the sRGB value too bright. Writing
    // the sRGB value raw turns the dark viridis low end into bright magenta.
    const work = new THREE.Color();

    for (let iy = 0; iy < rows; iy++) {
      const y = this._coordY(iy);
      for (let ix = 0; ix < cols; ix++) {
        const x = this._coordX(ix);
        const idx = iy * cols + ix;
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = 0;
        const hex = valueToColor(this._func(x, y), dMin, dMax, this._palette, this._useOklab);
        work.set(hex);
        colors[idx * 3] = work.r;
        colors[idx * 3 + 1] = work.g;
        colors[idx * 3 + 2] = work.b;
      }
    }

    const indices: number[] = [];
    for (let iy = 0; iy < this._ny; iy++) {
      for (let ix = 0; ix < this._nx; ix++) {
        const a = iy * cols + ix;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        indices.push(a, b, d, a, d, c);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  protected _createThreeObject(): THREE.Object3D {
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      side: THREE.DoubleSide,
      // Flat mesh: draw both faces in one pass. Otherwise three.js renders a
      // transparent DoubleSide material twice and re-resolves its program per frame.
      forceSinglePass: true,
    });
    return new THREE.Mesh(this._buildGeometry(), material);
  }

  protected override _syncMaterialToThree(): void {
    const material = this.getMeshMaterial<THREE.MeshBasicMaterial>();
    if (material) {
      material.vertexColors = true;
      material.opacity = this._opacity;
      material.transparent = this._opacity < 1;
      material.needsUpdate = true;
    }
  }

  /** Rebuild the geometry after the field, domain, or palette changes. */
  private _updateGeometry(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      const oldGeometry = this._threeObject.geometry;
      this._threeObject.geometry = this._buildGeometry();
      oldGeometry.dispose();
    }
    this._markDirty();
  }

  /** The color (hex) that the map assigns to the field at (x, y). */
  colorAt(x: number, y: number): string {
    const [dMin, dMax] = this._domain;
    return valueToColor(this._func(x, y), dMin, dMax, this._palette, this._useOklab);
  }

  /** The value domain [min, max] mapped across the palette. */
  getDomain(): [number, number] {
    return [...this._domain];
  }

  /** Set the value domain and rebuild. */
  setDomain(domain: [number, number]): this {
    this._domain = [...domain];
    this._domainExplicit = true;
    this._updateGeometry();
    return this;
  }

  /** Get the scalar field. */
  getFunc(): ScalarField2D {
    return this._func;
  }

  /** Set the scalar field and rebuild. Recomputes an auto domain if in use. */
  setFunc(func: ScalarField2D): this {
    this._func = func;
    if (!this._domainExplicit) this._domain = this._autoDomain();
    this._updateGeometry();
    return this;
  }

  override copy(): HeatMap {
    const copy = new HeatMap({
      func: this._func,
      xRange: this._xRange,
      yRange: this._yRange,
      resolution: [this._nx, this._ny],
      domain: this._domainExplicit ? [...this._domain] : undefined,
      palette: [...this._palette],
      useOklab: this._useOklab,
      opacity: this._opacity,
      center: [...this._centerPoint],
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
