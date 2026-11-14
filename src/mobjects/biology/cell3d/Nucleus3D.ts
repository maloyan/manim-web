/**
 * Nucleus3D: the nucleus with a cut-open envelope.
 *
 * The envelope is two membranes (outer and inner) with a thin gap, so the cut
 * edge shows the double membrane. Nuclear pores sit on the outer surface as
 * instanced bead rings. Inside: chromatin as one merged net of tangled tubes,
 * and a lumpy nucleolus.
 *
 * Parts: `outerMembrane`, `innerMembrane` (absent when closed), `pores`,
 * `chromatin`, `nucleolus`.
 * Anchors: `pore`, `envelope`, `opening`, `chromatin`, `nucleolus`, `center`.
 */

import * as THREE from 'three';
import type { Vector3Tuple } from '../../../core/Mobject';
import { Shell3D } from '../../three-d/Shell3D';
import { Blob3D } from '../../three-d/Blob3D';
import { TubeNetwork3D } from '../../three-d/TubeNetwork3D';
import { InstancedMobject } from '../../three-d/InstancedMobject';
import {
  beadRingGeometry,
  scatterOnEllipsoid,
  toInstances,
  type SurfacePoint,
} from '../../three-d/scatter';
import { interpolateColor } from '../../../utils/color';
import { addVec, dotVec, lengthVec, normalizeVec, scaleVec, subVec } from '../../../utils/vectors';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { byDetail, chainsToGraph, smoothPolyline, type Rng } from './geometry';
import { Organelle3D, kitColor, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** How the nuclear envelope is opened. */
export type NucleusOpening = 'wedge' | 'cap' | 'none';

/** Options of {@link Nucleus3D}. */
export interface Nucleus3DOptions extends Organelle3DOptions {
  /** Outer radius of the envelope. Default: 1 */
  radius?: number;
  /** How the envelope is opened. Default: 'wedge' */
  opening?: NucleusOpening;
  /** Wedge: azimuth of the middle of the opening about +Z. Default: -1.2 (toward the default camera) */
  openingAzimuth?: number;
  /** Wedge: angle of the opening. Default: 1.9 */
  openingAngle?: number;
  /** Cap: direction of the cut normal (the window faces it). Default: [0, 0, 1] */
  capDirection?: Vector3Tuple;
  /** Cap: plane position along capDirection as a fraction of the radius. Default: 0.35 */
  capOffset?: number;
  /** Number of nuclear pores. Default: by detail, scaled by radius^2 */
  poreCount?: number;
  /** Number of chromatin strands. Default: by detail */
  chromatinStrands?: number;
}

/** Throw a clear error when the radius or the cap cut cannot form the envelope. */
function checkNucleus(radius: number, opening: NucleusOpening, capOffset: number): void {
  if (!(Number.isFinite(radius) && radius > 0))
    throw new Error(`Nucleus3D: radius must be a positive number, got ${radius}.`);
  // The cap plane must cross the inner wall of the inner membrane (0.87 radius).
  if (opening === 'cap' && !(Math.abs(capOffset) < 0.87))
    throw new Error(`Nucleus3D: capOffset must lie in (-0.87, 0.87), got ${capOffset}.`);
}

export class Nucleus3D extends Organelle3D {
  private readonly _radius: number;
  private readonly _opening: NucleusOpening;
  private readonly _openingDir: Vector3Tuple;
  private readonly _inOpening: (dir: Vector3Tuple) => boolean;

  constructor(options: Nucleus3DOptions = {}) {
    super('nucleus', options);
    const {
      radius = 1,
      opening = 'wedge',
      openingAzimuth = -1.2,
      openingAngle = 1.9,
      capDirection = [0, 0, 1],
      capOffset = 0.35,
    } = options;
    checkNucleus(radius, opening, capOffset);
    this._radius = radius;
    this._opening = opening;
    const capDir = normalizeVec(capDirection);
    this._openingDir =
      opening === 'cap'
        ? capDir
        : [Math.cos(openingAzimuth), Math.sin(openingAzimuth), opening === 'wedge' ? 0.25 : 0];
    // Whether a direction from the centre points into the removed region.
    this._inOpening = (d) => {
      if (opening === 'none') return false;
      if (opening === 'cap') return dotVec(d, capDir) > capOffset - 0.02;
      const rel = Math.atan2(d[1], d[0]) - openingAzimuth;
      const wrapped = Math.atan2(Math.sin(rel), Math.cos(rel));
      return Math.abs(wrapped) < openingAngle / 2 + 0.06;
    };

    const main = this._mainColor;
    const segments = byDetail(this._detail, [40, 64, 96] as const);
    const outerT = 0.055 * radius;
    const gap = 0.03 * radius;
    const innerT = 0.045 * radius;
    const cut =
      opening === 'cap'
        ? { cut: 'plane' as const, cutDirection: capDir, cutOffset: capOffset }
        : {
            cut: 'wedge' as const,
            cutDirection: [0, 0, 1] as Vector3Tuple,
            wedgeStart: openingAzimuth - openingAngle / 2,
            wedgeAngle: openingAngle,
          };
    const rim = this._partColor('envelope', interpolateColor(main, '#ffffff', 0.45));
    const innerFace = this._partColor('nucleoplasm', interpolateColor(main, '#120d1f', 0.55));

    if (opening === 'none') {
      this._addPart(
        'outerMembrane',
        new Blob3D({ radius, lumpiness: 0.01, lobes: 3, color: main }),
      );
    } else {
      this._addPart(
        'outerMembrane',
        new Shell3D({
          ...cut,
          outerRadius: radius,
          thickness: outerT,
          segments,
          color: main,
          innerColor: innerFace,
          rimColor: rim,
        }),
      );
      const r2 = radius - outerT - gap;
      this._addPart(
        'innerMembrane',
        new Shell3D({
          ...cut,
          ...(opening === 'cap' ? { cutOffset: (capOffset * radius) / r2 } : {}),
          outerRadius: r2,
          thickness: innerT,
          segments,
          color: interpolateColor(main, '#000000', 0.2),
          innerColor: innerFace,
          rimColor: interpolateColor(rim, main, 0.5),
        }),
      );
    }

    this._buildPores(options.poreCount);
    const nucleolusCenter: Vector3Tuple = scaleVec(radius, [0.18, 0.12, -0.08]);
    const nucleolusR = 0.27 * radius;
    this._buildChromatin(options.chromatinStrands, nucleolusCenter, nucleolusR);
    this._addPart(
      'nucleolus',
      new Blob3D({
        radius: nucleolusR,
        lobes: 14,
        lobeSize: 0.42,
        lumpiness: 0.22,
        seed: this._seed + 11,
        detail: byDetail(this._detail, [2, 3, 4] as const),
        center: nucleolusCenter,
        color: kitColor('nucleolus', this._colorOverrides),
      }),
    );

    const od = normalizeVec(this._openingDir);
    this._setAnchor('opening', scaleVec(0.75 * radius, od));
    this._setAnchor('envelope', this._envelopePoint());
    this._setAnchor('nucleolus', addVec(nucleolusCenter, scaleVec(nucleolusR, od)));
    this._setAnchor('chromatin', scaleVec(0.5 * radius, normalizeVec(addVec(od, [0, 0, -0.6]))));
    this._setAnchor('center', [0, 0, 0]);
    this._finish();
  }

  /** Outer radius of the envelope. */
  getRadius(): number {
    return this._radius;
  }

  /** How the envelope is opened. */
  getOpening(): NucleusOpening {
    return this._opening;
  }

  /** A point on the cut edge of the envelope, beside the opening. */
  private _envelopePoint(): Vector3Tuple {
    const r = this._radius;
    if (this._opening === 'wedge') {
      const az = Math.atan2(this._openingDir[1], this._openingDir[0]) + 1.05;
      return [0.97 * r * Math.cos(az), 0.97 * r * Math.sin(az), 0.25 * r];
    }
    const d = normalizeVec(addVec(this._openingDir, [0.9, 0.2, 0]));
    return scaleVec(r, d);
  }

  private _buildPores(countOption: number | undefined): void {
    const r = this._radius;
    const count =
      countOption ??
      Math.round(byDetail(this._detail, [40, 90, 150] as const) * Math.max(0.6, r * r));
    const points = scatterOnEllipsoid({
      count,
      radii: r * 1.004,
      seed: this._seed + 5,
      minDistance: 0.22 * r,
      filter: (p) => !this._inOpening(p.normal),
    });
    const poreColor = this._partColor(
      'pore',
      interpolateColor(this._mainColor, '#ffffff', 0.62),
      'nuclear pore',
    );
    this._addPart(
      'pores',
      new InstancedMobject({
        geometry: beadRingGeometry({
          beads: 8,
          radius: 0.06 * r,
          beadRadius: 0.024 * r,
          detail: 1,
        }),
        material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
        instances: toInstances(sortForPore(points, this._openingDir), {
          seed: this._seed,
          colors: [poreColor],
        }),
      }),
    );
    const visible =
      points.find((p) => dotVec(p.normal, normalizeVec(this._openingDir)) > 0.3) ?? points[0];
    this._setAnchor('pore', visible ? visible.position : [0, 0, r]);
  }

  private _buildChromatin(
    countOption: number | undefined,
    nucleolus: Vector3Tuple,
    nucleolusR: number,
  ): void {
    const r = this._radius;
    const strands = countOption ?? byDetail(this._detail, [8, 14, 22] as const);
    const steps = byDetail(this._detail, [18, 26, 34] as const);
    const rng = this._rng(3);
    const limit = 0.8 * r;
    const chains: Vector3Tuple[][] = [];
    for (let s = 0; s < strands; s++) {
      chains.push(
        smoothPolyline(
          randomWalk(
            rng,
            steps,
            0.1 * r,
            limit,
            nucleolus,
            nucleolusR * 1.15,
            this._opening === 'cap' ? this._openingDir : null,
            0.3 * r,
          ),
          1,
        ),
      );
    }
    const graph = chainsToGraph(chains);
    this._addPart(
      'chromatin',
      new TubeNetwork3D({
        ...graph,
        radius: 0.035 * r,
        jointRadius: 0.035 * r,
        radialSegments: byDetail(this._detail, [5, 6, 8] as const),
        capSegments: 2,
        color: this._partColor('chromatin', '#C5B3F6', 'chromatin'),
      }),
      { outline: this._detail === 'low' },
    );
  }

  protected _buildSteps(): BuildStep[] {
    const steps: BuildStep[] = [
      { part: this.getPart('outerMembrane')!, mode: 'create', weight: 1.3 },
    ];
    const inner = this.getPart('innerMembrane');
    if (inner) steps.push({ part: inner, mode: 'fade', weight: 0.6 });
    steps.push(
      { part: this.getPart('pores')!, mode: 'grow', weight: 1 },
      { part: this.getPart('chromatin')!, mode: 'grow', weight: 1.2 },
      { part: this.getPart('nucleolus')!, mode: 'create', weight: 0.7 },
    );
    return steps;
  }

  override getFocusFraming(): CameraFocusOptions {
    // Look into the opening from a little above.
    const d = this._openingDir;
    return { fill: 0.6, phi: 1.0, theta: Math.atan2(d[1], d[0]) };
  }
}

/** Pores ordered from the side the opening faces, so the build-up sweeps around the nucleus. */
function sortForPore(points: SurfacePoint[], facing: Vector3Tuple): SurfacePoint[] {
  const f = normalizeVec(facing);
  return [...points].sort((a, b) => dotVec(b.normal, f) - dotVec(a.normal, f));
}

/**
 * A persistent random walk inside a sphere of radius `limit`, outside a
 * keep-out sphere, and (for a cap opening) below the cap plane.
 */
function randomWalk(
  rng: Rng,
  steps: number,
  step: number,
  limit: number,
  avoid: Vector3Tuple,
  avoidR: number,
  capDir: Vector3Tuple | null,
  capHeight: number,
): Vector3Tuple[] {
  const ok = (p: Vector3Tuple) =>
    lengthVec(p) < limit &&
    lengthVec(subVec(p, avoid)) > avoidR &&
    (capDir === null || dotVec(p, capDir) < capHeight);
  let p: Vector3Tuple = scaleVec(limit * Math.cbrt(rng()) * 0.9, rng.direction());
  for (let i = 0; i < 20 && !ok(p); i++)
    p = scaleVec(limit * Math.cbrt(rng()) * 0.9, rng.direction());
  let dir = rng.direction();
  const out: Vector3Tuple[] = [p];
  for (let i = 0; i < steps; i++) {
    let next: Vector3Tuple = p;
    for (let tries = 0; tries < 12; tries++) {
      const turn = normalizeVec(addVec(dir, scaleVec(0.9, rng.direction())));
      const candidate = addVec(p, scaleVec(step, turn));
      if (ok(candidate)) {
        dir = turn;
        next = candidate;
        break;
      }
      dir = scaleVec(-1, dir);
    }
    if (next === p) break;
    p = next;
    out.push(p);
  }
  return out.length >= 2 ? out : [p, addVec(p, scaleVec(step, dir))];
}
