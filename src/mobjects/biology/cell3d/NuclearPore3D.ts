/**
 * NuclearPore3D: one nuclear pore complex at close-up detail.
 *
 * A patch of the double nuclear envelope with a hole where the outer and the
 * inner membrane meet. In the hole sit eight-fold rings of protein (a
 * cytoplasmic ring above and a nuclear ring below), a central channel, eight
 * cytoplasmic filaments that reach up, and the nuclear basket below. The
 * cytoplasm is on the +Z side.
 *
 * Parts: `outerMembrane`, `innerMembrane`, `poreWall`, `cytoplasmicRing`,
 * `nuclearRing`, `channel`, `filaments`, `basket`.
 * Anchors: `channel`, `cytoplasmicSide`, `nuclearSide`, `ring`, `basket`,
 * `filament`, `envelope`.
 */

import * as THREE from 'three';
import type { Vector3Tuple } from '../../../core/Mobject';
import { Extrude3D } from '../../three-d/Extrude3D';
import { Blob3D } from '../../three-d/Blob3D';
import { TubeNetwork3D } from '../../three-d/TubeNetwork3D';
import { InstancedMobject } from '../../three-d/InstancedMobject';
import { interpolateColor } from '../../../utils/color';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { byDetail, chainsToGraph, ellipseOutline, mergedSpheres, smoothPolyline } from './geometry';
import { Organelle3D, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** Options of {@link NuclearPore3D}. */
export interface NuclearPore3DOptions extends Organelle3DOptions {
  /** Radius of the pore ring. Default: 0.5 */
  size?: number;
  /** Radius of the membrane patch around the pore, as a multiple of size. Default: 3.2 */
  patch?: number;
  /** Show the central channel. Default: true */
  channel?: boolean;
}

export class NuclearPore3D extends Organelle3D {
  private readonly _size: number;

  constructor(options: NuclearPore3DOptions = {}) {
    super('nuclear pore', options, 'nucleus');
    const { size = 0.5, patch = 2.4, channel = true } = options;
    if (!(Number.isFinite(size) && size > 0))
      throw new Error(`NuclearPore3D: size must be a positive number, got ${size}.`);
    // The patch must be wider than the pore hole (0.92 size).
    if (!(patch > 1))
      throw new Error(`NuclearPore3D: patch must be > 1 (wider than the pore), got ${patch}.`);
    this._size = size;
    const s = size;
    const main = this._mainColor;
    const proteinColor = this._partColor('ring', '#E1D5FF', 'nuclear pore');
    const n = byDetail(this._detail, [48, 72, 96] as const);
    const hole = ellipseOutline(0.92 * s, 0.92 * s, n);
    const membraneDepth = 0.14 * s;
    const lumen = 0.26 * s;
    const z0 = lumen / 2 + membraneDepth / 2;

    const outer = this._addPart(
      'outerMembrane',
      new Extrude3D({
        outline: ellipseOutline(patch * s, patch * s, n),
        holes: [hole],
        depth: membraneDepth,
        bevel: 0.04 * s,
        center: [0, 0, z0],
        color: main,
        capColor: interpolateColor(main, '#ffffff', 0.12),
      }),
    );
    this._addPart(
      'innerMembrane',
      new Extrude3D({
        outline: ellipseOutline(patch * s, patch * s, n),
        holes: [hole],
        depth: membraneDepth,
        bevel: 0.04 * s,
        center: [0, 0, -z0],
        color: interpolateColor(main, '#000000', 0.2),
      }),
    );
    // Where the two membranes fuse: a short wall that lines the hole.
    this._addPart(
      'poreWall',
      new Extrude3D({
        outline: ellipseOutline(1.08 * s, 1.08 * s, n),
        holes: [hole],
        depth: lumen + 2 * membraneDepth,
        bevel: 0.06 * s,
        color: interpolateColor(main, '#ffffff', 0.2),
      }),
    );

    // Eight-fold rings: each subunit is a lumpy cluster of three beads.
    const unit = mergedSpheres(
      [
        { center: [0, 0, 0], radius: 0.2 * s },
        { center: [0.14 * s, 0.06 * s, 0.05 * s], radius: 0.13 * s },
        { center: [-0.12 * s, 0.07 * s, -0.04 * s], radius: 0.12 * s },
      ],
      byDetail(this._detail, [1, 2, 2] as const),
    );
    const ringInstances = (z: number, scale: number, color: string) =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (2 * Math.PI * i) / 8;
        const p: Vector3Tuple = [0.9 * s * Math.cos(a), 0.9 * s * Math.sin(a), z];
        return { position: p, rotation: [0, 0, a + Math.PI / 2] as Vector3Tuple, scale, color };
      });
    const ringZ = z0 + membraneDepth / 2 + 0.1 * s;
    this._addPart(
      'cytoplasmicRing',
      new InstancedMobject({
        geometry: unit,
        material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
        instances: ringInstances(ringZ, 1, proteinColor),
      }),
    );
    this._addPart(
      'nuclearRing',
      new InstancedMobject({
        geometry: unit.clone(),
        material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
        instances: ringInstances(-ringZ, 0.9, interpolateColor(proteinColor, main, 0.3)),
      }),
    );
    if (channel) {
      this._addPart(
        'channel',
        new Blob3D({
          radius: 0.42 * s,
          lumpiness: 0.12,
          lobes: 10,
          lobeSize: 0.5,
          seed: this._seed + 3,
          detail: 3,
          scale: [1, 1, 0.75],
          color: this._partColor('channel', interpolateColor(proteinColor, '#ffd54f', 0.35)),
          opacity: 0.55,
        }),
      );
    }

    // Cytoplasmic filaments: eight short floppy strands that reach up.
    const rng = this._rng(1);
    const filaments: Vector3Tuple[][] = Array.from({ length: 8 }, (_, i) => {
      const a = (2 * Math.PI * (i + 0.5)) / 8;
      const pts: Vector3Tuple[] = [];
      for (let k = 0; k <= 5; k++) {
        const t = k / 5;
        const r = s * (0.95 + 0.35 * t + rng.range(-0.05, 0.05));
        pts.push([
          r * Math.cos(a + 0.4 * t),
          r * Math.sin(a + 0.4 * t),
          ringZ + 0.1 * s + 0.9 * s * t,
        ]);
      }
      return smoothPolyline(pts, 1);
    });
    const filamentRadius = 0.028 * s;
    this._addPart(
      'filaments',
      new TubeNetwork3D({
        ...chainsToGraph(filaments),
        radius: filamentRadius,
        jointRadius: filamentRadius,
        radialSegments: 6,
        capSegments: 2,
        color: proteinColor,
      }),
    );
    // Nuclear basket: eight strands that curve down and meet a small ring.
    const ringBottom = -ringZ - 1.3 * s;
    const basket: Vector3Tuple[][] = Array.from({ length: 8 }, (_, i) => {
      const a = (2 * Math.PI * i) / 8;
      const pts: Vector3Tuple[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const r = s * (0.9 - 0.55 * t * t + 0.25 * Math.sin(Math.PI * t));
        pts.push([
          r * Math.cos(a),
          r * Math.sin(a),
          -ringZ - 0.1 * s + (ringBottom + ringZ + 0.1 * s) * t,
        ]);
      }
      return smoothPolyline(pts, 1);
    });
    const distal = Array.from({ length: 25 }, (_, k): Vector3Tuple => {
      const a = (2 * Math.PI * k) / 24;
      return [0.35 * s * Math.cos(a), 0.35 * s * Math.sin(a), ringBottom];
    });
    this._addPart(
      'basket',
      new TubeNetwork3D({
        ...chainsToGraph([...basket, distal]),
        radius: filamentRadius,
        jointRadius: filamentRadius,
        radialSegments: 6,
        capSegments: 2,
        color: interpolateColor(proteinColor, main, 0.3),
      }),
    );

    this._setAnchor('channel', [0, 0, 0], outer);
    this._setAnchor('cytoplasmicSide', [0, 0, ringZ + 0.9 * s], outer);
    this._setAnchor('nuclearSide', [0, 0, -ringZ - 0.6 * s], outer);
    this._setAnchor('ring', [0.9 * s, 0, ringZ + 0.15 * s], outer);
    this._setAnchor('basket', [0, -0.35 * s, ringBottom], outer);
    this._setAnchor('filament', filaments[2][filaments[2].length - 1], outer);
    this._setAnchor('envelope', [-2.2 * s, -1.2 * s, z0 + membraneDepth / 2], outer);
    this._finish();
  }

  /** Radius of the pore ring. */
  getSize(): number {
    return this._size;
  }

  protected _buildSteps(): BuildStep[] {
    const names = [
      'outerMembrane',
      'innerMembrane',
      'poreWall',
      'nuclearRing',
      'cytoplasmicRing',
      'channel',
      'filaments',
      'basket',
    ];
    return names
      .map((name) => this.getPart(name))
      .filter((p) => p !== undefined)
      .map((part, i) => ({
        part,
        mode: i >= 6 ? ('grow' as const) : i >= 3 ? ('fade' as const) : ('create' as const),
      }));
  }

  override getFocusFraming(): CameraFocusOptions {
    return { fill: 0.55, phi: 1.05, theta: -1.3 };
  }
}
