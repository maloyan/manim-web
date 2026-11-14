/**
 * Vesicle3D: a small membrane bubble, with presets for a lysosome and a
 * peroxisome.
 *
 * The membrane is a near sphere. A translucent membrane shows the contents:
 * cargo dots in a transport vesicle, enzyme granules in a lysosome, and the
 * crystal-like core of a peroxisome (urate oxidase in many animals). The
 * contents stay opaque, so they show through the membrane.
 *
 * Parts: `membrane`, `contents` (when shown).
 * Anchors: `membrane`, `lumen`, `center`.
 */

import * as THREE from 'three';
import { Blob3D } from '../../three-d/Blob3D';
import { Extrude3D } from '../../three-d/Extrude3D';
import { InstancedMobject } from '../../three-d/InstancedMobject';
import { scatterInVolume, toInstances } from '../../three-d/scatter';
import { interpolateColor } from '../../../utils/color';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { byDetail, sphereGeometry } from './geometry';
import { Organelle3D, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** Kind of vesicle. */
export type VesiclePreset = 'transport' | 'lysosome' | 'peroxisome';

/** Options of {@link Vesicle3D}. */
export interface Vesicle3DOptions extends Organelle3DOptions {
  /** Radius. Default: 0.3 */
  radius?: number;
  /** Kind of vesicle: sets the color, the contents and the caption. Default: 'transport' */
  preset?: VesiclePreset;
  /** Membrane opacity. Default: 0.55 when the contents show, else 1 */
  opacity?: number;
  /** Show the contents. Default: true */
  contents?: boolean;
}

const PRESET_KIND: Record<VesiclePreset, string> = {
  transport: 'vesicle',
  lysosome: 'lysosome',
  peroxisome: 'peroxisome',
};

const PRESET_FALLBACK: Record<VesiclePreset, string> = {
  transport: '#FFE082',
  lysosome: '#B388FF',
  peroxisome: '#AEEA00',
};

export class Vesicle3D extends Organelle3D {
  private readonly _radius: number;
  readonly preset: VesiclePreset;

  /** A lysosome: a vesicle of digestive enzymes. */
  static lysosome(options: Omit<Vesicle3DOptions, 'preset'> = {}): Vesicle3D {
    return new Vesicle3D({ ...options, preset: 'lysosome' });
  }

  /** A peroxisome: a vesicle with a crystal-like enzyme core. */
  static peroxisome(options: Omit<Vesicle3DOptions, 'preset'> = {}): Vesicle3D {
    return new Vesicle3D({ ...options, preset: 'peroxisome' });
  }

  constructor(options: Vesicle3DOptions = {}) {
    const preset = options.preset ?? 'transport';
    // The 2D palette lysosome (pink) and peroxisome (purple) read as one
    // family here; the kit uses violet and lime unless the caller overrides.
    const kind = PRESET_KIND[preset];
    super(kind, {
      ...options,
      color: options.color ?? options.colors?.[kind] ?? PRESET_FALLBACK[preset],
    });
    this.preset = preset;
    const { radius = 0.3, contents = true } = options;
    this._radius = radius;
    const opacity = options.opacity ?? (contents ? 0.55 : 1);
    const main = this._mainColor;
    const membrane = this._addPart(
      'membrane',
      new Blob3D({
        radius,
        lumpiness: 0.035,
        lobes: 4,
        lobeSize: 0.9,
        seed: this._seed,
        detail: byDetail(this._detail, [2, 3, 4] as const),
        color: main,
        opacity,
      }),
    );
    if (contents) this._buildContents(preset, radius);
    this._setAnchor('membrane', [radius * 0.7, -radius * 0.7, radius * 0.2], membrane);
    this._setAnchor('lumen', [0, 0, 0], membrane);
    this._setAnchor('center', [0, 0, 0], membrane);
    this._finish();
  }

  private _buildContents(preset: VesiclePreset, r: number): void {
    const main = this._mainColor;
    if (preset === 'peroxisome') {
      const h = 0.27 * r;
      const core = new Extrude3D({
        outline: [
          [-h, -h],
          [h, -h],
          [h, h],
          [-h, h],
        ],
        depth: 2 * h,
        bevel: 0.25 * h,
        bevelSegments: 2,
        color: this._partColor('core', interpolateColor(main, '#33691E', 0.55)),
      });
      core.rotate(0.6, [1, 1, 0]);
      this._addPart('contents', core);
      return;
    }
    const count =
      preset === 'lysosome'
        ? byDetail(this._detail, [8, 14, 20] as const)
        : byDetail(this._detail, [4, 6, 9] as const);
    const dot = preset === 'lysosome' ? 0.11 * r : 0.16 * r;
    const points = scatterInVolume({
      count,
      size: [1.3 * r, 1.3 * r, 1.3 * r],
      shape: 'ellipsoid',
      seed: this._seed + 4,
      minDistance: 1.9 * dot,
    });
    const color = this._partColor(
      'contents',
      preset === 'lysosome'
        ? interpolateColor(main, '#311B92', 0.45)
        : interpolateColor(main, '#FF8A65', 0.5),
    );
    this._addPart(
      'contents',
      new InstancedMobject({
        geometry: sphereGeometry(dot, 1),
        material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
        instances: toInstances(points, { seed: this._seed, scale: [0.7, 1.2], colors: [color] }),
      }),
      { outline: false },
    );
  }

  /** Radius of the vesicle. */
  getRadius(): number {
    return this._radius;
  }

  protected _buildSteps(): BuildStep[] {
    const steps: BuildStep[] = [{ part: this.getPart('membrane')!, mode: 'create' }];
    const contents = this.getPart('contents');
    if (contents) steps.push({ part: contents, mode: 'fade', weight: 0.6 });
    return steps;
  }

  protected override _defaultBuildDuration(): number {
    return 1.2;
  }

  override getFocusFraming(): CameraFocusOptions {
    return { fill: 0.4 };
  }
}
