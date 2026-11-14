/**
 * Layout of the assembled cell: where each organelle goes, without overlap.
 *
 * Everything is in the cell frame (cell centre at the origin, +Z up, the bowl
 * cut at `cutZ`). The perinuclear organelles take fixed slots around the
 * nucleus, as in an animal cell: rough ER wrapped around one side of the
 * nucleus, smooth ER beyond it, the Golgi stack on the free side with its
 * entry face toward the ER, the centrosome between nucleus and Golgi. The
 * other organelles are scattered by seeded dart throwing into the free space,
 * with their tops just under the cut so they read from above.
 *
 * Each placed organelle reports one or more layout spheres; two spheres of
 * different organelles never overlap, except a `wraps` pair (rough ER around
 * the nucleus).
 */

import type { Vector3Tuple } from '../../../core/Mobject';
import { addVec, lengthVec, scaleVec, subVec } from '../../../utils/vectors';
import type { CellLayoutEntry, OrganelleSpec3D } from './cell3dTypes';
import type { Rng } from './geometry';

/** The space of the cell the layout fills. */
export interface CellSpace {
  /** Semi-axes of the inner wall. */
  radii: Vector3Tuple;
  /** Height of the bowl cut, or null. */
  cutZ: number | null;
  /** Cell radius (the scale of every default size). */
  radius: number;
}

/** Inside the inner wall with a margin, and (with a cut) not above the cut by more than `above`. */
export function fitsInCell(
  space: CellSpace,
  center: Vector3Tuple,
  r: number,
  above = 0.5,
): boolean {
  const [a, b, c] = space.radii;
  const k = [a - r, b - r, c - r];
  if (k.some((v) => v <= 0)) return false;
  const inside = (center[0] / k[0]) ** 2 + (center[1] / k[1]) ** 2 + (center[2] / k[2]) ** 2 <= 1;
  return inside && (space.cutZ === null || center[2] + r <= space.cutZ + above * r);
}

/** Whether a sphere is clear of every layout sphere (with a gap). */
export function isClear(
  entries: CellLayoutEntry[],
  center: Vector3Tuple,
  r: number,
  gap: number,
): boolean {
  return entries.every((e) => lengthVec(subVec(e.center, center)) >= e.radius + r + gap);
}

/** Geometry of the perinuclear slots, all derived from the cell radius. */
export interface PerinuclearSlots {
  nucleusCenter: Vector3Tuple;
  nucleusRadius: number;
  /** Rough ER: centre (nucleus axis), inner radius, spacing, thickness, height, arc. */
  er: {
    center: Vector3Tuple;
    innerRadius: number;
    spacing: number;
    thickness: number;
    height: number;
    arcStart: number;
    arcAngle: number;
  };
  smoothEr: { center: Vector3Tuple; size: Vector3Tuple; bend: number; azimuth: number };
  golgi: { center: Vector3Tuple; size: number; direction: Vector3Tuple };
  centrosome: { center: Vector3Tuple; size: number };
}

/**
 * The fixed slots around the nucleus.
 * @pre space.radius > 0
 */
export function perinuclearSlots(space: CellSpace, sheets: number): PerinuclearSlots {
  const R = space.radius;
  const top = space.cutZ ?? 0.1 * space.radii[2];
  const rn = 0.3 * R;
  const nucleusCenter: Vector3Tuple = [-0.2 * R, 0.12 * R, top - 0.3 * rn];
  const thickness = 0.034 * R;
  // The stack keeps one width; more sheets (higher detail) sit closer.
  const spacing = (0.26 * R - thickness) / Math.max(1, sheets - 1);
  const height = 0.36 * R;
  const innerRadius = 1.1 * rn;
  const er = {
    center: [nucleusCenter[0], nucleusCenter[1], top - 0.01 * R - height / 2] as Vector3Tuple,
    innerRadius,
    spacing,
    thickness,
    height,
    arcStart: 0.5 * Math.PI,
    arcAngle: 0.98 * Math.PI,
  };
  const outerEr = innerRadius + (sheets - 1) * spacing + thickness;
  const smoothAz = -1.95;
  const smoothSize: Vector3Tuple = [0.5 * R, 0.24 * R, 0.1 * R];
  // Just outside the outer ER sheet, curved around the nucleus axis.
  const smoothDist = outerEr + 0.5 * smoothSize[1] + 0.03 * R;
  const smoothEr = {
    center: [
      nucleusCenter[0] + smoothDist * Math.cos(smoothAz),
      nucleusCenter[1] + smoothDist * Math.sin(smoothAz),
      top - 0.09 * R,
    ] as Vector3Tuple,
    size: smoothSize,
    bend: smoothDist,
    azimuth: smoothAz,
  };
  const golgiSize = 0.4 * R;
  const golgiDist = rn + 0.2 * R + 0.16 * golgiSize;
  const golgiAz = -0.12;
  const direction: Vector3Tuple = [Math.cos(golgiAz), Math.sin(golgiAz), 0];
  const golgi = {
    center: addVec(nucleusCenter, scaleVec(golgiDist, direction), [
      0,
      0,
      top - 0.17 * R - nucleusCenter[2],
    ]),
    size: golgiSize,
    direction,
  };
  const cAz = 0.85;
  const centrosome = {
    center: addVec(nucleusCenter, [
      1.3 * rn * Math.cos(cAz),
      1.3 * rn * Math.sin(cAz),
      top - 0.12 * R - nucleusCenter[2],
    ]),
    size: 0.11 * R,
  };
  return { nucleusCenter, nucleusRadius: rn, er, smoothEr, golgi, centrosome };
}

/** A layout sphere. */
export interface LayoutSphere {
  center: Vector3Tuple;
  radius: number;
}

/**
 * Layout spheres along the rough ER arc: two rows (upper and lower half of
 * the sheets), so the free side of the nucleus stays free.
 */
export function erSpheres(slots: PerinuclearSlots, sheets: number): LayoutSphere[] {
  const { er } = slots;
  const band = (sheets - 1) * er.spacing + er.thickness;
  const mid = er.innerRadius + band / 2;
  const r = 0.55 * band;
  const n = 9;
  const out: LayoutSphere[] = [];
  for (let i = 0; i < n; i++) {
    const a = er.arcStart + (er.arcAngle * (i + 0.5)) / n;
    for (const dz of [-0.25 * er.height, 0.25 * er.height]) {
      out.push({
        center: [
          er.center[0] + mid * Math.cos(a),
          er.center[1] + mid * Math.sin(a),
          er.center[2] + dz,
        ],
        radius: r,
      });
    }
  }
  return out;
}

/** Layout spheres along the curved smooth ER slab. */
export function smoothErSpheres(slots: PerinuclearSlots): LayoutSphere[] {
  const { smoothEr: s, nucleusCenter: n } = slots;
  const r = 0.5 * s.size[1] + 0.01 * s.size[0];
  return [-0.32, 0, 0.32].map((f) => {
    const a = s.azimuth + (f * s.size[0]) / s.bend;
    return {
      center: [
        n[0] + s.bend * Math.cos(a),
        n[1] + s.bend * Math.sin(a),
        s.center[2],
      ] as Vector3Tuple,
      radius: r,
    };
  });
}

/**
 * Throw a sphere of radius r into free space: inside the cell, clear of the
 * entries, its centre `depth` below the cut. Returns null when no spot is found.
 */
export function placeFree(
  space: CellSpace,
  entries: CellLayoutEntry[],
  r: number,
  rng: Rng,
  gap: number,
  depth: [number, number] = [0.9 * r, 1.6 * r],
  tries = 800,
): Vector3Tuple | null {
  const [a, b] = space.radii;
  const top = space.cutZ ?? 0.1 * space.radii[2];
  for (let t = 0; t < tries; t++) {
    const u = Math.sqrt(rng());
    const phi = rng.range(0, 2 * Math.PI);
    const p: Vector3Tuple = [
      0.92 * a * u * Math.cos(phi),
      0.92 * b * u * Math.sin(phi),
      top - rng.range(depth[0], depth[1]),
    ];
    if (fitsInCell(space, p, r, 1) && isClear(entries, p, r, gap)) return p;
  }
  return null;
}

/** The organelle list of the 'animal' preset. */
export const ANIMAL_CELL_PRESET: readonly OrganelleSpec3D[] = [
  { name: 'nucleus' },
  { name: 'rough er' },
  { name: 'smooth er' },
  { name: 'golgi apparatus' },
  { name: 'centrosome' },
  { name: 'mitochondrion', count: 7 },
  { name: 'lysosome', count: 3 },
  { name: 'peroxisome', count: 3 },
  { name: 'vesicle', count: 4 },
  { name: 'ribosome' },
];

/** Other names of the organelle kinds. */
export const KIND_ALIASES: Readonly<Record<string, string>> = {
  golgi: 'golgi apparatus',
  mitochondria: 'mitochondrion',
  er: 'rough er',
  'endoplasmic reticulum': 'rough er',
  'rough endoplasmic reticulum': 'rough er',
  'smooth endoplasmic reticulum': 'smooth er',
  ribosomes: 'ribosome',
  lysosomes: 'lysosome',
  peroxisomes: 'peroxisome',
  vesicles: 'vesicle',
};

/** Normalised kinds; a count expands into copies. */
export function expandSpecs(
  specs: OrganelleSpec3D[],
  cytoskeleton: boolean,
): { spec: OrganelleSpec3D; kind: string }[] {
  const out: { spec: OrganelleSpec3D; kind: string }[] = [];
  for (const spec of specs) {
    const key = spec.name.trim().toLowerCase();
    const kind = KIND_ALIASES[key] ?? key;
    const copies = kind === 'ribosome' ? 1 : Math.max(1, spec.count ?? 1);
    for (let i = 0; i < copies; i++)
      out.push({ spec: i === 0 ? spec : { ...spec, id: undefined, position: undefined }, kind });
  }
  if (cytoskeleton && !out.some((o) => o.kind === 'cytoskeleton'))
    out.push({ spec: { name: 'cytoskeleton' }, kind: 'cytoskeleton' });
  return out;
}
