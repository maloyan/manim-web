/**
 * Shared geometry helpers for the 3D cell kit: 2D outlines for Extrude3D,
 * small template geometries for instanced crowds, random helpers and frame
 * helpers.
 *
 * Every template geometry goes through `finishGeometry`, so it carries the
 * `smoothNormal` and `reveal` attributes that the toon outline and the 3D
 * build-up animations read.
 */

import * as THREE from 'three';
import type { Vector3Tuple } from '../../../core/Mobject';
import type { Point2D } from '../../three-d/Extrude3D';
import { icosphere } from '../../three-d/Blob3D';
import { finishGeometry } from '../../three-d/organicMesh';
import {
  addVec,
  crossVec,
  dotVec,
  lengthVec,
  normalizeVec,
  scaleVec,
  subVec,
  unitPerpendicularTo,
} from '../../../utils/vectors';
import { mulberry32 } from '../../../utils/ManimColor';
import type { CellDetail } from './cell3dTypes';

// ── detail ─────────────────────────────────────────────────────────────────

/** Pick the value for a detail level from a [low, medium, high] triple. */
export function byDetail<T>(detail: CellDetail, values: readonly [T, T, T]): T {
  return values[detail === 'low' ? 0 : detail === 'high' ? 2 : 1];
}

// ── random ─────────────────────────────────────────────────────────────────

/** A seeded random stream with a few helpers. */
export interface Rng {
  /** Uniform in [0, 1). */
  (): number;
  /** Uniform in [lo, hi). */
  range(lo: number, hi: number): number;
  /** A uniform random unit vector. */
  direction(): Vector3Tuple;
}

/** A deterministic random stream for a seed. */
export function makeRng(seed: number): Rng {
  const base = mulberry32(seed);
  const rng = (() => base()) as Rng;
  rng.range = (lo, hi) => lo + (hi - lo) * base();
  rng.direction = () => {
    const z = 2 * base() - 1;
    const a = 2 * Math.PI * base();
    const s = Math.sqrt(1 - z * z);
    return [s * Math.cos(a), s * Math.sin(a), z];
  };
  return rng;
}

// ── 2D outlines (XY plane, counter-clockwise) ──────────────────────────────

/** An ellipse outline with semi-axes a, b. */
export function ellipseOutline(a: number, b: number, n = 48): Point2D[] {
  return Array.from({ length: n }, (_, i): Point2D => {
    const t = (2 * Math.PI * i) / n;
    return [a * Math.cos(t), b * Math.sin(t)];
  });
}

/** A stadium (rod with round ends): half straight length a, end radius r. */
export function stadiumOutline(a: number, r: number, steps = 12): Point2D[] {
  const pts: Point2D[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = -Math.PI / 2 + (Math.PI * k) / steps;
    pts.push([a + r * Math.cos(t), r * Math.sin(t)]);
  }
  for (let k = 0; k <= steps; k++) {
    const t = Math.PI / 2 + (Math.PI * k) / steps;
    pts.push([-a + r * Math.cos(t), r * Math.sin(t)]);
  }
  return pts;
}

/**
 * A band along a circular arc around the origin, between radii r0 and r1,
 * from angle a0 over the sweep, with round ends. `wobble(t)` (t in 0..1 along
 * the arc) shifts both radii, for an organic sheet.
 */
export function arcBandOutline(
  r0: number,
  r1: number,
  a0: number,
  sweep: number,
  wobble: (t: number) => number = () => 0,
  n = 64,
): Point2D[] {
  const pts: Point2D[] = [];
  const mid = (r0 + r1) / 2;
  const half = (r1 - r0) / 2;
  const at = (t: number, r: number): Point2D => {
    const a = a0 + sweep * t;
    const rr = r + wobble(t);
    return [rr * Math.cos(a), rr * Math.sin(a)];
  };
  for (let i = 0; i <= n; i++) pts.push(at(i / n, r1));
  // Round end cap at t = 1, from the outer to the inner edge.
  const capSteps = 8;
  const endCap = (t: number, from: number) => {
    const a = a0 + sweep * t;
    const c: Point2D = [(mid + wobble(t)) * Math.cos(a), (mid + wobble(t)) * Math.sin(a)];
    const radial: Point2D = [Math.cos(a), Math.sin(a)];
    const tangent: Point2D = [-Math.sin(a) * Math.sign(sweep), Math.cos(a) * Math.sign(sweep)];
    for (let k = 1; k < capSteps; k++) {
      const phi = from + (Math.PI * k) / capSteps;
      const cr = Math.cos(phi);
      const sr = Math.sin(phi);
      pts.push([
        c[0] + half * (cr * radial[0] + sr * tangent[0]),
        c[1] + half * (cr * radial[1] + sr * tangent[1]),
      ]);
    }
  };
  endCap(1, 0);
  for (let i = n; i >= 0; i--) pts.push(at(i / n, r0));
  endCap(0, Math.PI);
  return pts;
}

/**
 * Lumen of a cut mitochondrion: a stadium with cristae folds that poke in
 * from both walls, alternating sides.
 *
 * @pre count >= 1
 */
export function cristaeOutline(
  a: number,
  b: number,
  count: number,
  foldDepth: number,
  foldWidth: number,
): Point2D[] {
  const pts: Point2D[] = [];
  const fold = (x: number, y0: number, dir: 1 | -1) => {
    const w = foldWidth;
    const tipY = y0 + dir * foldDepth;
    pts.push([x - (dir * w) / 2, y0], [x - (dir * w) / 2, tipY - dir * (w / 2)]);
    for (let k = 1; k < 6; k++) {
      const t = Math.PI - (Math.PI * k) / 6;
      pts.push([
        x + dir * (w / 2) * Math.cos(t),
        tipY - dir * (w / 2) + dir * (w / 2) * Math.sin(t),
      ]);
    }
    pts.push([x + (dir * w) / 2, tipY - dir * (w / 2)], [x + (dir * w) / 2, y0]);
  };
  // Fold x positions, spread over the straight part, alternating walls.
  const xs = Array.from({ length: count }, (_, i) => -a + ((i + 0.5) * 2 * a) / count);
  const bottom = xs.filter((_, i) => i % 2 === 0);
  const top = xs.filter((_, i) => i % 2 === 1).reverse();
  for (const x of bottom) fold(x, -b, 1);
  for (let k = 0; k <= 10; k++) {
    const t = -Math.PI / 2 + (Math.PI * k) / 10;
    pts.push([a + b * Math.cos(t), b * Math.sin(t)]);
  }
  for (const x of top) fold(x, b, -1);
  for (let k = 0; k <= 10; k++) {
    const t = Math.PI / 2 + (Math.PI * k) / 10;
    pts.push([-a + b * Math.cos(t), b * Math.sin(t)]);
  }
  return pts;
}

// ── template geometries ────────────────────────────────────────────────────

/** A closed icosphere of radius r, with the organic attributes. */
export function sphereGeometry(r: number, detail = 1): THREE.BufferGeometry {
  return mergedSpheres([{ center: [0, 0, 0], radius: r, scale: [1, 1, 1] }], detail);
}

/** One sphere of {@link mergedSpheres}: centre, radius and per-axis squash. */
export interface SphereSpec {
  center: Vector3Tuple;
  radius: number;
  scale?: Vector3Tuple;
}

/**
 * Several (possibly squashed) icospheres merged into ONE geometry, for an
 * instanced template such as a two-subunit ribosome.
 */
export function mergedSpheres(spheres: SphereSpec[], detail = 1): THREE.BufferGeometry {
  const { vertices, faces } = icosphere(detail);
  const positions: number[] = [];
  const normals: number[] = [];
  const index: number[] = [];
  for (const s of spheres) {
    const k = s.scale ?? [1, 1, 1];
    const base = positions.length / 3;
    for (const d of vertices) {
      positions.push(
        s.center[0] + s.radius * k[0] * d[0],
        s.center[1] + s.radius * k[1] * d[1],
        s.center[2] + s.radius * k[2] * d[2],
      );
      const n = normalizeVec([d[0] / k[0], d[1] / k[1], d[2] / k[2]]);
      normals.push(n[0], n[1], n[2]);
    }
    for (const f of faces) index.push(base + f[0], base + f[1], base + f[2]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(index);
  finishGeometry(geometry, [0, 1, 0]);
  return geometry;
}

/**
 * A capped rod along local +Y, from y = 0 to y = length (instanced filaments
 * and centriole microtubules). The bottom is at the origin, so an instance
 * scale on Y sets the length.
 */
export function rodGeometry(radius: number, length: number, radial = 8): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, radial, 1, false);
  geometry.translate(0, length / 2, 0);
  finishGeometry(geometry, [0, 1, 0]);
  return geometry;
}

/** The template for a free or bound ribosome: a large and a small subunit. */
export function ribosomeGeometry(size: number): THREE.BufferGeometry {
  return mergedSpheres(
    [
      { center: [0, 0.32 * size, 0], radius: 0.5 * size, scale: [1.1, 0.8, 1] },
      { center: [0, -0.3 * size, 0], radius: 0.38 * size, scale: [1.2, 0.6, 0.9] },
    ],
    1,
  );
}

// ── frames and transforms ──────────────────────────────────────────────────

/**
 * Euler angles (XYZ) of the rotation that takes local +X to `xAxis` and local
 * +Z as close as possible to `zAxis`.
 */
export function eulerFromAxes(xAxis: Vector3Tuple, zAxis: Vector3Tuple): THREE.Euler {
  const x = normalizeVec(xAxis);
  let z = subVec(zAxis, scaleVec(dotVec(zAxis, x), x));
  z = lengthVec(z) < 1e-9 ? unitPerpendicularTo(x) : normalizeVec(z);
  const y = crossVec(z, x);
  const m = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(...x),
    new THREE.Vector3(...y),
    new THREE.Vector3(...z),
  );
  return new THREE.Euler().setFromRotationMatrix(m, 'XYZ');
}

/** Euler angles (XYZ) of the shortest rotation from local +Y to `dir`. */
export function eulerYTo(dir: Vector3Tuple, spin = 0): Vector3Tuple {
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(...normalizeVec(dir)),
  );
  if (spin !== 0)
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin));
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  return [e.x, e.y, e.z];
}

/** Point on a quadratic Bezier curve. */
export function bezier2(
  a: Vector3Tuple,
  c: Vector3Tuple,
  b: Vector3Tuple,
  t: number,
): Vector3Tuple {
  const u = 1 - t;
  return addVec(scaleVec(u * u, a), scaleVec(2 * u * t, c), scaleVec(t * t, b));
}

/** Linear interpolation of two points. */
function lerpVec(a: Vector3Tuple, b: Vector3Tuple, t: number): Vector3Tuple {
  return addVec(a, scaleVec(t, subVec(b, a)));
}

/**
 * Point at arc-length fraction `t` (0..1) of a polyline.
 * @pre points.length >= 1
 */
export function pointAlong(points: Vector3Tuple[], t: number): Vector3Tuple {
  if (points.length === 1) return [...points[0]];
  const lengths: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + lengthVec(subVec(points[i], points[i - 1])));
  }
  const total = lengths[lengths.length - 1];
  const target = Math.min(1, Math.max(0, t)) * total;
  for (let i = 1; i < points.length; i++) {
    if (lengths[i] >= target) {
      const seg = lengths[i] - lengths[i - 1];
      const f = seg > 1e-12 ? (target - lengths[i - 1]) / seg : 0;
      return lerpVec(points[i - 1], points[i], f);
    }
  }
  return [...points[points.length - 1]];
}

/** Arc length of a polyline. */
export function polylineLength(points: Vector3Tuple[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += lengthVec(subVec(points[i], points[i - 1]));
  return total;
}

/** Chaikin corner cutting: a smoother polyline with the same ends. */
export function smoothPolyline(points: Vector3Tuple[], rounds = 2): Vector3Tuple[] {
  let pts = points;
  for (let r = 0; r < rounds; r++) {
    if (pts.length < 3) return pts;
    const next: Vector3Tuple[] = [pts[0]];
    for (let i = 0; i + 1 < pts.length; i++) {
      next.push(lerpVec(pts[i], pts[i + 1], 0.25), lerpVec(pts[i], pts[i + 1], 0.75));
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

/** A tube graph (nodes + edges) made of polyline chains. */
export interface ChainGraph {
  nodes: Vector3Tuple[];
  edges: [number, number][];
}

/**
 * Join polylines into one tube graph. With `root`, every chain starts at the
 * shared node 0, so a network reveal grows out from that point.
 */
export function chainsToGraph(chains: Vector3Tuple[][], root?: Vector3Tuple): ChainGraph {
  const nodes: Vector3Tuple[] = root ? [root] : [];
  const edges: [number, number][] = [];
  for (const chain of chains) {
    let prev = -1;
    chain.forEach((p, i) => {
      if (root && i === 0) {
        prev = 0;
        return;
      }
      nodes.push(p);
      const id = nodes.length - 1;
      if (prev >= 0) edges.push([prev, id]);
      prev = id;
    });
  }
  return { nodes, edges };
}
