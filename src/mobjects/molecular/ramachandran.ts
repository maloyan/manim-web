/**
 * Ramachandran backbone-geometry helpers.
 *
 * A Ramachandran plot validates a protein backbone conformation by the two
 * backbone torsion angles of each residue:
 *  - phi (φ) = dihedral(C_{i-1}, N_i, CA_i, C_i)
 *  - psi (ψ) = dihedral(N_i, CA_i, C_i, N_{i+1})
 *
 * The first residue of a chain has no φ (there is no previous C); the last has
 * no ψ (there is no next N). Both angles are reported in degrees in the range
 * `[-180, 180]`.
 *
 * This file holds pure functions and static reference data only; the drawable
 * mobject lives in {@link ./RamachandranPlot}.
 */

import { Vector3Tuple } from '../../core/Mobject';
import { ResidueCA } from './pdb';

/** One residue's backbone torsion angles, in degrees. */
export interface RamachandranPoint {
  /** The φ (phi) angle in degrees, in `[-180, 180]`. */
  phi: number;
  /** The ψ (psi) angle in degrees, in `[-180, 180]`. */
  psi: number;
  /** The 1-letter residue code, if known (e.g. 'G' for glycine). */
  residue?: string;
}

/** A simplified allowed / favored region of the Ramachandran plane. */
export interface RamachandranRegion {
  /** A stable machine name for the region (e.g. 'alpha-right'). */
  name: string;
  /** A human label for the region (e.g. 'Right-handed α-helix'). */
  label: string;
  /** The default fill color for the region outline. */
  color: string;
  /** The region boundary as `[phi, psi]` vertices, in degrees. */
  vertices: Array<[number, number]>;
}

/** Subtract two 3D points (a - b). */
function sub(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** The cross product a × b. */
function cross(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** The dot product a · b. */
function dot(a: Vector3Tuple, b: Vector3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** The Euclidean length of a vector. */
function length(a: Vector3Tuple): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/**
 * The signed dihedral (torsion) angle of four points, in degrees `[-180, 180]`.
 *
 * Uses the standard atan2-of-cross-products convention (the same sign as IUPAC
 * backbone torsions). Given the three bond vectors b1 = p1 - p0, b2 = p2 - p1
 * and b3 = p3 - p2, the angle is `atan2((n1 × b2̂) · n2, n1 · n2)` where
 * n1 = b1 × b2 and n2 = b2 × b3.
 *
 * @param p0 - The first point.
 * @param p1 - The second point (start of the central bond).
 * @param p2 - The third point (end of the central bond).
 * @param p3 - The fourth point.
 * @returns The dihedral angle in degrees, or `NaN` if the central bond or either
 *   plane is degenerate (collinear points).
 */
export function dihedralDegrees(
  p0: Vector3Tuple,
  p1: Vector3Tuple,
  p2: Vector3Tuple,
  p3: Vector3Tuple,
): number {
  const b1 = sub(p1, p0);
  const b2 = sub(p2, p1);
  const b3 = sub(p3, p2);
  const b2Length = length(b2);
  if (b2Length === 0) {
    return NaN;
  }
  const n1 = cross(b1, b2);
  const n2 = cross(b2, b3);
  if (length(n1) === 0 || length(n2) === 0) {
    return NaN;
  }
  const b2Unit: Vector3Tuple = [b2[0] / b2Length, b2[1] / b2Length, b2[2] / b2Length];
  const m1 = cross(n1, b2Unit);
  const x = dot(n1, n2);
  const y = dot(m1, n2);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/** True when every component of a backbone position is finite. */
function isFiniteTriple(p: Vector3Tuple | undefined): p is Vector3Tuple {
  return p !== undefined && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2]);
}

/** True when two residues sit next to each other in the same chain. */
function areConsecutive(prev: ResidueCA, next: ResidueCA): boolean {
  if (prev.chain !== next.chain) {
    return false;
  }
  // When both carry a sequence number, require strict adjacency so a chain gap
  // (a missing residue) does not create a spurious peptide bond.
  if (prev.resSeq !== undefined && next.resSeq !== undefined) {
    return next.resSeq === prev.resSeq + 1;
  }
  return true;
}

/**
 * Compute the φ/ψ angles for a chain of residues carrying backbone N/CA/C atoms.
 *
 * A residue contributes a point only when its φ and ψ can both be computed: it
 * needs the previous residue's C, its own N/CA/C and the next residue's N, and
 * all three residues must be consecutive in the same chain. A residue missing
 * any required backbone atom is skipped (it never throws).
 *
 * @param residues - The residues in chain order, each with `n`, `ca` and `c`.
 * @returns One {@link RamachandranPoint} per residue that has both angles.
 */
export function computeRamachandran(residues: ResidueCA[]): RamachandranPoint[] {
  const points: RamachandranPoint[] = [];
  for (let i = 1; i < residues.length - 1; i++) {
    const prev = residues[i - 1];
    const curr = residues[i];
    const next = residues[i + 1];
    if (!areConsecutive(prev, curr) || !areConsecutive(curr, next)) {
      continue;
    }
    if (
      !isFiniteTriple(prev.c) ||
      !isFiniteTriple(curr.n) ||
      !isFiniteTriple(curr.ca) ||
      !isFiniteTriple(curr.c) ||
      !isFiniteTriple(next.n)
    ) {
      continue;
    }
    const phi = dihedralDegrees(prev.c, curr.n, curr.ca, curr.c);
    const psi = dihedralDegrees(curr.n, curr.ca, curr.c, next.n);
    if (!Number.isFinite(phi) || !Number.isFinite(psi)) {
      continue;
    }
    points.push({ phi, psi, residue: curr.code });
  }
  return points;
}

/**
 * Simplified allowed / favored Ramachandran regions for the general case.
 *
 * These are coarse rectangular outlines of the three classic backbone
 * conformations, embedded as static reference data so a plot needs no external
 * density file. They are a teaching reference, NOT the MolProbity smoothed
 * density contours: the real favored / allowed boundaries are curved, residue-
 * class specific (general / glycine / proline / pre-proline) and derived from
 * high-resolution structures. Approximate centers (φ, ψ): right-handed α-helix
 * ≈ (-63, -43), β-sheet ≈ (-120, 130), left-handed α-helix ≈ (60, 45).
 */
export const RAMACHANDRAN_REGIONS: readonly RamachandranRegion[] = [
  {
    name: 'alpha-right',
    label: 'Right-handed α-helix',
    color: '#e15759',
    vertices: [
      [-150, -60],
      [-50, -60],
      [-50, 0],
      [-150, 0],
    ],
  },
  {
    name: 'beta-sheet',
    label: 'β-sheet',
    color: '#4e79a7',
    vertices: [
      [-180, 90],
      [-50, 90],
      [-50, 180],
      [-180, 180],
    ],
  },
  {
    name: 'alpha-left',
    label: 'Left-handed α-helix',
    color: '#59a14f',
    vertices: [
      [35, 25],
      [85, 25],
      [85, 70],
      [35, 70],
    ],
  },
];

/**
 * True when `(phi, psi)` lies inside a polygon, by the even-odd ray-cast rule.
 *
 * @param phi - The φ coordinate.
 * @param psi - The ψ coordinate.
 * @param vertices - The polygon `[phi, psi]` vertices.
 * @returns Whether the point is inside.
 */
export function pointInPolygon(
  phi: number,
  psi: number,
  vertices: Array<[number, number]>,
): boolean {
  let inside = false;
  const n = vertices.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    const intersects = yi > psi !== yj > psi && phi < ((xj - xi) * (psi - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * The name of the first region that contains `(phi, psi)`, or `null` when the
 * point is an outlier (outside every region).
 *
 * @param phi - The φ angle in degrees.
 * @param psi - The ψ angle in degrees.
 * @param regions - The regions to test. Default: {@link RAMACHANDRAN_REGIONS}.
 * @returns The region name, or `null`.
 */
export function regionFor(
  phi: number,
  psi: number,
  regions: readonly RamachandranRegion[] = RAMACHANDRAN_REGIONS,
): string | null {
  for (const region of regions) {
    if (pointInPolygon(phi, psi, region.vertices)) {
      return region.name;
    }
  }
  return null;
}
