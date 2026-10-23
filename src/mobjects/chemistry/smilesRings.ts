/**
 * smilesRings - ring perception for the SMILES layout.
 *
 * The layout draws each ring as a polygon, so it needs a set of small rings
 * that covers every cycle of the graph: one ring per ring-closure bond. The
 * cycle that the SMILES text spells (the tree path plus the closure bond) is a
 * valid set, but it is not always the smallest: for naphthalene
 * `c1ccc2ccccc2c1` the outer closure spells the 10-atom perimeter, not the
 * second 6-atom ring. So this module collects candidate cycles (the shortest
 * cycle through each ring bond, plus the spelled cycles), and keeps the
 * smallest candidates that are independent, as in Horton's algorithm.
 */

import type { SmilesBond } from './smiles';

/**
 * Find the shortest path between two atoms with a BFS.
 * @param adjacency - The adjacency list, one entry per atom.
 * @param start - The start atom index.
 * @param goal - The goal atom index.
 * @returns The atom indices on the path, start first, or null when none exists.
 * The direct bond start-goal is never used.
 */
function shortestDetour(adjacency: number[][], start: number, goal: number): number[] | null {
  const queue = [start];
  const prev = new Map<number, number>();
  const seen = new Set<number>([start]);
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
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
      const direct = node === start && next === goal;
      if (!direct && !seen.has(next)) {
        seen.add(next);
        prev.set(next, node);
        queue.push(next);
      }
    }
  }
  return null;
}

/** An order-free key for an undirected bond. */
function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Reduce a cycle's bond bitmask against the kept basis, over GF(2).
 * @returns The residue; 0n means the cycle depends on the kept cycles.
 */
function reduce(mask: bigint, basis: Map<number, bigint>): bigint {
  let rest = mask;
  while (rest !== 0n) {
    const pivot = rest.toString(2).length - 1;
    const row = basis.get(pivot);
    if (row === undefined) {
      return rest;
    }
    rest ^= row;
  }
  return 0n;
}

/**
 * Find a small set of rings: one per ring-closure bond. Each ring is a cycle
 * of atoms in order, so consecutive atoms, and the last and first atoms, are
 * bonded.
 * @param n - The atom count.
 * @param bonds - The bonds.
 * @param ringClosure - Parallel to bonds: true for a ring-closure bond.
 * @returns The rings, smallest first.
 */
export function findRings(n: number, bonds: SmilesBond[], ringClosure: boolean[]): number[][] {
  const adjacency: number[][] = Array.from({ length: n }, () => []);
  const partial: number[][] = Array.from({ length: n }, () => []);
  bonds.forEach((bond, k) => {
    adjacency[bond.from].push(bond.to);
    adjacency[bond.to].push(bond.from);
    if (!ringClosure[k]) {
      partial[bond.from].push(bond.to);
      partial[bond.to].push(bond.from);
    }
  });

  // The spelled cycles: over the tree bonds and the earlier closures.
  const candidates: number[][] = [];
  bonds.forEach((bond, k) => {
    if (!ringClosure[k]) {
      return;
    }
    const cycle = shortestDetour(partial, bond.from, bond.to);
    if (cycle !== null && cycle.length >= 3) {
      candidates.push(cycle);
    }
    partial[bond.from].push(bond.to);
    partial[bond.to].push(bond.from);
  });
  const target = candidates.length;
  if (target === 0) {
    return [];
  }

  // The shortest cycle through each bond of a spelled cycle.
  const ringBonds = new Map<string, number>();
  for (const cycle of candidates) {
    cycle.forEach((atom, i) => {
      const key = edgeKey(atom, cycle[(i + 1) % cycle.length]);
      if (!ringBonds.has(key)) {
        ringBonds.set(key, ringBonds.size);
      }
    });
  }
  for (const key of ringBonds.keys()) {
    const [a, b] = key.split('-').map(Number);
    const cycle = shortestDetour(adjacency, a, b);
    if (cycle !== null && cycle.length >= 3) {
      candidates.push(cycle);
    }
  }

  // Keep the smallest independent cycles. The sort is stable, so ties keep
  // their discovery order and the result is deterministic.
  const ordered = [...candidates].sort((p, q) => p.length - q.length);
  const basis = new Map<number, bigint>();
  const rings: number[][] = [];
  for (const cycle of ordered) {
    let mask = 0n;
    cycle.forEach((atom, i) => {
      const index = ringBonds.get(edgeKey(atom, cycle[(i + 1) % cycle.length]));
      mask |= 1n << BigInt(index ?? 0);
    });
    const rest = reduce(mask, basis);
    if (rest !== 0n) {
      basis.set(rest.toString(2).length - 1, rest);
      rings.push(cycle);
      if (rings.length === target) {
        return rings;
      }
    }
  }
  return rings;
}
