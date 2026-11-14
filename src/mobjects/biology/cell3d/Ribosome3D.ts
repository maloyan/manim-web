/**
 * Ribosome3D: one ribosome at close-up detail.
 *
 * A large subunit sits on a small subunit. A messenger RNA strand runs
 * through the gap between them (along local X), and the new protein leaves
 * the top of the large subunit as a chain of amino-acid beads.
 *
 * {@link setTranslationProgress} puts the ribosome in the state after `k`
 * amino acids: the mRNA has moved k codons and the chain has k beads. The
 * process animation `translateRibosome` drives it.
 *
 * Parts: `largeSubunit`, `smallSubunit`, `mRNA` (optional), `peptide` (optional).
 * Anchors: `largeSubunit`, `smallSubunit`, `decodingSite`, `exitTunnel`,
 * `mRNA`, `peptide`.
 */

import * as THREE from 'three';
import type { Vector3Tuple } from '../../../core/Mobject';
import { Blob3D } from '../../three-d/Blob3D';
import { TubeFromPoints } from '../../three-d/TubeFromPoints';
import { InstancedMobject } from '../../three-d/InstancedMobject';
import { interpolateColor } from '../../../utils/color';
import { residueColor } from '../biologyColors';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { byDetail, pointAlong, polylineLength, smoothPolyline, sphereGeometry } from './geometry';
import { Organelle3D, kitColor, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** Options of {@link Ribosome3D}. */
export interface Ribosome3DOptions extends Organelle3DOptions {
  /** Width of the large subunit. Default: 1 */
  size?: number;
  /** Draw the mRNA strand through the ribosome. Default: true */
  mRNA?: boolean;
  /** Length of the mRNA strand. Default: 5 * size */
  mRNALength?: number;
  /** Number of amino-acid beads in the chain (0 = no chain). Default: 10 */
  peptide?: number;
  /** One-letter residue codes that color the beads (cycled). Default: a short mixed sequence */
  sequence?: string;
  /** How many beads show at first (0 to `peptide`). Default: all */
  shownBeads?: number;
}

export class Ribosome3D extends Organelle3D {
  private readonly _size: number;
  private readonly _beadCount: number;
  private readonly _beadSpacing: number;
  private readonly _peptidePath: Vector3Tuple[];
  private readonly _codon: number;
  private _mrnaShift = 0;
  /** The amino acids shown, as set by {@link setTranslationProgress}. */
  private _progress = 0;

  constructor(options: Ribosome3DOptions = {}) {
    super('ribosome', options);
    const { size = 1, mRNA = true, peptide = 10, sequence = 'MKTAYIAKQRDEGL' } = options;
    if (!(Number.isFinite(size) && size > 0))
      throw new Error(`Ribosome3D: size must be a positive number, got ${size}.`);
    const s = size;
    this._size = s;
    this._beadCount = Math.max(0, Math.floor(peptide));
    this._beadSpacing = 0.18 * s;
    this._codon = 0.16 * s;
    const main = this._mainColor;
    const detail = byDetail(this._detail, [3, 4, 4] as const);

    const large = this._addPart(
      'largeSubunit',
      new Blob3D({
        radius: 0.42 * s,
        lobes: 6,
        lobeSize: 0.75,
        lumpiness: 0.16,
        wobble: 0.3,
        seed: this._seed + 1,
        detail,
        scale: [1.2, 1, 0.9],
        center: [0, 0, 0.3 * s],
        color: main,
      }),
    );
    this._addPart(
      'smallSubunit',
      new Blob3D({
        radius: 0.3 * s,
        lobes: 5,
        lobeSize: 0.7,
        lumpiness: 0.14,
        seed: this._seed + 2,
        detail,
        scale: [1.35, 1, 0.62],
        center: [0, 0.02 * s, -0.24 * s],
        color: this._partColor('smallSubunit', interpolateColor(main, '#ffffff', 0.3)),
      }),
    );

    if (mRNA) {
      const length = options.mRNALength ?? 3.6 * s;
      if (!(Number.isFinite(length) && length > 0))
        throw new Error(
          `Ribosome3D: mRNALength must be a positive number (use mRNA: false for no strand), got ${length}.`,
        );
      const n = 40;
      const pts = Array.from({ length: n + 1 }, (_, i): Vector3Tuple => {
        const x = -length / 2 + (length * i) / n;
        const far = Math.min(1, Math.abs(x) / (0.6 * s));
        return [
          x,
          0.07 * s * Math.sin((1.7 * x) / s) * far,
          -0.02 * s + 0.1 * s * Math.sin((1.1 * x) / s + 1) * far * far,
        ];
      });
      this._addPart(
        'mRNA',
        new TubeFromPoints({
          points: pts,
          radius: 0.045 * s,
          capped: true,
          radialSegments: byDetail(this._detail, [8, 10, 14] as const),
          color: this._partColor('mRNA', kitColor('mrna', this._colorOverrides)),
        }),
      );
    }

    // Path of the chain: out of the exit tunnel, up, then a loose curl.
    const tunnel: Vector3Tuple = [0.12 * s, 0.05 * s, 0.62 * s];
    const raw: Vector3Tuple[] = [tunnel];
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      raw.push([
        tunnel[0] + 0.35 * s * t + 0.25 * s * Math.sin(5 * t),
        tunnel[1] + 0.25 * s * Math.sin(3.5 * t + 0.4) * t,
        tunnel[2] + 1.1 * s * Math.sqrt(t) - 0.15 * s * t * t,
      ]);
    }
    this._peptidePath = smoothPolyline(raw, 2);
    if (this._beadCount > 0) {
      this._addPart(
        'peptide',
        new InstancedMobject({
          geometry: sphereGeometry(0.095 * s, 2),
          material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
          instances: Array.from({ length: this._beadCount }, (_, i) => ({
            position: tunnel,
            color: beadColor(
              this._partColor('peptide', kitColor('peptide', this._colorOverrides)),
              sequence[i % sequence.length] ?? 'A',
            ),
          })),
        }),
      );
    }

    this._setAnchor('largeSubunit', [0.25 * s, -0.3 * s, 0.45 * s], large);
    this._setAnchor('smallSubunit', [0.3 * s, -0.2 * s, -0.32 * s], large);
    this._setAnchor('decodingSite', [0, 0, 0], large);
    this._setAnchor('exitTunnel', tunnel, large);
    this._setAnchor('mRNA', [1.4 * s, 0, 0], large);
    this._setAnchor(
      'peptide',
      pointAlong(
        this._peptidePath,
        Math.min(1, (this._beadSpacing * this._beadCount) / polylineLength(this._peptidePath)),
      ),
      large,
    );
    this.setTranslationProgress(options.shownBeads ?? this._beadCount);
    this._finish();
  }

  /** Width scale of the ribosome. */
  getSize(): number {
    return this._size;
  }

  /** Number of beads the chain has at full length. */
  getPeptideLength(): number {
    return this._beadCount;
  }

  /** The amino acids shown: the last value given to {@link setTranslationProgress}. */
  getTranslationProgress(): number {
    return this._progress;
  }

  /** The path the chain follows out of the exit tunnel (organelle frame). */
  getPeptidePath(): Vector3Tuple[] {
    return this._peptidePath.map((p) => [...p] as Vector3Tuple);
  }

  /**
   * Show the state after `k` amino acids (k may be fractional): the chain has
   * ceil(k) beads, the newest one growing in at the tunnel, and the mRNA has
   * moved k codons toward -X.
   * @pre k >= 0
   */
  setTranslationProgress(k: number): this {
    this._progress = k;
    const beads = this.getPart('peptide');
    if (beads instanceof InstancedMobject) {
      const total = polylineLength(this._peptidePath);
      for (let j = 0; j < this._beadCount; j++) {
        // Bead j was added at step j; it has moved (k - j - 1) spacings since.
        const grow = Math.min(1, Math.max(0, k - j));
        const travel = Math.max(0, k - j - 1) * this._beadSpacing;
        const position = pointAlong(this._peptidePath, total > 0 ? travel / total : 0);
        beads.setInstanceTransform(j, { position, scale: grow < 1e-3 ? 1e-4 : grow });
      }
    }
    const mrna = this.getPart('mRNA');
    if (mrna) {
      const target = (this._beadCount / 2 - k) * this._codon;
      const delta = target - this._mrnaShift;
      if (Math.abs(delta) > 1e-9) {
        // Move along the strand's own +X axis (its frame follows any later move).
        const axis = new THREE.Vector3(1, 0, 0).applyEuler(mrna.rotation);
        mrna.shift([axis.x * delta, axis.y * delta, axis.z * delta]);
        this._mrnaShift = target;
      }
    }
    return this;
  }

  protected _buildSteps(): BuildStep[] {
    const steps: BuildStep[] = [
      { part: this.getPart('smallSubunit')!, mode: 'create' },
      { part: this.getPart('largeSubunit')!, mode: 'create' },
    ];
    const mrna = this.getPart('mRNA');
    if (mrna) steps.push({ part: mrna, mode: 'grow' });
    const beads = this.getPart('peptide');
    if (beads) steps.push({ part: beads, mode: 'grow' });
    return steps;
  }

  override getFocusFraming(): CameraFocusOptions {
    return { fill: 0.5, phi: 1.2, theta: -Math.PI / 2 };
  }
}

/**
 * Bead color: the chain color tinted a little toward the residue palette, so
 * neighbouring amino acids differ but the chain reads as one protein.
 */
function beadColor(chain: string, residue: string): string {
  return interpolateColor(chain, residueColor(residue), 0.3);
}
