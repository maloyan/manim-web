/**
 * RoughER3D: the rough endoplasmic reticulum.
 *
 * Stacked curved sheets (cisternae) that wrap part of the way around a centre
 * line: in a cell, the nucleus. Each sheet is a flat sac, so its cut top shows
 * the lumen as a slot between two membrane walls. Ribosomes stud the outer
 * (cytosolic) faces as one instanced crowd.
 *
 * Built around the local +Z axis: put the organelle at the nucleus centre and
 * set `innerRadius` just beyond the nuclear envelope.
 *
 * Parts: `sheet0` ... `sheetN` (inner to outer), `ribosomes`.
 * Anchors: `sheet`, `lumen`, `ribosome`, `nucleusSide`, `outerSheet`.
 */

import * as THREE from 'three';
import { Extrude3D } from '../../three-d/Extrude3D';
import { InstancedMobject } from '../../three-d/InstancedMobject';
import { scatterOnMesh, toInstances, type SurfacePoint } from '../../three-d/scatter';
import { interpolateColor } from '../../../utils/color';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { arcBandOutline, byDetail, ribosomeGeometry } from './geometry';
import { Organelle3D, kitColor, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** Options of {@link RoughER3D}. */
export interface RoughER3DOptions extends Organelle3DOptions {
  /** Radius of the innermost sheet (its inner face). Default: 1.15 */
  innerRadius?: number;
  /** Number of sheets. Default: by detail (3, 4, 5) */
  sheets?: number;
  /** Radial distance between sheet centres. Default: 0.3 */
  spacing?: number;
  /** Radial thickness of one sheet (the flat sac). Default: 0.13 */
  thickness?: number;
  /** Height of the sheets along Z. Default: 0.8 */
  height?: number;
  /** Start azimuth of the sheets about +Z. Default: 0.75 * PI */
  arcStart?: number;
  /** Angle the sheets wrap. Default: 1.15 * PI */
  arcAngle?: number;
  /** Ribosome count (all sheets). Default: by detail */
  ribosomes?: number;
}

/** Throw a clear error when a size option is not positive (spacing: not >= 0). */
function checkRoughER(positive: Record<string, number>, spacing: number): void {
  for (const [name, v] of Object.entries(positive)) {
    if (!(Number.isFinite(v) && v > 0))
      throw new Error(`RoughER3D: ${name} must be a positive number, got ${v}.`);
  }
  if (!(Number.isFinite(spacing) && spacing >= 0))
    throw new Error(`RoughER3D: spacing must be a number >= 0, got ${spacing}.`);
}

export class RoughER3D extends Organelle3D {
  private readonly _sheetCount: number;

  constructor(options: RoughER3DOptions = {}) {
    super('rough er', options);
    const {
      innerRadius = 1.15,
      spacing = 0.3,
      thickness = 0.13,
      height = 0.8,
      arcStart = 0.75 * Math.PI,
      arcAngle = 1.15 * Math.PI,
    } = options;
    checkRoughER({ innerRadius, thickness, height, arcAngle }, spacing);
    const count = Math.max(1, options.sheets ?? byDetail(this._detail, [3, 4, 5] as const));
    this._sheetCount = count;
    const main = this._mainColor;
    const cap = this._partColor('lumen', interpolateColor(main, '#ffffff', 0.35));
    const n = byDetail(this._detail, [40, 72, 110] as const);
    const wall = 0.3 * thickness;
    const rng = this._rng(1);

    const sheets: Extrude3D[] = [];
    const mids: ((t: number) => number)[] = [];
    for (let i = 0; i < count; i++) {
      const r0 = innerRadius + i * spacing;
      const r1 = r0 + thickness;
      // Outer sheets wrap a bit less, and every sheet wobbles on its own.
      const sweep = arcAngle * (1 - 0.06 * i) * rng.range(0.92, 1);
      const start = arcStart + (arcAngle - sweep) * rng.range(0.2, 0.8);
      const amp = 0.035 * (1 + i * 0.3);
      const freq = rng.range(2, 4);
      const phase = rng.range(0, 2 * Math.PI);
      const wobble = (t: number) => amp * Math.sin(2 * Math.PI * freq * t + phase);
      const inset = wall / ((r0 + r1) / 2);
      const holes =
        thickness > 3 * wall
          ? [
              arcBandOutline(
                r0 + wall,
                r1 - wall,
                start + inset,
                sweep - 2 * inset,
                (t) => wobble(inset / sweep + t * (1 - (2 * inset) / sweep)),
                n,
              ),
            ]
          : [];
      const sheet = this._addPart(
        `sheet${i}`,
        new Extrude3D({
          outline: arcBandOutline(r0, r1, start, sweep, wobble, n),
          holes,
          depth: height * (1 - 0.05 * i),
          bevel: Math.min(0.03, wall * 0.45),
          bevelSegments: 2,
          color: interpolateColor(main, '#0d1b3d', 0.08 * i),
          capColor: cap,
        }),
      );
      sheets.push(sheet);
      const mid = (r0 + r1) / 2;
      mids.push((t) => mid + wobble(t));
      if (i === 0) {
        const a = start + sweep * 0.55;
        this._setAnchor('nucleusSide', [r0 * Math.cos(a), r0 * Math.sin(a), 0], sheet);
        this._setAnchor('lumen', [mid * Math.cos(a), mid * Math.sin(a), height / 2], sheet);
      }
      if (i === count - 1) {
        const a = start + sweep * 0.5;
        this._setAnchor('outerSheet', [r1 * Math.cos(a), r1 * Math.sin(a), 0], sheet);
      }
      if (i === Math.floor(count / 2)) {
        const a = start + sweep * 0.45;
        this._setAnchor('sheet', [r1 * Math.cos(a), r1 * Math.sin(a), height * 0.3], sheet);
      }
    }

    const total = options.ribosomes ?? byDetail(this._detail, [900, 2400, 4200] as const);
    const ribosomeColor = kitColor('ribosome', this._colorOverrides);
    const shades = [
      ribosomeColor,
      interpolateColor(ribosomeColor, '#ffffff', 0.18),
      interpolateColor(ribosomeColor, '#000000', 0.12),
    ];
    const points: SurfacePoint[] = [];
    sheets.forEach((sheet, i) => {
      const mid = mids[i];
      const half = thickness / 2;
      points.push(
        ...scatterOnMesh(sheet, {
          count: Math.round(total / count),
          seed: this._seed * 31 + i,
          minDistance: 0.05,
          // Outer faces only (the cytosolic side), not the lumen walls or caps.
          filter: (p) => {
            if (Math.abs(p.normal[2]) > 0.55) return false;
            const r = Math.hypot(p.position[0], p.position[1]);
            const angle = Math.atan2(p.position[1], p.position[0]);
            const t =
              ((((angle - arcStart) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / arcAngle;
            return Math.abs(r - mid(Math.min(1, t))) > half - wall / 2;
          },
        }),
      );
    });
    // Sorted by azimuth, so the crowd appears along the sheets in the build-up.
    points.sort(
      (a, b) => Math.atan2(a.position[1], a.position[0]) - Math.atan2(b.position[1], b.position[0]),
    );
    this._addPart(
      'ribosomes',
      new InstancedMobject({
        geometry: ribosomeGeometry(0.036),
        material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
        instances: toInstances(points, { seed: this._seed, scale: [0.85, 1.15], colors: shades }),
      }),
      { outline: false },
    );
    const sample = points[Math.floor(points.length / 2)];
    this._setAnchor('ribosome', sample ? sample.position : [innerRadius, 0, 0], sheets[0]);
    this._finish();
  }

  /** Number of sheets. */
  getSheetCount(): number {
    return this._sheetCount;
  }

  protected _buildSteps(): BuildStep[] {
    const steps: BuildStep[] = [];
    for (let i = 0; i < this._sheetCount; i++)
      steps.push({ part: this.getPart(`sheet${i}`)!, mode: 'create' });
    steps.push({ part: this.getPart('ribosomes')!, mode: 'grow', weight: 1.4 });
    return steps;
  }

  override getFocusFraming(): CameraFocusOptions {
    return { fill: 0.6, phi: 0.85 };
  }
}
