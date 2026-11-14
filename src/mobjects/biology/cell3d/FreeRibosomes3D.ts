/**
 * FreeRibosomes3D: the free ribosomes of the cytoplasm, as one instanced
 * crowd of two-subunit ribosomes, with per-instance colors (so a focus dim
 * can wash them exactly).
 *
 * Parts: `ribosomes`. Anchors: `ribosome`, `center`.
 *
 * A dense crowd hides what lies behind it. {@link clearAround} shrinks the
 * ribosomes inside a sphere to nothing (and grows them back), so a tour stop
 * can show the organelle it frames without a curtain of dots in front.
 */

import * as THREE from 'three';
import type { Vector3Tuple } from '../../../core/Mobject';
import { InstancedMobject } from '../../three-d/InstancedMobject';
import { toInstances } from '../../three-d/scatter';
import { interpolateColor } from '../../../utils/color';
import { lengthVec, subVec } from '../../../utils/vectors';
import type { AnimationOptions } from '../../../animation/Animation';
import { LazyStateAnimation } from '../../../animation/camera/LazyStateAnimation';
import { ribosomeGeometry } from './geometry';
import { Organelle3D, kitColor, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** Options of {@link FreeRibosomes3D}. */
export interface FreeRibosomes3DOptions extends Organelle3DOptions {
  /** Ribosome positions (organelle frame). */
  points: Vector3Tuple[];
  /** Size of one ribosome. Default: 0.04 */
  size?: number;
}

/** A ribosome at most this visible is drawn at this scale (never exactly 0). */
const HIDDEN = 1e-4;

/** Options of {@link FreeRibosomes3D.clearAround}. */
export interface ClearAroundOptions extends AnimationOptions {
  /**
   * Width of the soft edge, as a fraction of the radius: ribosomes in the
   * outer band shrink part of the way. Default: 0.25
   */
  softness?: number;
}

/** Seekable change of the per-ribosome visibility (0 hidden, 1 shown). */
class CrowdClearance extends LazyStateAnimation<Float32Array> {
  constructor(
    private readonly _crowd: FreeRibosomes3D,
    private readonly _target: (from: Float32Array) => Float32Array,
    options: AnimationOptions,
  ) {
    super({ duration: 1.5, ...options });
  }
  protected captureState(): Float32Array {
    return this._crowd.getVisibility();
  }
  protected targetState(from: Float32Array): Float32Array {
    return this._target(from);
  }
  protected applyState(from: Float32Array, to: Float32Array, alpha: number): void {
    const v = new Float32Array(from.length);
    for (let i = 0; i < v.length; i++) v[i] = from[i] + (to[i] - from[i]) * alpha;
    this._crowd.setVisibility(v);
  }
}

export class FreeRibosomes3D extends Organelle3D {
  private readonly _points: Vector3Tuple[];
  private readonly _scales: number[];
  private _visibility: Float32Array;

  constructor(options: FreeRibosomes3DOptions) {
    super('ribosome', options);
    const { points, size = 0.04 } = options;
    const main = kitColor('ribosome', this._colorOverrides);
    const shades = [
      main,
      interpolateColor(main, '#ffffff', 0.2),
      interpolateColor(main, '#000000', 0.15),
    ];
    // The build-up spreads out from the centre of the crowd.
    const center = points.reduce<Vector3Tuple>(
      (acc, p) => [
        acc[0] + p[0] / points.length,
        acc[1] + p[1] / points.length,
        acc[2] + p[2] / points.length,
      ],
      [0, 0, 0],
    );
    const sorted = [...points].sort(
      (a, b) => lengthVec(subVec(a, center)) - lengthVec(subVec(b, center)),
    );
    const instances = toInstances(sorted, { seed: this._seed, scale: [0.8, 1.2], colors: shades });
    this._points = sorted;
    this._scales = instances.map((t) => (typeof t.scale === 'number' ? t.scale : 1));
    this._visibility = new Float32Array(sorted.length).fill(1);
    const crowd = this._addPart(
      'ribosomes',
      new InstancedMobject({
        geometry: ribosomeGeometry(size),
        material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
        instances,
      }),
      { outline: false },
    );
    this._setAnchor('ribosome', sorted[0] ?? center, crowd);
    this._setAnchor('center', center, crowd);
    this._finish();
  }

  /** Number of ribosomes in the crowd. */
  get count(): number {
    return this._points.length;
  }

  /** A copy of the visibility of each ribosome (0 hidden .. 1 shown). */
  getVisibility(): Float32Array {
    return this._visibility.slice();
  }

  /**
   * Set the visibility of each ribosome: it is drawn at its own scale times
   * the visibility.
   * @pre visibility.length === this.count
   * @post this.getVisibility()[i] === visibility[i]
   */
  setVisibility(visibility: ArrayLike<number>): this {
    const crowd = this.getPart('ribosomes') as InstancedMobject;
    for (let i = 0; i < this._points.length; i++) {
      const v = visibility[i];
      if (v === this._visibility[i]) continue;
      this._visibility[i] = v;
      crowd.setInstanceTransform(i, { scale: Math.max(HIDDEN, v * this._scales[i]) });
    }
    return this;
  }

  /**
   * An animation that hides the ribosomes within `radius` of `center` (world
   * space) and shows every other one. `radius` 0 (or a null centre) shows
   * them all again. Seekable: the start state is read on the first frame.
   */
  clearAround(
    center: Vector3Tuple | null,
    radius: number,
    options: ClearAroundOptions = {},
  ): LazyStateAnimation<Float32Array> {
    const { softness = 0.25, ...animation } = options;
    return new CrowdClearance(
      this,
      () => {
        const to = new Float32Array(this._points.length).fill(1);
        if (!center || radius <= 0) return to;
        const crowd = this.getPart('ribosomes') as InstancedMobject;
        const m = crowd._worldMatrix();
        const p = new THREE.Vector3();
        const inner = radius * (1 - softness);
        for (let i = 0; i < to.length; i++) {
          p.set(...this._points[i]).applyMatrix4(m);
          const d = lengthVec(subVec([p.x, p.y, p.z], center));
          to[i] = d >= radius ? 1 : d <= inner ? 0 : (d - inner) / (radius - inner);
        }
        return to;
      },
      animation,
    );
  }

  protected _buildSteps(): BuildStep[] {
    return [{ part: this.getPart('ribosomes')!, mode: 'grow' }];
  }
}
