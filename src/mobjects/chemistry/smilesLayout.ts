/**
 * smilesLayout - generate 2D skeletal coordinates for a parsed SMILES graph.
 *
 * The scanner in `./smiles.ts` builds an atom/bond graph with no coordinates.
 * This module fills each atom's x,y so a {@link MoleculeMobject} can draw a
 * recognizable skeletal structure. The rules:
 *  - The main chain is a zig-zag at 60-degree turns, with a unit bond length.
 *  - A ring found through a ring closure is laid as a regular polygon.
 *  - Disconnected components are offset so they do not overlap.
 *  - The result is deterministic: the same graph gives the same coordinates.
 *
 * The layout aims for legible, not perfect: it is not collision-free for complex
 * fused systems, but simple chains, rings and single branches read correctly.
 */

import type { SmilesAtom, SmilesBond } from './smiles';

/** Unit bond length used by the layout. MoleculeMobject applies its own scale. */
const BOND_LENGTH = 1;

/** Zig-zag turn, in radians (60 degrees), used to lay out a chain. */
const ZIGZAG_TURN = Math.PI / 3;

/** Gap, in bond lengths, left between disconnected components. */
const COMPONENT_GAP = 2;

/**
 * Find the shortest path between two atoms over a set of edges, with a BFS.
 * @param adjacency - The adjacency list, one entry per atom.
 * @param start - The start atom index.
 * @param goal - The goal atom index.
 * @returns The atom indices on the path, start first, or null when none exists.
 */
function shortestPath(adjacency: number[][], start: number, goal: number): number[] | null {
  const queue = [start];
  const prev = new Map<number, number>();
  const seen = new Set<number>([start]);
  while (queue.length > 0) {
    const node = queue.shift() as number;
    if (node === goal) {
      const path = [goal];
      let at = goal;
      while (at !== start) {
        at = prev.get(at) as number;
        path.unshift(at);
      }
      return path;
    }
    for (const next of adjacency[node]) {
      if (!seen.has(next)) {
        seen.add(next);
        prev.set(next, node);
        queue.push(next);
      }
    }
  }
  return null;
}

/**
 * The angle offsets, in turns of {@link ZIGZAG_TURN}, for an atom's children.
 * @param count - The number of children to place.
 * @param nextSign - The current zig-zag sign (+1 or -1).
 * @returns One offset per child.
 */
function childTurns(count: number, nextSign: number): number[] {
  if (count <= 1) {
    return [nextSign];
  }
  if (count === 2) {
    return [nextSign, -nextSign];
  }
  if (count === 3) {
    return [nextSign, -nextSign, 0];
  }
  const turns: number[] = [];
  for (let k = 0; k < count; k++) {
    const step = 1 + Math.floor(k / 2);
    turns.push(k % 2 === 0 ? nextSign * step : -nextSign * step);
  }
  return turns;
}

/** The circumradius of a regular polygon with `m` unit-length sides. */
function ringRadius(m: number): number {
  return BOND_LENGTH / (2 * Math.sin(Math.PI / m));
}

/**
 * Build the full adjacency list and the tree (non-ring-closure) adjacency list.
 * @param n - The atom count.
 * @param bonds - The bonds.
 * @param ringClosure - Parallel to bonds: true for a ring-closure bond.
 * @returns The two adjacency lists.
 */
function buildAdjacency(
  n: number,
  bonds: SmilesBond[],
  ringClosure: boolean[],
): { adjacency: number[][]; treeAdjacency: number[][] } {
  const adjacency: number[][] = Array.from({ length: n }, () => []);
  const treeAdjacency: number[][] = Array.from({ length: n }, () => []);
  bonds.forEach((bond, k) => {
    adjacency[bond.from].push(bond.to);
    adjacency[bond.to].push(bond.from);
    if (!ringClosure[k]) {
      treeAdjacency[bond.from].push(bond.to);
      treeAdjacency[bond.to].push(bond.from);
    }
  });
  return { adjacency, treeAdjacency };
}

/**
 * Generate 2D coordinates for every atom in the graph, in place.
 * @param atoms - The atoms; each gains x,y.
 * @param bonds - The bonds.
 * @param ringClosure - Parallel to bonds: true for a ring-closure bond.
 */
export function layoutGraph(
  atoms: SmilesAtom[],
  bonds: SmilesBond[],
  ringClosure: boolean[],
): void {
  const n = atoms.length;
  if (n === 0) {
    return;
  }

  const { adjacency, treeAdjacency } = buildAdjacency(n, bonds, ringClosure);

  // Each ring-closure bond defines a ring: the path over the tree edges.
  const rings: number[][] = [];
  bonds.forEach((bond, k) => {
    if (ringClosure[k]) {
      const path = shortestPath(treeAdjacency, bond.from, bond.to);
      if (path !== null) {
        rings.push(path);
      }
    }
  });
  const ringOf = new Array<number>(n).fill(-1);
  rings.forEach((ring, ri) => {
    for (const atom of ring) {
      if (ringOf[atom] === -1) {
        ringOf[atom] = ri;
      }
    }
  });
  const ringLaid = new Array<boolean>(rings.length).fill(false);

  const placed = new Array<boolean>(n).fill(false);
  const incoming = new Array<number>(n).fill(Math.PI / 2);
  const state = { sign: -1 };

  const placeRing = (ri: number, centerX: number, centerY: number): void => {
    const ring = rings[ri];
    const m = ring.length;
    const radius = ringRadius(m);
    for (let k = 0; k < m; k++) {
      const angle = Math.PI / 2 - (k * 2 * Math.PI) / m;
      const atom = ring[k];
      atoms[atom].x = centerX + radius * Math.cos(angle);
      atoms[atom].y = centerY + radius * Math.sin(angle);
      placed[atom] = true;
      // Substituents point radially outward from the ring center.
      incoming[atom] = angle;
    }
    ringLaid[ri] = true;
  };

  const placeChildren = (atom: number): void => {
    const kids = adjacency[atom].filter((nb) => !placed[nb]);
    const parentDir = incoming[atom] + Math.PI;
    const turns = childTurns(kids.length, state.sign);
    if (kids.length <= 1) {
      state.sign = -state.sign;
    }
    kids.forEach((nb, j) => {
      if (placed[nb]) {
        return;
      }
      const dir = parentDir + turns[j] * ZIGZAG_TURN;
      const ri = ringOf[nb];
      if (ri !== -1 && !ringLaid[ri]) {
        // Lay the ring here, keeping this bond's length by centering the
        // polygon one bond plus one radius along the bond direction.
        const radius = ringRadius(rings[ri].length);
        const cx = atoms[atom].x + (BOND_LENGTH + radius) * Math.cos(dir);
        const cy = atoms[atom].y + (BOND_LENGTH + radius) * Math.sin(dir);
        placeRing(ri, cx, cy);
        for (const member of rings[ri]) {
          placeChildren(member);
        }
        return;
      }
      atoms[nb].x = atoms[atom].x + BOND_LENGTH * Math.cos(dir);
      atoms[nb].y = atoms[atom].y + BOND_LENGTH * Math.sin(dir);
      placed[nb] = true;
      incoming[nb] = dir;
      placeChildren(nb);
    });
  };

  let offsetX = 0;
  for (let start = 0; start < n; start++) {
    if (placed[start]) {
      continue;
    }
    const ri = ringOf[start];
    if (ri !== -1 && !ringLaid[ri]) {
      placeRing(ri, offsetX + ringRadius(rings[ri].length), 0);
      for (const member of rings[ri]) {
        placeChildren(member);
      }
    } else {
      atoms[start].x = offsetX;
      atoms[start].y = 0;
      placed[start] = true;
      incoming[start] = Math.PI / 2;
      state.sign = -1;
      placeChildren(start);
    }
    // Offset the next component past the rightmost atom placed so far.
    let maxX = -Infinity;
    for (let k = 0; k < n; k++) {
      if (placed[k]) {
        maxX = Math.max(maxX, atoms[k].x);
      }
    }
    offsetX = maxX + COMPONENT_GAP;
  }
}
