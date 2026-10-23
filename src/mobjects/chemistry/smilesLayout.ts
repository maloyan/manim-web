/**
 * smilesLayout - generate 2D skeletal coordinates for a parsed SMILES graph.
 *
 * The scanner in `./smiles.ts` builds an atom/bond graph with no coordinates.
 * This module fills each atom's x,y so a {@link MoleculeMobject} can draw a
 * recognizable skeletal structure. The rules:
 *  - Every bond has a unit length.
 *  - A chain is a zig-zag with 120-degree bond angles. Each new bond turns
 *    60 degrees away from the forward direction of the bond before it.
 *  - Each ring is a regular polygon. A ring that shares a bond with a ring that
 *    is already drawn (a fused ring) is reflected across the shared bond, so the
 *    two polygons do not overlap. An atom keeps its position after it is placed.
 *  - A substituent on a ring atom points into the largest free angle around the
 *    atom: radially outward for a single substituent.
 *  - Disconnected components are offset so they do not overlap.
 *  - The result is deterministic: the same graph gives the same coordinates.
 *
 * The layout aims for legible, not perfect: bridged and other dense ring
 * systems can still bend bonds, but chains, branches, rings and fused rings
 * read correctly.
 */

import type { SmilesAtom, SmilesBond } from './smiles';
import { lengthVec } from '../../utils/vectors';
import { findRings } from './smilesRings';
import { resolveOverlaps } from './smilesOverlaps';

/** Unit bond length used by the layout. MoleculeMobject applies its own scale. */
const BOND_LENGTH = 1;

/** Zig-zag turn from the forward direction, in radians (60 degrees). */
const ZIGZAG_TURN = Math.PI / 3;

/** Start direction of the first bond of an acyclic component (30 degrees). */
const START_DIRECTION = Math.PI / 6;

/** Direction from a lone ring atom to the ring center when nothing constrains it. */
const DEFAULT_RING_DIRECTION = -Math.PI / 2;

/** A candidate position closer than this to a placed atom counts as a clash. */
const CLASH_DISTANCE = 0.95 * BOND_LENGTH;

/** Gap, in bond lengths, left between disconnected components. */
const COMPONENT_GAP = 2;

/** A 2D point. */
interface Point {
  x: number;
  y: number;
}

/** A child direction: the bond angle and the zig-zag turn sign it took. */
interface ChildDirection {
  angle: number;
  turn: number;
}

/** Distance between two points. */
function distance(a: Point, b: Point): number {
  return lengthVec([a.x - b.x, a.y - b.y]);
}

/** The circumradius of a regular polygon with `m` unit-length sides. */
function ringRadius(m: number): number {
  return BOND_LENGTH / (2 * Math.sin(Math.PI / m));
}

/**
 * Incremental 2D layout of one SMILES graph. It places atoms one component at a
 * time: a breadth-first walk places the free neighbors of each placed atom, and
 * each ring is laid as a whole as soon as one of its atoms is placed.
 */
class SmilesLayout {
  private readonly placed: boolean[];
  /** The zig-zag turn sign (+1, -1, or 0) of the bond that placed each atom. */
  private readonly turn: number[];
  private readonly ringsOf: number[][];
  private readonly ringLaid: boolean[];
  private queue: number[] = [];
  private component: number[] = [];
  /** Spatial hash of placed atoms in the current component, for clash checks. */
  private grid = new Map<string, number[]>();

  constructor(
    private readonly atoms: SmilesAtom[],
    private readonly adjacency: number[][],
    private readonly rings: number[][],
  ) {
    const n = atoms.length;
    this.placed = new Array<boolean>(n).fill(false);
    this.turn = new Array<number>(n).fill(0);
    this.ringsOf = Array.from({ length: n }, () => []);
    rings.forEach((ring, ri) => ring.forEach((atom) => this.ringsOf[atom].push(ri)));
    this.ringLaid = new Array<boolean>(rings.length).fill(false);
  }

  /** Lay out every component, left to right. */
  run(): void {
    let offsetX = 0;
    for (let start = 0; start < this.atoms.length; start++) {
      if (this.placed[start]) {
        continue;
      }
      this.component = [];
      this.grid = new Map();
      this.place(this.seedAtom(start), { x: 0, y: 0 }, 0);
      this.layPendingRings();
      for (let head = 0; head < this.queue.length; head++) {
        this.expand(this.queue[head]);
      }
      this.queue = [];
      offsetX = this.shiftComponent(offsetX) + COMPONENT_GAP;
    }
  }

  /**
   * The atom to start a component from: its first ring atom, so that a ring
   * system is laid before its substituents, or else `start`.
   */
  private seedAtom(start: number): number {
    const seen = new Set<number>([start]);
    const order = [start];
    for (let head = 0; head < order.length; head++) {
      for (const next of this.adjacency[order[head]]) {
        if (!seen.has(next)) {
          seen.add(next);
          order.push(next);
        }
      }
    }
    const ringAtoms = order.filter((atom) => this.ringsOf[atom].length > 0);
    return ringAtoms.length > 0 ? Math.min(...ringAtoms) : start;
  }

  /** Move the current component so its left edge is at `offsetX`; return its right edge. */
  private shiftComponent(offsetX: number): number {
    const xs = this.component.map((atom) => this.atoms[atom].x);
    const dx = offsetX - Math.min(...xs);
    let maxX = -Infinity;
    for (const atom of this.component) {
      this.atoms[atom].x += dx;
      maxX = Math.max(maxX, this.atoms[atom].x);
    }
    return maxX;
  }

  private cellKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private place(atom: number, p: Point, turn: number): void {
    this.atoms[atom].x = p.x;
    this.atoms[atom].y = p.y;
    this.placed[atom] = true;
    this.turn[atom] = turn;
    this.queue.push(atom);
    this.component.push(atom);
    const key = this.cellKey(Math.floor(p.x), Math.floor(p.y));
    const cell = this.grid.get(key);
    if (cell) {
      cell.push(atom);
    } else {
      this.grid.set(key, [atom]);
    }
  }

  /** Smallest distance from `p` to a placed atom other than `self`. */
  private clearance(p: Point, self: number): number {
    let best = Infinity;
    const cx = Math.floor(p.x);
    const cy = Math.floor(p.y);
    for (let i = cx - 1; i <= cx + 1; i++) {
      for (let j = cy - 1; j <= cy + 1; j++) {
        for (const atom of this.grid.get(this.cellKey(i, j)) ?? []) {
          if (atom !== self) {
            best = Math.min(best, distance(p, this.atoms[atom]));
          }
        }
      }
    }
    return best;
  }

  /** Whether `p` lies near the center of a laid ring that contains `atom`. */
  private insideRing(p: Point, atom: number): boolean {
    return this.ringsOf[atom].some((ri) => {
      const ring = this.rings[ri];
      if (!this.ringLaid[ri]) {
        return false;
      }
      const cx = ring.reduce((sum, a) => sum + this.atoms[a].x, 0) / ring.length;
      const cy = ring.reduce((sum, a) => sum + this.atoms[a].y, 0) / ring.length;
      return distance(p, { x: cx, y: cy }) < ringRadius(ring.length) / 2;
    });
  }

  /** The point one bond from `atom` in direction `angle`. */
  private step(atom: number, angle: number): Point {
    const a = this.atoms[atom];
    return { x: a.x + BOND_LENGTH * Math.cos(angle), y: a.y + BOND_LENGTH * Math.sin(angle) };
  }

  /** Place the free neighbors of a placed atom, then lay any ring they touch. */
  private expand(atom: number): void {
    const kids = this.adjacency[atom].filter((nb) => !this.placed[nb]);
    if (kids.length === 0) {
      return;
    }
    const fixed = this.adjacency[atom].filter((nb) => this.placed[nb]);
    const dirs = this.childDirections(atom, kids.length, fixed);
    kids.forEach((kid, j) => {
      if (!this.placed[kid]) {
        this.place(kid, this.step(atom, dirs[j].angle), dirs[j].turn);
        this.layPendingRings();
      }
    });
  }

  /** The bond direction for each of `count` new children of `atom`. */
  private childDirections(atom: number, count: number, fixed: number[]): ChildDirection[] {
    const a = this.atoms[atom];
    const angles = fixed.map((nb) => Math.atan2(this.atoms[nb].y - a.y, this.atoms[nb].x - a.x));
    if (angles.length === 0) {
      return Array.from({ length: count }, (_, j) => ({
        angle: START_DIRECTION + (j * 2 * Math.PI) / count,
        turn: j % 2 === 0 ? 1 : -1,
      }));
    }
    if (angles.length === 1) {
      return this.chainDirections(atom, count, angles[0]);
    }
    // Spread the children evenly over one free angle between placed bonds: the
    // one where the children land farthest from other atoms (a fused ring atom
    // has equal angles, and only the outside one is free), then the widest.
    const sorted = [...angles].sort((p, q) => p - q);
    let best: ChildDirection[] = [];
    let bestScore = -Infinity;
    let bestGap = -Infinity;
    sorted.forEach((start, k) => {
      const end = k + 1 < sorted.length ? sorted[k + 1] : sorted[0] + 2 * Math.PI;
      const gap = end - start;
      const dirs = Array.from({ length: count }, (_, j) => ({
        angle: start + (gap * (j + 1)) / (count + 1),
        turn: 0,
      }));
      const score = Math.min(
        CLASH_DISTANCE,
        ...dirs.map((d) => {
          const p = this.step(atom, d.angle);
          return this.insideRing(p, atom) ? -1 : this.clearance(p, atom);
        }),
      );
      if (score > bestScore + 1e-9 || (score > bestScore - 1e-9 && gap > bestGap + 1e-9)) {
        best = dirs;
        bestScore = score;
        bestGap = gap;
      }
    });
    return best;
  }

  /**
   * Child directions for an atom with one placed neighbor (a chain atom). The
   * last child continues the zig-zag; earlier children are branches.
   */
  private chainDirections(atom: number, count: number, back: number): ChildDirection[] {
    const forward = back + Math.PI;
    const t = this.turn[atom] === 0 ? 1 : -this.turn[atom];
    if (count === 1) {
      const preferred = { angle: forward + t * ZIGZAG_TURN, turn: t };
      const other = { angle: forward - t * ZIGZAG_TURN, turn: -t };
      const cp = this.clearance(this.step(atom, preferred.angle), atom);
      const co = this.clearance(this.step(atom, other.angle), atom);
      return [cp >= CLASH_DISTANCE || cp >= co ? preferred : other];
    }
    if (count === 2) {
      return [
        { angle: forward - t * ZIGZAG_TURN, turn: -t },
        { angle: forward + t * ZIGZAG_TURN, turn: t },
      ];
    }
    if (count === 3) {
      return [
        { angle: forward - (t * Math.PI) / 2, turn: -t },
        { angle: forward + (t * Math.PI) / 2, turn: t },
        { angle: forward, turn: t },
      ];
    }
    return Array.from({ length: count }, (_, j) => ({
      angle: back + ((j + 1) * 2 * Math.PI) / (count + 1),
      turn: j % 2 === 0 ? 1 : -1,
    }));
  }

  /** Lay every unlaid ring that has a placed atom, most-constrained ring first. */
  private layPendingRings(): void {
    for (;;) {
      let best = -1;
      let bestCount = 0;
      this.rings.forEach((ring, ri) => {
        if (this.ringLaid[ri]) {
          return;
        }
        const count = ring.filter((atom) => this.placed[atom]).length;
        if (count > bestCount) {
          best = ri;
          bestCount = count;
        }
      });
      if (best === -1) {
        return;
      }
      this.layRing(best);
    }
  }

  /** Place the free atoms of a ring that has at least one placed atom. */
  private layRing(ri: number): void {
    this.ringLaid[ri] = true;
    const ring = this.rings[ri];
    const m = ring.length;
    const fixedIdx = ring.map((_, k) => k).filter((k) => this.placed[ring[k]]);
    if (fixedIdx.length === m) {
      return;
    }
    if (fixedIdx.length === 1) {
      this.layRingFromAtom(ring, fixedIdx[0]);
      return;
    }
    // Fill each run of free atoms between two placed atoms on an arc.
    for (const k of fixedIdx) {
      const gap: number[] = [];
      let j = (k + 1) % m;
      while (!this.placed[ring[j]]) {
        gap.push(ring[j]);
        j = (j + 1) % m;
      }
      if (gap.length > 0) {
        this.fillArc(ring, ring[k], ring[j], gap);
      }
    }
  }

  /** Lay a ring with one placed atom: the polygon points away from its placed neighbors. */
  private layRingFromAtom(ring: number[], k0: number): void {
    const m = ring.length;
    const root = this.atoms[ring[k0]];
    let vx = 0;
    let vy = 0;
    for (const nb of this.adjacency[ring[k0]]) {
      if (this.placed[nb]) {
        const d = distance(root, this.atoms[nb]);
        vx += (root.x - this.atoms[nb].x) / d;
        vy += (root.y - this.atoms[nb].y) / d;
      }
    }
    const dir = lengthVec([vx, vy]) > 1e-9 ? Math.atan2(vy, vx) : DEFAULT_RING_DIRECTION;
    const radius = ringRadius(m);
    const center = { x: root.x + radius * Math.cos(dir), y: root.y + radius * Math.sin(dir) };
    for (let s = 1; s < m; s++) {
      const angle = dir + Math.PI + (s * 2 * Math.PI) / m;
      const atom = ring[(k0 + s) % m];
      this.place(
        atom,
        { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) },
        0,
      );
    }
  }

  /**
   * Place the free atoms `gap` on a circular arc from placed atom `from` to
   * placed atom `to`. The arc bulges away from the other placed atoms near the
   * ring, so a fused ring is the reflection of its neighbor across the shared
   * bond.
   */
  private fillArc(ring: number[], from: number, to: number, gap: number[]): void {
    const e = this.atoms[from];
    const s = this.atoms[to];
    const chord = distance(e, s);
    const radius = Math.max(ringRadius(ring.length), chord / 2);
    const h = Math.sqrt(Math.max(0, radius * radius - (chord * chord) / 4));
    const mid = { x: (e.x + s.x) / 2, y: (e.y + s.y) / 2 };
    const nrm = { x: -(s.y - e.y) / chord, y: (s.x - e.x) / chord };
    const ref = this.referencePoint(ring, from, to) ?? { x: mid.x + nrm.x, y: mid.y + nrm.y };
    const side = (ref.x - mid.x) * nrm.x + (ref.y - mid.y) * nrm.y >= 0 ? 1 : -1;
    const center = { x: mid.x - side * h * nrm.x, y: mid.y - side * h * nrm.y };
    const aFrom = Math.atan2(e.y - center.y, e.x - center.x);
    const aTo = Math.atan2(s.y - center.y, s.x - center.x);
    const ccw = (((aTo - aFrom) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const onArc = (sweep: number): Point => ({
      x: center.x + radius * Math.cos(aFrom + sweep / 2),
      y: center.y + radius * Math.sin(aFrom + sweep / 2),
    });
    const sweep =
      distance(onArc(ccw), ref) >= distance(onArc(ccw - 2 * Math.PI), ref)
        ? ccw
        : ccw - 2 * Math.PI;
    const stepAngle = sweep / (gap.length + 1);
    gap.forEach((atom, i) => {
      const angle = aFrom + stepAngle * (i + 1);
      this.place(
        atom,
        { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) },
        0,
      );
    });
  }

  /**
   * The centroid of the placed atoms the new arc must avoid: the ring's other
   * placed atoms, or else the placed neighbors of the two arc ends.
   */
  private referencePoint(ring: number[], from: number, to: number): Point | null {
    const others = (atom: number): boolean => atom !== from && atom !== to && this.placed[atom];
    let pts = ring.filter(others);
    if (pts.length === 0) {
      // A fused ring: reflect the laid ring(s) that share the bond from-to.
      pts = this.rings
        .filter((r, ri) => this.ringLaid[ri] && r !== ring && r.includes(from) && r.includes(to))
        .flat()
        .filter(others);
    }
    if (pts.length === 0) {
      pts = [...this.adjacency[from], ...this.adjacency[to]].filter(
        (atom) => atom !== from && atom !== to && this.placed[atom],
      );
    }
    if (pts.length === 0) {
      return null;
    }
    const x = pts.reduce((sum, atom) => sum + this.atoms[atom].x, 0) / pts.length;
    const y = pts.reduce((sum, atom) => sum + this.atoms[atom].y, 0) / pts.length;
    return { x, y };
  }
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
  const adjacency: number[][] = Array.from({ length: n }, () => []);
  for (const bond of bonds) {
    adjacency[bond.from].push(bond.to);
    adjacency[bond.to].push(bond.from);
  }
  const rings = findRings(n, bonds, ringClosure);
  new SmilesLayout(atoms, adjacency, rings).run();
  resolveOverlaps(atoms, bonds, adjacency);
}
