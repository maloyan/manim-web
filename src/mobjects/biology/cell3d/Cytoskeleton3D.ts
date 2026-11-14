/**
 * Cytoskeleton3D: the three filament systems of an animal cell.
 *
 * - Microtubules (thickest): hollow tracks that radiate from the centrosome
 *   (`origin`) to the cell edge; one merged mesh that grows outward from the
 *   centrosome in the build-up.
 * - Actin filaments (thinnest): short filaments in a layer under the
 *   membrane, as one instanced crowd.
 * - Intermediate filaments: rope-like strands that run from around the
 *   nucleus to the edge; one merged mesh.
 *
 * The organelle frame is the cell frame: the filaments fill the ellipsoid of
 * semi-axes `radii` around the origin, below `maxZ` when given (a bowl cut).
 *
 * Parts: `microtubules`, `actin`, `intermediateFilaments` (each optional).
 * Anchors: `centrosome`, `microtubule`, `actin`, `intermediateFilament`.
 */

import * as THREE from 'three';
import type { Vector3Tuple } from '../../../core/Mobject';
import { TubeNetwork3D } from '../../three-d/TubeNetwork3D';
import { InstancedMobject, type InstanceTransform } from '../../three-d/InstancedMobject';
import { interpolateColor } from '../../../utils/color';
import {
  addVec,
  crossVec,
  dotVec,
  lengthVec,
  normalizeVec,
  scaleVec,
  subVec,
} from '../../../utils/vectors';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import {
  bezier2,
  byDetail,
  chainsToGraph,
  eulerYTo,
  rodGeometry,
  smoothPolyline,
  type Rng,
} from './geometry';
import { Organelle3D, kitColor, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** A sphere the microtubules bend around (the nucleus). */
export interface KeepOutSphere {
  center: Vector3Tuple;
  radius: number;
}

/** The space the filaments fill, shared by the three builders. */
interface FilamentSpace {
  radii: Vector3Tuple;
  mean: number;
  top: number;
  origin: Vector3Tuple;
  keepOut: KeepOutSphere | undefined;
  thickness: number;
  inside: (p: Vector3Tuple, s?: number) => boolean;
  toEdge: (dir: Vector3Tuple, s: number) => Vector3Tuple;
}

/** Options of {@link Cytoskeleton3D}. */
export interface Cytoskeleton3DOptions extends Organelle3DOptions {
  /** Semi-axes of the space the filaments fill (the inner cell wall). Default: [2, 1.7, 1.1] */
  radii?: Vector3Tuple;
  /** Keep every filament below this height (a bowl cut). Default: none */
  maxZ?: number;
  /** Where the microtubules start (the centrosome), in the organelle frame. Default: [0, 0, 0] */
  origin?: Vector3Tuple;
  /** A sphere the microtubules curve around and the intermediate filaments start from. Default: none */
  keepOut?: KeepOutSphere;
  /** Number of microtubules. Default: by detail (50, 120, 220) */
  microtubules?: number;
  /** Number of actin filaments. Default: by detail (250, 600, 1200) */
  actin?: number;
  /** Number of intermediate filaments. Default: by detail (10, 20, 32) */
  intermediateFilaments?: number;
  /** Filament radius scale. Default: 1 (microtubule radius 0.0085 * the mean cell radius) */
  thickness?: number;
}

export class Cytoskeleton3D extends Organelle3D {
  private readonly _microtubulePaths: Vector3Tuple[][] = [];

  constructor(options: Cytoskeleton3DOptions = {}) {
    super('cytoskeleton', options, 'microtubule');
    const { radii = [2, 1.7, 1.1], maxZ, origin = [0, 0, 0], keepOut, thickness = 1 } = options;
    const mean = (radii[0] + radii[1] + radii[2]) / 3;
    const top = maxZ === undefined ? Infinity : maxZ - 0.04 * mean;
    const inside = (p: Vector3Tuple, s = 0.96) =>
      (p[0] / radii[0]) ** 2 + (p[1] / radii[1]) ** 2 + (p[2] / radii[2]) ** 2 <= s * s &&
      p[2] <= top;
    const toEdge = (dir: Vector3Tuple, s: number): Vector3Tuple => {
      // Where the ray from `origin` along dir meets the ellipsoid scaled by s.
      let lo = 0;
      let hi = 4 * mean;
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2;
        if (inside(addVec(origin, scaleVec(mid, dir)), s)) lo = mid;
        else hi = mid;
      }
      return addVec(origin, scaleVec(lo, dir));
    };

    const sp: FilamentSpace = { radii, mean, top, inside, toEdge, origin, keepOut, thickness };
    this._buildMicrotubules(options, sp);
    this._buildActin(options, sp);
    this._buildIntermediateFilaments(options, sp);
    this._finish();
  }

  /** Microtubules: curved tracks from the centrosome to the edge. */
  private _buildMicrotubules(options: Cytoskeleton3DOptions, sp: FilamentSpace): void {
    const { mean, top, toEdge, origin, keepOut, thickness } = sp;
    const mtColor = this._partColor('microtubule', kitColor('microtubule', this._colorOverrides));
    const mtCount = options.microtubules ?? byDetail(this._detail, [50, 120, 220] as const);
    if (mtCount > 0) {
      const rng = this._rng(1);
      for (let i = 0; i < mtCount; i++) {
        const d = rng.direction();
        const dir = normalizeVec([d[0], d[1], d[2] * 0.45 - 0.15]);
        const end = toEdge(dir, rng.range(0.9, 0.97));
        if (lengthVec(subVec(end, origin)) < 0.15 * mean) continue;
        const control = bendControl(origin, end, keepOut, rng, 0.12);
        const path = Array.from({ length: 9 }, (_, k) => bezier2(origin, control, end, k / 8));
        this._microtubulePaths.push(
          path.map((p): Vector3Tuple => (p[2] > top ? [p[0], p[1], top] : p)),
        );
      }
      const mt = this._addPart(
        'microtubules',
        new TubeNetwork3D({
          ...chainsToGraph(this._microtubulePaths, origin),
          radius: 0.0085 * mean * thickness,
          jointRadius: 0.0085 * mean * thickness,
          radialSegments: byDetail(this._detail, [4, 6, 6] as const),
          capSegments: 1,
          color: mtColor,
        }),
      );
      const sample = this._microtubulePaths[Math.floor(this._microtubulePaths.length / 3)] ?? [
        origin,
      ];
      this._setAnchor('centrosome', origin, mt);
      this._setAnchor('microtubule', sample[Math.floor(sample.length * 0.6)], mt);
    }
  }

  /** Actin: short filaments in a layer under the membrane. */
  private _buildActin(options: Cytoskeleton3DOptions, sp: FilamentSpace): void {
    const { radii, mean, top, inside, thickness } = sp;
    const actinCount = options.actin ?? byDetail(this._detail, [250, 600, 1200] as const);
    if (actinCount > 0) {
      const rng = this._rng(2);
      const color = this._partColor('actin', kitColor('actin', this._colorOverrides));
      const shades = [
        color,
        interpolateColor(color, '#ffffff', 0.2),
        interpolateColor(color, '#000000', 0.15),
      ];
      const instances: InstanceTransform[] = [];
      for (let tries = 0; instances.length < actinCount && tries < actinCount * 20; tries++) {
        const u = rng.direction();
        const s = rng.range(0.8, 0.93);
        const p: Vector3Tuple = [u[0] * radii[0] * s, u[1] * radii[1] * s, u[2] * radii[2] * s];
        if (p[2] > top) continue;
        // Mostly along the wall: a random tangent, tilted a little.
        const n = normalizeVec([p[0] / radii[0] ** 2, p[1] / radii[1] ** 2, p[2] / radii[2] ** 2]);
        const t = normalizeVec(
          addVec(crossVec(n, rng.direction()), scaleVec(rng.range(-0.3, 0.3), n)),
        );
        if (!Number.isFinite(t[0])) continue;
        // The rod starts half a length back, and both ends stay inside the wall.
        const len = rng.range(0.12, 0.28) * mean;
        const start = addVec(p, scaleVec(-len / 2, t));
        if (!inside(start, 0.97) || !inside(addVec(start, scaleVec(len, t)), 0.97)) continue;
        instances.push({
          position: start,
          rotation: eulerYTo(t),
          scale: [1, len, 1],
          color: shades[instances.length % 3],
        });
      }
      const actin = this._addPart(
        'actin',
        new InstancedMobject({
          geometry: rodGeometry(0.005 * mean * thickness, 1, 4),
          material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
          instances,
        }),
        { outline: false },
      );
      this._setAnchor('actin', instances[0]?.position ?? [radii[0] * 0.9, 0, 0], actin);
    }
  }

  /** Intermediate filaments: rope-like strands from the nucleus outward. */
  private _buildIntermediateFilaments(options: Cytoskeleton3DOptions, sp: FilamentSpace): void {
    const { mean, inside, origin, keepOut, thickness } = sp;
    const ifCount = options.intermediateFilaments ?? byDetail(this._detail, [10, 20, 32] as const);
    if (ifCount > 0) {
      const rng = this._rng(3);
      const chains: Vector3Tuple[][] = [];
      const hub = keepOut ?? { center: origin, radius: 0.2 * mean };
      for (let i = 0; i < ifCount; i++) {
        const d = rng.direction();
        const dir = normalizeVec([d[0], d[1], d[2] * 0.4 - 0.1]);
        let p = addVec(hub.center, scaleVec(hub.radius * 1.12, dir));
        if (!inside(p)) continue;
        const chain = [p];
        let heading = dir;
        for (let k = 0; k < 40; k++) {
          heading = normalizeVec(addVec(heading, scaleVec(0.5, rng.direction())));
          heading = normalizeVec(addVec(heading, scaleVec(0.35, dir)));
          const next = addVec(p, scaleVec(0.07 * mean, heading));
          if (!inside(next, 0.93)) break;
          p = next;
          chain.push(p);
        }
        if (chain.length >= 4) chains.push(smoothPolyline(chain, 1));
      }
      if (chains.length > 0) {
        const r = 0.008 * mean * thickness;
        const filaments = this._addPart(
          'intermediateFilaments',
          new TubeNetwork3D({
            ...chainsToGraph(chains),
            radius: r,
            jointRadius: r,
            radialSegments: 5,
            capSegments: 1,
            color: this._partColor(
              'intermediateFilament',
              kitColor('intermediate filament', this._colorOverrides),
            ),
          }),
          { outline: false },
        );
        const c = chains[0];
        this._setAnchor('intermediateFilament', c[Math.floor(c.length / 2)], filaments);
      }
    }
  }

  /**
   * The centre lines of the microtubules (organelle frame), from the
   * centrosome out. Cargo moves along these.
   */
  getMicrotubulePaths(): Vector3Tuple[][] {
    return this._microtubulePaths.map((path) => path.map((p) => [...p] as Vector3Tuple));
  }

  protected _buildSteps(): BuildStep[] {
    const steps: BuildStep[] = [];
    const mt = this.getPart('microtubules');
    if (mt) steps.push({ part: mt, mode: 'grow', weight: 1.4 });
    const actin = this.getPart('actin');
    if (actin) steps.push({ part: actin, mode: 'grow' });
    const ifs = this.getPart('intermediateFilaments');
    if (ifs) steps.push({ part: ifs, mode: 'grow' });
    return steps;
  }

  protected override _defaultBuildDuration(): number {
    return 3;
  }

  override getFocusFraming(): CameraFocusOptions {
    return { fill: 0.8, phi: 0.7 };
  }
}

/**
 * Control point of a curved filament from a to b: a small random sideways
 * bow, pushed out of the keep-out sphere when the straight line cuts it.
 */
function bendControl(
  a: Vector3Tuple,
  b: Vector3Tuple,
  keepOut: KeepOutSphere | undefined,
  rng: Rng,
  bow: number,
): Vector3Tuple {
  const mid = scaleVec(0.5, addVec(a, b));
  const len = lengthVec(subVec(b, a));
  let control = addVec(mid, scaleVec(bow * len, rng.direction()));
  if (keepOut) {
    const ab = subVec(b, a);
    const t = Math.min(
      1,
      Math.max(0, dotVec(subVec(keepOut.center, a), ab) / Math.max(1e-9, dotVec(ab, ab))),
    );
    const closest = addVec(a, scaleVec(t, ab));
    const off = subVec(closest, keepOut.center);
    const dist = lengthVec(off);
    if (dist < keepOut.radius * 1.1) {
      const away = dist > 1e-6 ? normalizeVec(off) : normalizeVec([0, 0, -1]);
      control = addVec(keepOut.center, scaleVec(keepOut.radius * 1.9, away));
    }
  }
  return control;
}
