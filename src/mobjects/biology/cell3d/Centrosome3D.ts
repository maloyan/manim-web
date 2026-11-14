/**
 * Centrosome3D: two centrioles at a right angle in a cloud of
 * pericentriolar material.
 *
 * Each centriole is a short barrel of nine microtubule triplets. The three
 * tubules of a triplet sit side by side in a row that is tilted against the
 * barrel wall, so the end view shows the pinwheel. The daughter centriole
 * stands at a right angle next to the near end of the mother.
 *
 * Parts: `motherCentriole`, `daughterCentriole` (instanced rods), `pcm`
 * (translucent, optional).
 * Anchors: `mother`, `daughter`, `triplet`, `center`.
 */

import * as THREE from 'three';
import type { Vector3Tuple } from '../../../core/Mobject';
import { InstancedMobject, type InstanceTransform } from '../../three-d/InstancedMobject';
import { interpolateColor } from '../../../utils/color';
import {
  addVec,
  lengthVec,
  normalizeVec,
  orthonormalFrame,
  scaleVec,
} from '../../../utils/vectors';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { byDetail, eulerFromAxes, eulerYTo, rodGeometry, sphereGeometry } from './geometry';
import { Organelle3D, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** Options of {@link Centrosome3D}. */
export interface Centrosome3DOptions extends Organelle3DOptions {
  /** Length of one centriole. Default: 0.6 */
  size?: number;
  /** Axis of the mother centriole. Default: [0, 0, 1] */
  direction?: Vector3Tuple;
  /** Show the pericentriolar material as a faint haze of particles. Default: true */
  pcm?: boolean;
}

/** The 27 tubules of one centriole: base point at the near end, rod along +axis. */
function centrioleRods(
  center: Vector3Tuple,
  axis: Vector3Tuple,
  length: number,
  rodR: number,
  colors: string[],
): InstanceTransform[] {
  const a = normalizeVec(axis);
  const { u, v } = orthonormalFrame(a);
  const radius = 0.25 * length;
  const tilt = 0.75; // radians between the triplet row and the barrel tangent
  const rotation = eulerYTo(a);
  const base = addVec(center, scaleVec(-length / 2, a));
  const out: InstanceTransform[] = [];
  for (let t = 0; t < 9; t++) {
    const phi = (2 * Math.PI * t) / 9;
    const radial = addVec(scaleVec(Math.cos(phi), u), scaleVec(Math.sin(phi), v));
    const tangent = addVec(scaleVec(-Math.sin(phi), u), scaleVec(Math.cos(phi), v));
    // Row direction: the tangent turned inward by the tilt (the pinwheel).
    const row = normalizeVec(
      addVec(scaleVec(Math.cos(tilt), tangent), scaleVec(-Math.sin(tilt), radial)),
    );
    for (let k = -1; k <= 1; k++) {
      const p = addVec(base, scaleVec(radius, radial), scaleVec(k * 2.05 * rodR, row));
      // The C tubule is a bit shorter, as in real centrioles.
      const len = k === 1 ? 0.85 : 1;
      out.push({ position: p, rotation, scale: [1, len, 1], color: colors[k + 1] });
    }
  }
  return out;
}

export class Centrosome3D extends Organelle3D {
  constructor(options: Centrosome3DOptions = {}) {
    super('centrosome', options);
    const { size = 0.6, direction = [0, 0, 1], pcm = true } = options;
    const L = size;
    const rodR = 0.028 * L;
    const main = this._mainColor;
    const colors = [
      main,
      interpolateColor(main, '#ffffff', 0.25),
      interpolateColor(main, '#000000', 0.2),
    ];
    const radial = byDetail(this._detail, [6, 8, 12] as const);
    const geometry = rodGeometry(rodR, L, radial);

    const motherCenter: Vector3Tuple = [0, 0, 0];
    const motherAxis: Vector3Tuple = [0, 0, 1];
    // Daughter: at a right angle, beside the near (proximal) end of the mother.
    const daughterAxis: Vector3Tuple = [1, 0, 0];
    const daughterCenter: Vector3Tuple = [0.62 * L, 0, -0.3 * L];

    const mother = this._addPart(
      'motherCentriole',
      new InstancedMobject({
        geometry,
        material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
        instances: centrioleRods(motherCenter, motherAxis, L, rodR, colors),
      }),
    );
    this._addPart(
      'daughterCentriole',
      new InstancedMobject({
        geometry: geometry.clone(),
        material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
        instances: centrioleRods(daughterCenter, daughterAxis, 0.9 * L, rodR, colors),
      }),
    );
    if (pcm) {
      // The pericentriolar material as a faint haze of small light particles:
      // a solid translucent cloud reads as a dark smudge on a dark field.
      const rng = this._rng(41);
      const haze: { position: Vector3Tuple; scale: number; color: string }[] = [];
      const light = this._partColor('pcm', interpolateColor(main, '#ffffff', 0.7));
      while (haze.length < 70) {
        const p: Vector3Tuple = [rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)];
        if (lengthVec(p) > 1) continue;
        haze.push({
          position: addVec(
            [0.3 * L, 0, -0.1 * L],
            [1.0 * L * p[0], 0.8 * L * p[1], 0.8 * L * p[2]],
          ),
          scale: rng.range(0.6, 1.2),
          color: light,
        });
      }
      this._addPart(
        'pcm',
        new InstancedMobject({
          geometry: sphereGeometry(0.035 * L, 1),
          material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
          opacity: 0.45,
          instances: haze,
        }),
        { outline: false },
      );
    }
    this._setAnchor('mother', [0, -0.25 * L, 0.3 * L], mother);
    this._setAnchor('daughter', addVec(daughterCenter, [0.2 * L, -0.25 * L, 0]), mother);
    this._setAnchor('triplet', [0.25 * L, 0, 0.45 * L], mother);
    this._setAnchor('center', [0.3 * L, 0, -0.15 * L], mother);
    this._finish(eulerFromAxes(orthogonalTo(direction), direction));
  }

  protected _buildSteps(): BuildStep[] {
    const steps: BuildStep[] = [
      { part: this.getPart('motherCentriole')!, mode: 'grow' },
      { part: this.getPart('daughterCentriole')!, mode: 'grow' },
    ];
    const pcm = this.getPart('pcm');
    if (pcm) steps.push({ part: pcm, mode: 'fade', weight: 0.6 });
    return steps;
  }

  override getFocusFraming(): CameraFocusOptions {
    return { fill: 0.5, phi: 0.95, theta: -1.1 };
  }
}

/** A unit vector at a right angle to `d`, near +X. */
function orthogonalTo(d: Vector3Tuple): Vector3Tuple {
  return orthonormalFrame(normalizeVec(d)).u;
}
