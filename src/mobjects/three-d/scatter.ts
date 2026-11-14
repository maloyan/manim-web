import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { mulberry32 } from '../../utils/ManimColor';
import { lengthVec, normalizeVec, subVec } from '../../utils/vectors';
import { icosphere } from './Blob3D';
import type { InstanceTransform } from './InstancedMobject';
import { finishGeometry } from './organicMesh';
import { logger } from '../../utils/logger';

/**
 * Seeded scatter helpers for {@link InstancedMobject}: points on a surface or
 * inside a volume, with an optional minimum distance (dart throwing), and a
 * helper that turns them into instance transforms.
 *
 * Every helper is deterministic for a given seed. With `minDistance`, a
 * candidate closer than that to an accepted point is rejected; after
 * `maxAttempts` candidates the helper returns the points it has (possibly
 * fewer than `count`, with one `logger.debug` line). A non-finite or negative
 * count, distance, radius or size throws an Error that names the option.
 */

/** A point on a surface with its unit outward normal. */
export interface SurfacePoint {
  position: Vector3Tuple;
  normal: Vector3Tuple;
}

/** Options shared by all scatter helpers. */
export interface ScatterOptions {
  /** Number of points wanted. */
  count: number;
  /** Seed. Default: 1 */
  seed?: number;
  /** Minimum distance between two points. Default: 0 (no limit) */
  minDistance?: number;
  /** Candidate budget. Default: 30 * count */
  maxAttempts?: number;
}

/** Options for {@link scatterOnEllipsoid}. */
export interface ScatterOnEllipsoidOptions extends ScatterOptions {
  /** Semi-axes [a, b, c], or one radius for a sphere. Default: 1 */
  radii?: number | Vector3Tuple;
  /** Center. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Keep only points that pass this test (e.g. skip a cut-away region). */
  filter?: (p: SurfacePoint) => boolean;
}

/** Options for {@link scatterOnMesh}. */
export interface ScatterOnMeshOptions extends ScatterOptions {
  /** Keep only points that pass this test. */
  filter?: (p: SurfacePoint) => boolean;
}

/** Options for {@link scatterInVolume}. */
export interface ScatterInVolumeOptions extends ScatterOptions {
  /** Size of the box [x, y, z] (the ellipsoid is inscribed in it). Default: [2, 2, 2] */
  size?: Vector3Tuple;
  /** Center. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Default: 'box' */
  shape?: 'box' | 'ellipsoid';
  /** Keep only points that pass this test (e.g. outside the nucleus). */
  filter?: (p: Vector3Tuple) => boolean;
}

/** Uniform spatial hash that answers "is any accepted point closer than d?". */
class PointGrid {
  private readonly _cells = new Map<string, Vector3Tuple[]>();
  constructor(private readonly _d: number) {}

  private _key(i: number, j: number, k: number): string {
    return `${i},${j},${k}`;
  }

  free(p: Vector3Tuple): boolean {
    if (this._d <= 0) return true;
    const c = p.map((v) => Math.floor(v / this._d));
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (let k = -1; k <= 1; k++) {
          const cell = this._cells.get(this._key(c[0] + i, c[1] + j, c[2] + k));
          if (cell?.some((q) => lengthVec(subVec(p, q)) < this._d)) return false;
        }
      }
    }
    return true;
  }

  add(p: Vector3Tuple): void {
    if (this._d <= 0) return;
    const c = p.map((v) => Math.floor(v / this._d));
    const key = this._key(c[0], c[1], c[2]);
    const cell = this._cells.get(key);
    if (cell) cell.push(p);
    else this._cells.set(key, [p]);
  }
}

/** Dart throwing: draw candidates until `count` pass, or the budget ends. */
function throwDarts<T>(
  options: ScatterOptions,
  candidate: (rng: () => number) => T | null,
  positionOf: (t: T) => Vector3Tuple,
): T[] {
  const { count, seed = 1, minDistance = 0, maxAttempts = 30 * count } = options;
  if (!(Number.isFinite(count) && count >= 0))
    throw new Error(`scatter: count must be a finite number >= 0, got ${count}.`);
  if (!(Number.isFinite(minDistance) && minDistance >= 0))
    throw new Error(`scatter: minDistance must be a finite number >= 0, got ${minDistance}.`);
  if (!(Number.isFinite(maxAttempts) && maxAttempts >= 0))
    throw new Error(`scatter: maxAttempts must be a finite number >= 0, got ${maxAttempts}.`);
  const rng = mulberry32(seed);
  const grid = new PointGrid(minDistance);
  const out: T[] = [];
  for (let attempt = 0; attempt < maxAttempts && out.length < count; attempt++) {
    const c = candidate(rng);
    if (c === null) continue;
    const p = positionOf(c);
    if (!grid.free(p)) continue;
    grid.add(p);
    out.push(c);
  }
  if (out.length < count)
    logger.debug(
      `scatter: placed ${out.length} of ${count} points in ${maxAttempts} attempts ` +
        '(minDistance or filter too strict).',
    );
  return out;
}

/** A uniform random unit vector. */
function randomDirection(rng: () => number): Vector3Tuple {
  const z = 2 * rng() - 1;
  const a = 2 * Math.PI * rng();
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(a), s * Math.sin(a), z];
}

/**
 * Scatter points uniformly by area on a sphere or ellipsoid surface.
 *
 * A direction u maps to the surface point S u (S = diag(radii)). The area
 * element there is proportional to |S^-1 u|, so candidates are accepted with
 * that weight: the density is uniform over the surface, not over angles.
 *
 * @post result.length <= options.count
 */
export function scatterOnEllipsoid(options: ScatterOnEllipsoidOptions): SurfacePoint[] {
  const { radii = 1, center = [0, 0, 0], filter } = options;
  const r: Vector3Tuple = typeof radii === 'number' ? [radii, radii, radii] : radii;
  if (!r.every((v) => Number.isFinite(v) && v > 0))
    throw new Error(`scatterOnEllipsoid: radii must be finite and > 0, got [${r}].`);
  const maxWeight = 1 / Math.min(...r);
  return throwDarts(
    options,
    (rng) => {
      const u = randomDirection(rng);
      const inv: Vector3Tuple = [u[0] / r[0], u[1] / r[1], u[2] / r[2]];
      if (rng() * maxWeight > lengthVec(inv)) return null;
      const point: SurfacePoint = {
        position: [center[0] + r[0] * u[0], center[1] + r[1] * u[1], center[2] + r[2] * u[2]],
        normal: normalizeVec(inv),
      };
      return !filter || filter(point) ? point : null;
    },
    (p) => p.position,
  );
}

/** Collect world-space triangles (with vertex normals) of every visible mesh. */
function worldTriangles(
  source: Mobject | THREE.Object3D | THREE.BufferGeometry,
): THREE.Triangle[][] {
  const tris: THREE.Triangle[][] = [];
  const addGeometry = (geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) => {
    const pos = geometry.getAttribute('position');
    const nrm = geometry.getAttribute('normal');
    const index = geometry.getIndex();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const count = index ? index.count : pos.count;
    for (let t = 0; t < count; t += 3) {
      const ids = [0, 1, 2].map((k) => (index ? index.getX(t + k) : t + k));
      const p = ids.map((i) =>
        new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(matrix),
      );
      const n = ids.map((i) =>
        nrm
          ? new THREE.Vector3().fromBufferAttribute(nrm, i).applyMatrix3(normalMatrix).normalize()
          : null,
      );
      const face = new THREE.Triangle(p[0], p[1], p[2]);
      const fn = face.getNormal(new THREE.Vector3());
      tris.push([face, new THREE.Triangle(n[0] ?? fn, n[1] ?? fn, n[2] ?? fn)]);
    }
  };
  if (source instanceof THREE.BufferGeometry) {
    addGeometry(source, new THREE.Matrix4());
    return tris;
  }
  let root: THREE.Object3D;
  let rootWorld: THREE.Matrix4;
  if (source instanceof Mobject) {
    // The three.js ancestors of the mesh are synced only at render time, so
    // after an ancestor moved they are stale: take the world matrix from the
    // mobject tree instead.
    root = source.getThreeObject();
    rootWorld = source._worldMatrix();
  } else {
    root = source;
    root.updateWorldMatrix(true, false);
    rootWorld = root.matrixWorld.clone();
  }
  const visit = (o: THREE.Object3D, world: THREE.Matrix4) => {
    if (o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh)) {
      const material = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!material.userData.depthPrepass) addGeometry(o.geometry, world);
    }
    for (const child of o.children) {
      if (child.matrixAutoUpdate) child.updateMatrix();
      visit(child, world.clone().multiply(child.matrix));
    }
  };
  visit(root, rootWorld);
  return tris;
}

/**
 * Scatter points uniformly by area on the surface of a mobject, a Three.js
 * object, or a bare geometry. Positions are in world space (the mobject's
 * current transform); normals are interpolated vertex normals.
 *
 * @post result.length <= options.count
 */
export function scatterOnMesh(
  source: Mobject | THREE.Object3D | THREE.BufferGeometry,
  options: ScatterOnMeshOptions,
): SurfacePoint[] {
  const tris = worldTriangles(source);
  const cumulative: number[] = [];
  let total = 0;
  for (const [face] of tris) {
    total += face.getArea();
    cumulative.push(total);
  }
  if (total <= 0) return [];
  const { filter } = options;
  return throwDarts(
    options,
    (rng) => {
      const target = rng() * total;
      let lo = 0;
      let hi = cumulative.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cumulative[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      const [face, normals] = tris[lo];
      let a = rng();
      let b = rng();
      if (a + b > 1) {
        a = 1 - a;
        b = 1 - b;
      }
      const w = [1 - a - b, a, b];
      const p = new THREE.Vector3()
        .addScaledVector(face.a, w[0])
        .addScaledVector(face.b, w[1])
        .addScaledVector(face.c, w[2]);
      const n = new THREE.Vector3()
        .addScaledVector(normals.a, w[0])
        .addScaledVector(normals.b, w[1])
        .addScaledVector(normals.c, w[2])
        .normalize();
      const point: SurfacePoint = { position: [p.x, p.y, p.z], normal: [n.x, n.y, n.z] };
      return !filter || filter(point) ? point : null;
    },
    (p) => p.position,
  );
}

/**
 * Scatter points uniformly inside a box, or inside the ellipsoid inscribed in
 * that box.
 *
 * @post result.length <= options.count
 */
export function scatterInVolume(options: ScatterInVolumeOptions): Vector3Tuple[] {
  const { size = [2, 2, 2], center = [0, 0, 0], shape = 'box', filter } = options;
  if (!size.every((v) => Number.isFinite(v) && v >= 0))
    throw new Error(`scatterInVolume: size must be three finite numbers >= 0, got [${size}].`);
  return throwDarts(
    options,
    (rng) => {
      const unit: Vector3Tuple = [rng() - 0.5, rng() - 0.5, rng() - 0.5];
      if (shape === 'ellipsoid' && 4 * (unit[0] ** 2 + unit[1] ** 2 + unit[2] ** 2) > 1)
        return null;
      const p: Vector3Tuple = [
        center[0] + unit[0] * size[0],
        center[1] + unit[1] * size[1],
        center[2] + unit[2] * size[2],
      ];
      return !filter || filter(p) ? p : null;
    },
    (p) => p,
  );
}

/** Options for {@link toInstances}. */
export interface ToInstancesOptions {
  /** Uniform scale, or a [min, max] range drawn per instance. Default: 1 */
  scale?: number | [number, number];
  /** Per-instance colors, picked at random. Default: none (material color) */
  colors?: string[];
  /** Turn each instance so its local +Y follows the surface normal. Default: true */
  alignToNormal?: boolean;
  /** Random spin about the normal (or a random orientation for volume points). Default: true */
  spin?: boolean;
  /** Seed for scale, color and spin. Default: 1 */
  seed?: number;
}

const UNIT_Y = new THREE.Vector3(0, 1, 0);

/**
 * Turn scattered points into {@link InstanceTransform}s for an
 * {@link InstancedMobject}: per-instance position, rotation, scale and color.
 *
 * @post result.length === points.length
 */
export function toInstances(
  points: (SurfacePoint | Vector3Tuple)[],
  options: ToInstancesOptions = {},
): InstanceTransform[] {
  const { scale = 1, colors, alignToNormal = true, spin = true, seed = 1 } = options;
  const rng = mulberry32(seed);
  const q = new THREE.Quaternion();
  const twist = new THREE.Quaternion();
  const euler = new THREE.Euler();
  return points.map((pt) => {
    const surface = !Array.isArray(pt);
    const position = surface ? pt.position : pt;
    const s = typeof scale === 'number' ? scale : scale[0] + (scale[1] - scale[0]) * rng();
    q.identity();
    if (surface && alignToNormal)
      q.setFromUnitVectors(UNIT_Y, new THREE.Vector3(...pt.normal).normalize());
    if (spin) {
      if (surface && alignToNormal) {
        twist.setFromAxisAngle(UNIT_Y, 2 * Math.PI * rng());
        q.multiply(twist);
      } else {
        const axis = new THREE.Vector3(...randomDirection(rng));
        q.setFromAxisAngle(axis, 2 * Math.PI * rng());
      }
    }
    euler.setFromQuaternion(q, 'XYZ');
    const transform: InstanceTransform = {
      position: [...position],
      rotation: [euler.x, euler.y, euler.z],
      scale: s,
    };
    if (colors && colors.length > 0) transform.color = colors[Math.floor(rng() * colors.length)];
    return transform;
  });
}

/** Options for {@link beadRingGeometry}. */
export interface BeadRingOptions {
  /** Number of beads. Default: 8 */
  beads?: number;
  /** Radius of the ring through the bead centres. Default: 0.1 */
  radius?: number;
  /** Radius of one bead. Default: 0.4 * radius */
  beadRadius?: number;
  /** Icosphere subdivision of one bead. Default: 2 */
  detail?: number;
}

/**
 * A ring of round beads in the XZ plane (axis +Y), as ONE closed geometry:
 * a nuclear pore, a bead necklace, a rosette. Each bead is its own closed
 * sphere. Feed it to an {@link InstancedMobject} and align +Y to the surface
 * normal with {@link toInstances}.
 */
export function beadRingGeometry(options: BeadRingOptions = {}): THREE.BufferGeometry {
  const { beads = 8, radius = 0.1, beadRadius = 0.4 * radius, detail = 2 } = options;
  const { vertices, faces } = icosphere(detail);
  const positions: number[] = [];
  const normals: number[] = [];
  const index: number[] = [];
  for (let b = 0; b < beads; b++) {
    const a = (2 * Math.PI * b) / beads;
    const c = [radius * Math.cos(a), 0, radius * Math.sin(a)];
    const base = positions.length / 3;
    for (const d of vertices) {
      positions.push(c[0] + beadRadius * d[0], c[1] + beadRadius * d[1], c[2] + beadRadius * d[2]);
      normals.push(d[0], d[1], d[2]);
    }
    for (const f of faces) index.push(base + f[0], base + f[1], base + f[2]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(index);
  finishGeometry(geometry, [1, 0, 0]);
  return geometry;
}
