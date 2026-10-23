/**
 * smilesOverlaps - remove atom overlaps from a finished SMILES layout.
 *
 * The incremental layout in `./smilesLayout.ts` places each branch without a
 * view of the branches that come later, so two branches can meet on the same
 * point (aspirin: the ester and the acid group are ortho on the ring). This
 * pass flips the smaller side of an acyclic bond across the bond line, which
 * keeps every bond length and bond angle, and keeps a flip only when it lowers
 * the overlap penalty.
 */

import type { SmilesAtom, SmilesBond } from './smiles';
import { lengthVec } from '../../utils/vectors';

/** Two atoms closer than this, in bond lengths, overlap. */
const OVERLAP_DISTANCE = 0.99;

/** The most passes over the bonds before the pass gives up. */
const MAX_PASSES = 8;

/**
 * The largest molecule the pass works on. One pass costs about
 * bonds x atoms, so a cap keeps a huge graph from a quadratic cost.
 */
const MAX_ATOMS = 400;

/**
 * The overlap penalty: the sum of how far each close pair is inside
 * OVERLAP_DISTANCE. It is 0 when no two atoms overlap.
 */
function overlapPenalty(atoms: SmilesAtom[]): number {
  const grid = new Map<string, number[]>();
  let penalty = 0;
  atoms.forEach((atom, i) => {
    const cx = Math.floor(atom.x);
    const cy = Math.floor(atom.y);
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        for (const j of grid.get(`${gx},${gy}`) ?? []) {
          const d = lengthVec([atom.x - atoms[j].x, atom.y - atoms[j].y]);
          penalty += Math.max(0, OVERLAP_DISTANCE - d);
        }
      }
    }
    const key = `${cx},${cy}`;
    const cell = grid.get(key);
    if (cell) {
      cell.push(i);
    } else {
      grid.set(key, [i]);
    }
  });
  return penalty;
}

/**
 * The atoms on the `to` side of the bond from-to.
 * @returns The atoms reachable from `to` without the bond, or null when the
 * bond is in a ring (then `from` is reachable too).
 */
function sideOf(adjacency: number[][], from: number, to: number): number[] | null {
  const seen = new Set<number>([to]);
  const stack = [to];
  while (stack.length > 0) {
    const node = stack.pop() as number;
    for (const next of adjacency[node]) {
      if (node === to && next === from) {
        continue;
      }
      if (next === from) {
        return null;
      }
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return [...seen];
}

/** Reflect the given atoms across the line through atoms a and b. */
function reflect(atoms: SmilesAtom[], ids: number[], a: number, b: number): void {
  const ox = atoms[a].x;
  const oy = atoms[a].y;
  const len = lengthVec([atoms[b].x - ox, atoms[b].y - oy]);
  const ux = (atoms[b].x - ox) / len;
  const uy = (atoms[b].y - oy) / len;
  for (const id of ids) {
    const px = atoms[id].x - ox;
    const py = atoms[id].y - oy;
    const along = px * ux + py * uy;
    atoms[id].x = ox + 2 * along * ux - px;
    atoms[id].y = oy + 2 * along * uy - py;
  }
}

/** The smaller side of an acyclic bond, or null for a ring bond or a terminal atom. */
function smallerSide(adjacency: number[][], bond: SmilesBond): number[] | null {
  const toSide = sideOf(adjacency, bond.from, bond.to);
  if (toSide === null) {
    return null;
  }
  const fromSide = sideOf(adjacency, bond.to, bond.from) as number[];
  const side = toSide.length <= fromSide.length ? toSide : fromSide;
  return side.length > 1 ? side : null;
}

/**
 * Flip branches across acyclic bonds until no two atoms overlap, or no flip
 * helps.
 * @param atoms - The laid-out atoms; overlapping branches move in place.
 * @param bonds - The bonds.
 * @param adjacency - The adjacency list, one entry per atom.
 */
export function resolveOverlaps(
  atoms: SmilesAtom[],
  bonds: SmilesBond[],
  adjacency: number[][],
): void {
  if (atoms.length > MAX_ATOMS) {
    return;
  }
  let penalty = overlapPenalty(atoms);
  for (let pass = 0; pass < MAX_PASSES && penalty > 0; pass++) {
    let improved = false;
    for (const bond of bonds) {
      const side = smallerSide(adjacency, bond);
      if (side === null) {
        continue;
      }
      const saved = side.map((id) => [atoms[id].x, atoms[id].y]);
      reflect(atoms, side, bond.from, bond.to);
      const next = overlapPenalty(atoms);
      if (next < penalty - 1e-9) {
        penalty = next;
        improved = true;
      } else {
        side.forEach((id, k) => {
          atoms[id].x = saved[k][0];
          atoms[id].y = saved[k][1];
        });
      }
    }
    if (!improved) {
      return;
    }
  }
}
