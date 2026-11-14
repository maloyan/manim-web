import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { mulberry32 } from '../../utils/ManimColor';
import { dotVec, normalizeVec } from '../../utils/vectors';
import {
  finishGeometry,
  OrganicMesh3D,
  requireNumber,
  type OrganicMeshOptions,
} from './organicMesh';

/**
 * Options for creating a Blob3D.
 */
export interface Blob3DOptions extends OrganicMeshOptions {
  /** Base radius before the lumps. Default: 1 */
  radius?: number;
  /** Largest radial bump as a fraction of the radius (0 = sphere). Default: 0.25 */
  lumpiness?: number;
  /** Number of seeded round lobes that bulge out. Default: 6 */
  lobes?: number;
  /** Angular width of one lobe in radians (smaller = tighter bumps). Default: 0.6 */
  lobeSize?: number;
  /** Weight of the low-frequency wobble added on top of the lobes (0..1). Default: 0.35 */
  wobble?: number;
  /** Seed for the deterministic shape. Default: 1 */
  seed?: number;
  /** Icosphere subdivision level (triangles = 20 * 4^detail). Default: 4 */
  detail?: number;
  /** Per-axis scale [x, y, z] applied after the lumps (flatten, stretch). Default: [1, 1, 1] */
  scale?: Vector3Tuple;
}

const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSA_VERTICES: Vector3Tuple[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];
const ICOSA_FACES: [number, number, number][] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

/**
 * Build an indexed unit icosphere: shared vertices, outward CCW winding.
 * @post result.faces.length === 20 * 4 ** detail
 */
export function icosphere(detail: number): { vertices: Vector3Tuple[]; faces: number[][] } {
  const vertices = ICOSA_VERTICES.map((v) => normalizeVec(v));
  let faces: number[][] = ICOSA_FACES.map((f) => [...f]);
  for (let level = 0; level < detail; level++) {
    const cache = new Map<string, number>();
    const mid = (a: number, b: number): number => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const va = vertices[a];
      const vb = vertices[b];
      vertices.push(normalizeVec([va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]]));
      cache.set(key, vertices.length - 1);
      return vertices.length - 1;
    };
    const next: number[][] = [];
    for (const [a, b, c] of faces) {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }
  return { vertices, faces };
}

/**
 * Blob3D - a lumpy closed shape: a sphere displaced by seeded smooth bumps.
 *
 * The bumps are a union of round lobes at seeded directions plus a soft
 * low-frequency wobble. The same seed always gives the same mesh. The mesh is
 * a subdivided icosphere, so it is watertight and its normals are smooth.
 * Principal axis for the build-up reveal: local +Z (bottom to top).
 * Use it for a nucleolus (many tight lobes), ribosome subunits (few lobes,
 * flattened with `scale`), irregular vesicles and pebbles.
 *
 * @example
 * ```typescript
 * const nucleolus = new Blob3D({ radius: 0.5, lobes: 14, lobeSize: 0.45, seed: 7 });
 * const subunit = new Blob3D({ radius: 0.3, lobes: 3, scale: [1.3, 1, 0.8], seed: 2 });
 * ```
 */
export class Blob3D extends OrganicMesh3D {
  private _radius: number;
  private _lumpiness: number;
  private _lobes: number;
  private _lobeSize: number;
  private _wobble: number;
  private _seed: number;
  private _detail: number;
  private _scale: Vector3Tuple;

  constructor(options: Blob3DOptions = {}) {
    super(options, '#C55F73');
    const {
      radius = 1,
      lumpiness = 0.25,
      lobes = 6,
      lobeSize = 0.6,
      wobble = 0.35,
      seed = 1,
      detail = 4,
      scale = [1, 1, 1],
    } = options;
    requireNumber('Blob3D', 'radius', radius, 0);
    requireNumber('Blob3D', 'lumpiness', lumpiness);
    requireNumber('Blob3D', 'lobeSize', lobeSize);
    requireNumber('Blob3D', 'wobble', wobble);
    scale.forEach((v, i) => requireNumber('Blob3D', `scale[${i}]`, v, 0, true));
    this._radius = radius;
    this._lumpiness = lumpiness;
    this._lobes = Math.max(0, Math.floor(lobes));
    this._lobeSize = Math.max(1e-3, lobeSize);
    this._wobble = wobble;
    this._seed = seed;
    this._detail = Math.max(0, Math.min(7, Math.floor(detail)));
    this._scale = [...scale];
  }

  /** The seeded radial bump field f(u) on the unit sphere, roughly in [-1, 1]. */
  private _field(): (u: Vector3Tuple) => number {
    const rng = mulberry32(this._seed);
    const randomDir = (): Vector3Tuple => {
      // Uniform direction on the sphere.
      const z = 2 * rng() - 1;
      const a = 2 * Math.PI * rng();
      const s = Math.sqrt(1 - z * z);
      return [s * Math.cos(a), s * Math.sin(a), z];
    };
    const lobes = Array.from({ length: this._lobes }, () => ({
      dir: randomDir(),
      weight: 0.5 + 0.5 * rng(),
    }));
    const waves = Array.from({ length: 5 }, () => ({
      dir: randomDir(),
      freq: 1.5 + 2 * rng(),
      phase: 2 * Math.PI * rng(),
      amp: 0.5 + 0.5 * rng(),
    }));
    const width2 = this._lobeSize * this._lobeSize;
    const wobble = this._wobble;
    return (u) => {
      let lobe = 0;
      for (const l of lobes) {
        // 1 - cos(angle) ~ angle^2 / 2, so this is a Gaussian in the angle.
        const k = Math.exp((2 * (dotVec(u, l.dir) - 1)) / width2);
        lobe = Math.max(lobe, l.weight * k);
      }
      let wave = 0;
      for (const w of waves) wave += w.amp * Math.sin(w.freq * dotVec(u, w.dir) + w.phase);
      return (lobes.length > 0 ? 2 * lobe - 1 : 0) + (wobble * wave) / waves.length;
    };
  }

  protected _buildGeometry(): THREE.BufferGeometry {
    const { vertices, faces } = icosphere(this._detail);
    const field = this._field();
    const values = vertices.map(field);
    let maxAbs = 1e-9;
    for (const v of values) maxAbs = Math.max(maxAbs, Math.abs(v));
    const positions = new Float32Array(vertices.length * 3);
    vertices.forEach((u, i) => {
      const r = this._radius * (1 + (this._lumpiness * values[i]) / maxAbs);
      positions[3 * i] = u[0] * r * this._scale[0];
      positions[3 * i + 1] = u[1] * r * this._scale[1];
      positions[3 * i + 2] = u[2] * r * this._scale[2];
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(faces.flat());
    geometry.computeVertexNormals();
    finishGeometry(geometry, [0, 0, 1]);
    return geometry;
  }

  /** The seed of the shape. */
  getSeed(): number {
    return this._seed;
  }

  /** Set a new seed and rebuild the mesh. */
  setSeed(seed: number): this {
    this._seed = seed;
    this._rebuild();
    return this;
  }

  /** The base radius. */
  getRadius(): number {
    return this._radius;
  }

  override copy(): Blob3D {
    const copy = new Blob3D({
      radius: this._radius,
      lumpiness: this._lumpiness,
      lobes: this._lobes,
      lobeSize: this._lobeSize,
      wobble: this._wobble,
      seed: this._seed,
      detail: this._detail,
      scale: this._scale,
      color: this.color,
      opacity: this._opacity,
      center: this._centerPoint,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
