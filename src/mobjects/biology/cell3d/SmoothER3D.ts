/**
 * SmoothER3D: the smooth endoplasmic reticulum, a net of branching tubes with
 * no ribosomes, merged into one mesh. Optional pale lipid droplets sit in the
 * net (new fats).
 *
 * The net fills an ellipsoidal slab of `size` (x along the net, z its
 * thickness). With `bend`, the slab curves around an axis parallel to +Z at
 * that distance on the -Y side, so it can follow the rough ER around a nucleus.
 *
 * A slab smaller than the lattice spacing gets a minimal net: one tube along x.
 *
 * Parts: `network`, `droplets` (when droplets > 0).
 * Anchors: `tube`, `droplet`, `center`, `edge`.
 */

import * as THREE from 'three';
import type { Vector3Tuple } from '../../../core/Mobject';
import { TubeNetwork3D } from '../../three-d/TubeNetwork3D';
import { InstancedMobject } from '../../three-d/InstancedMobject';
import { scatterInVolume, toInstances } from '../../three-d/scatter';
import { interpolateColor } from '../../../utils/color';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { byDetail, sphereGeometry } from './geometry';
import { Organelle3D, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** Options of {@link SmoothER3D}. */
export interface SmoothER3DOptions extends Organelle3DOptions {
  /** Size of the slab [x, y, z]. Default: [2.4, 1.4, 0.45] */
  size?: Vector3Tuple;
  /** Lattice spacing. Default: by detail (0.3, 0.22, 0.17) */
  spacing?: number;
  /** Tube radius. Default: 0.045 */
  radius?: number;
  /** Curve the slab around an axis parallel to +Z at this distance (0 = flat). Default: 0 */
  bend?: number;
  /** Number of lipid droplets. Default: 5 */
  droplets?: number;
}

export class SmoothER3D extends Organelle3D {
  constructor(options: SmoothER3DOptions = {}) {
    super('smooth er', options);
    const { size = [2.4, 1.4, 0.45], radius = 0.045, bend = 0, droplets = 5 } = options;
    const spacing = options.spacing ?? byDetail(this._detail, [0.3, 0.22, 0.17] as const);
    // A bend maps x to an angle on a circle of radius `bend` around (0, bend).
    const warp = (p: Vector3Tuple): Vector3Tuple => {
      if (bend <= 0) return p;
      const a = p[0] / bend;
      const r = bend - p[1];
      return [r * Math.sin(a), bend - r * Math.cos(a), p[2]];
    };
    if (!size.every((v) => Number.isFinite(v) && v >= 0))
      throw new Error(`SmoothER3D: size must be three finite numbers >= 0, got [${size}].`);
    if (!(Number.isFinite(spacing) && spacing > 0))
      throw new Error(`SmoothER3D: spacing must be a positive number, got ${spacing}.`);
    const lattice = TubeNetwork3D.lattice({
      size,
      spacing,
      shape: 'ellipsoid',
      jitter: 0.3,
      dropout: 0.12,
      diagonals: 0.35,
      seed: this._seed,
      warp,
    });
    // A slab smaller than the spacing holds no lattice edge: use a minimal net,
    // one tube along the slab.
    const half = Math.max(size[0] / 2, 2 * radius);
    const graph =
      lattice.edges.length > 0
        ? lattice
        : {
            nodes: [warp([-half, 0, 0]), warp([half, 0, 0])],
            edges: [[0, 1]] as [number, number][],
          };
    // Start the build-up from the node nearest one end of the slab.
    let root = 0;
    graph.nodes.forEach((p, i) => {
      if (p[0] < graph.nodes[root][0]) root = i;
    });
    const main = this._mainColor;
    const network = this._addPart(
      'network',
      new TubeNetwork3D({
        ...graph,
        radius,
        jointRadius: 1.45 * radius,
        radialSegments: byDetail(this._detail, [6, 8, 10] as const),
        capSegments: 2,
        root,
        color: main,
      }),
    );

    if (droplets > 0) {
      const rng = this._rng(2);
      const centers = scatterInVolume({
        count: droplets,
        size: [size[0] * 0.8, size[1] * 0.7, size[2] * 0.4],
        shape: 'ellipsoid',
        seed: this._seed + 9,
        minDistance: 0.3,
      }).map(warp);
      this._addPart(
        'droplets',
        new InstancedMobject({
          geometry: sphereGeometry(0.09, 2),
          material: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
          instances: toInstances(centers, { seed: this._seed, scale: [0.7, 1.2], spin: false }).map(
            (t) => ({
              ...t,
              color: this._partColor('droplet', interpolateColor('#FFF8E1', main, 0.15)),
              position: [
                t.position[0],
                t.position[1],
                t.position[2] + rng.range(0, 0.1),
              ] as Vector3Tuple,
            }),
          ),
        }),
      );
      this._setAnchor('droplet', centers[0] ?? [0, 0, 0], network);
    }
    const nodes = graph.nodes;
    const top = nodes.reduce((best, p) => (p[2] > best[2] ? p : best), nodes[0]);
    const edge = nodes.reduce((best, p) => (p[0] > best[0] ? p : best), nodes[0]);
    this._setAnchor('tube', top, network);
    this._setAnchor('edge', edge, network);
    this._setAnchor('center', warp([0, 0, 0]), network);
    this._finish();
  }

  protected _buildSteps(): BuildStep[] {
    const steps: BuildStep[] = [{ part: this.getPart('network')!, mode: 'grow', weight: 1.6 }];
    const droplets = this.getPart('droplets');
    if (droplets) steps.push({ part: droplets, mode: 'fade', weight: 0.6 });
    return steps;
  }

  override getFocusFraming(): CameraFocusOptions {
    return { fill: 0.6, phi: 0.9 };
  }
}
