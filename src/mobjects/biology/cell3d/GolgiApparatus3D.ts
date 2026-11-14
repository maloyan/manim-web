/**
 * GolgiApparatus3D: a stack of curved, flattened sacs (cisternae).
 *
 * The cisternae get smaller from the entry (cis) side to the exit (trans)
 * side, and their color runs on a gradient between the two sides. Small
 * vesicles bud from the rims; more of them gather on the exit side.
 *
 * The stack runs along `direction` (entry to exit); the long axis of each
 * sac follows `up`.
 *
 * Parts: `cisterna0` ... `cisternaN` (entry to exit), `vesicles`.
 * Anchors: `entrySide`, `exitSide`, `cisterna`, `vesicle`, `center`.
 */

import * as THREE from 'three';
import type { Vector3Tuple } from '../../../core/Mobject';
import { Extrude3D } from '../../three-d/Extrude3D';
import { InstancedMobject } from '../../three-d/InstancedMobject';
import type { InstanceTransform } from '../../three-d/InstancedMobject';
import type { Point2D } from '../../three-d/Extrude3D';
import { interpolateColor } from '../../../utils/color';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { byDetail, eulerFromAxes, sphereGeometry } from './geometry';
import { Organelle3D, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** Options of {@link GolgiApparatus3D}. */
export interface GolgiApparatus3DOptions extends Organelle3DOptions {
  /** Long diameter of the largest (entry) cisterna. Default: 1.6 */
  size?: number;
  /** Number of cisternae. Default: by detail (4, 6, 7) */
  cisternae?: number;
  /** Direction of the stack, from the entry side to the exit side. Default: [1, 0, 0] */
  direction?: Vector3Tuple;
  /** Direction of the long axis of the sacs. Default: [0, 0, 1] */
  up?: Vector3Tuple;
  /** Color of the entry-side cisterna. Default: a light shade of the Golgi color. */
  entryColor?: string;
  /** Color of the exit-side cisterna. Default: a warm gold. */
  exitColor?: string;
  /** Number of budding vesicles. Default: by detail */
  vesicles?: number;
}

/** A gently lobed ellipse outline. */
function lobedEllipse(
  a: number,
  b: number,
  lobes: number,
  amp: number,
  phase: number,
  n: number,
): Point2D[] {
  return Array.from({ length: n }, (_, i): Point2D => {
    const t = (2 * Math.PI * i) / n;
    const k = 1 + amp * Math.sin(lobes * t + phase);
    return [a * k * Math.cos(t), b * k * Math.sin(t)];
  });
}

export class GolgiApparatus3D extends Organelle3D {
  private readonly _count: number;
  private readonly _direction: Vector3Tuple;

  constructor(options: GolgiApparatus3DOptions = {}) {
    super('golgi apparatus', options);
    const { size = 1.6, direction = [1, 0, 0], up = [0, 0, 1] } = options;
    const count = Math.max(2, options.cisternae ?? byDetail(this._detail, [4, 6, 7] as const));
    this._count = count;
    this._direction = [...direction];
    const main = this._mainColor;
    const entry =
      options.entryColor ?? this._partColor('entry', interpolateColor(main, '#B2EBF2', 0.35));
    const exit = options.exitColor ?? this._partColor('exit', '#FFC857');
    const n = byDetail(this._detail, [40, 64, 96] as const);
    const rng = this._rng(1);
    const depth = 0.065 * size;
    const step = 0.115 * size;
    const bendR = 1.05 * size;
    const z0 = -((count - 1) * step) / 2;

    const cisternae: Extrude3D[] = [];
    const radii: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1);
      const a = 0.5 * size * (1 - 0.32 * f);
      const b = 0.6 * a;
      radii.push([a, b]);
      const color = interpolateColor(entry, exit, f);
      cisternae.push(
        this._addPart(
          `cisterna${i}`,
          new Extrude3D({
            outline: lobedEllipse(a, b, 3 + (i % 2), 0.035, rng.range(0, 6.28), n),
            depth,
            bevel: 0.45 * depth,
            bevelSegments: 3,
            bend: { radius: bendR, mode: 'sphere' },
            center: [0, 0, z0 + i * step],
            color,
            capColor: interpolateColor(color, '#ffffff', 0.15),
          }),
        ),
      );
    }

    // Sphere bend: a point at distance rho from the axis moves toward +Z.
    const sag = (rho: number) => bendR - Math.sqrt(Math.max(0, bendR * bendR - rho * rho));
    const total = options.vesicles ?? byDetail(this._detail, [14, 28, 44] as const);
    const vesicleR = 0.045 * size;
    const instances: InstanceTransform[] = [];
    for (let k = 0; k < total; k++) {
      // Bias toward the exit side: f in 0..1 with more mass near 1.
      const f = Math.sqrt(rng());
      const beyond = rng() < 0.3;
      const i = Math.min(count - 1, Math.floor(f * count));
      const [a, b] = radii[i];
      const t = rng.range(0, 2 * Math.PI);
      const out = beyond ? rng.range(0.4, 0.95) : rng.range(1.02, 1.18);
      const rx = a * out * Math.cos(t);
      const ry = b * out * Math.sin(t);
      const zBase = z0 + i * step + sag(Math.hypot(rx, ry));
      const z = beyond
        ? z0 + (count - 1) * step + rng.range(0.12, 0.3) * size + sag(Math.hypot(rx, ry))
        : zBase + rng.range(-0.3, 0.3) * step;
      instances.push({
        position: [rx, ry, z],
        scale: rng.range(0.75, 1.25),
        color: interpolateColor(entry, exit, Math.min(1, beyond ? 1 : f + 0.1)),
      });
    }
    // Entry-side vesicles arriving from the ER.
    for (let k = 0; k < Math.max(2, Math.round(total / 6)); k++) {
      const t = rng.range(0, 2 * Math.PI);
      const [a, b] = radii[0];
      instances.push({
        position: [0.6 * a * Math.cos(t), 0.6 * b * Math.sin(t), z0 - rng.range(0.1, 0.22) * size],
        scale: rng.range(0.8, 1.1),
        color: entry,
      });
    }
    instances.sort((p, q) => p.position[2] - q.position[2]);
    this._addPart(
      'vesicles',
      new InstancedMobject({
        geometry: sphereGeometry(vesicleR, 2),
        material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
        instances,
      }),
    );

    const first = cisternae[0];
    const last = cisternae[count - 1];
    this._setAnchor('entrySide', [0, 0, z0 - depth], first);
    this._setAnchor('exitSide', [0, 0, z0 + (count - 1) * step + sag(0) + depth], last);
    const mid = Math.floor(count / 2);
    this._setAnchor(
      'cisterna',
      [radii[mid][0] * 0.98, 0, z0 + mid * step + sag(radii[mid][0])],
      cisternae[mid],
    );
    const v = instances[instances.length - 1];
    this._setAnchor('vesicle', v ? v.position : [0, 0, 0], last);
    this._setAnchor('center', [0, 0, 0], first);
    this._finish(eulerFromAxes(up, direction));
  }

  /** Direction of the stack, entry to exit, in the parent frame (before later moves). */
  getDirection(): Vector3Tuple {
    return [...this._direction];
  }

  protected _buildSteps(): BuildStep[] {
    const steps: BuildStep[] = [];
    for (let i = 0; i < this._count; i++)
      steps.push({ part: this.getPart(`cisterna${i}`)!, mode: 'create', weight: 0.8 });
    steps.push({ part: this.getPart('vesicles')!, mode: 'grow', weight: 1.2 });
    return steps;
  }

  override getFocusFraming(): CameraFocusOptions {
    // Look at the stack from the side, a little from the entry side.
    const d = this._direction;
    return { fill: 0.55, phi: 1.15, theta: Math.atan2(d[1], d[0]) - 2.1 };
  }
}
