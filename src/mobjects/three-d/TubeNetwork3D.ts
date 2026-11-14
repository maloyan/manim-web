import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { mulberry32 } from '../../utils/ManimColor';
import { lengthVec, subVec } from '../../utils/vectors';
import { icosphere } from './Blob3D';
import {
  MeshBuilder,
  OrganicMesh3D,
  requireFinitePoints,
  requireNumber,
  sweepCappedTube,
  type OrganicMeshOptions,
} from './organicMesh';

/** A graph of tube joints and the tubes between them. */
export interface TubeGraph {
  /** Joint positions. */
  nodes: Vector3Tuple[];
  /** Tubes as pairs of node indices. */
  edges: [number, number][];
}

/**
 * Options for creating a TubeNetwork3D.
 */
export interface TubeNetwork3DOptions extends OrganicMeshOptions, TubeGraph {
  /** Tube radius. Default: 0.05 */
  radius?: number;
  /**
   * Radius of the round joint at each node. A value <= radius drops the joint
   * spheres (the round tube ends still close each joint). Default: 1.35 * radius
   */
  jointRadius?: number;
  /** Segments around each tube. Default: 8 */
  radialSegments?: number;
  /** Latitude rings in each round tube end. Default: 3 */
  capSegments?: number;
  /** Icosphere subdivision of the joints. Default: 1 */
  jointDetail?: number;
  /** Node the build-up reveal starts from. Default: 0 */
  root?: number;
}

/**
 * Options for {@link TubeNetwork3D.lattice}: a seeded, jittered lattice net.
 */
export interface TubeLatticeOptions {
  /** Size of the region [x, y, z]. A small z gives a single sheet. Default: [3, 3, 0.2] */
  size?: Vector3Tuple;
  /** Center of the region. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Lattice spacing. Default: 0.4 */
  spacing?: number;
  /** Random node offset as a fraction of the spacing. Default: 0.35 */
  jitter?: number;
  /** Probability to drop each lattice edge (opens irregular holes). Default: 0.15 */
  dropout?: number;
  /** Probability to add a diagonal across each XY cell. Default: 0.3 */
  diagonals?: number;
  /** Region shape: the box, or the ellipsoid inscribed in it. Default: 'box' */
  shape?: 'box' | 'ellipsoid';
  /** Seed. Default: 1 */
  seed?: number;
  /** Optional map applied to every node position (e.g. wrap the sheet onto a shell). */
  warp?: (p: Vector3Tuple) => Vector3Tuple;
}

/**
 * TubeNetwork3D - a net of smooth tubes with round joints, from a graph.
 *
 * Each edge is a round-ended tube and each node an optional joint sphere. All
 * of it is merged into ONE geometry (one draw call), so a net of several
 * hundred edges stays cheap. Every tube and joint is a closed, outward-wound
 * shell; the net is a union of overlapping closed shells, not one fused
 * surface.
 *
 * Build-up order: the `reveal` attribute is the graph distance from `root`
 * (breadth-first spanning tree, Euclidean edge lengths), normalised to [0, 1].
 * Each tube runs from its nearer node to its farther node, and the index
 * buffer is sorted by reveal, so `geometry.setDrawRange(0, k)` grows the net
 * outward from the root. Nodes in other connected components continue from
 * their lowest index after the root component.
 *
 * @example
 * ```typescript
 * const net = new TubeNetwork3D({
 *   ...TubeNetwork3D.lattice({ size: [4, 3, 0.3], spacing: 0.35, seed: 3 }),
 *   radius: 0.04,
 *   color: '#9cdceb',
 * });
 * ```
 */
export class TubeNetwork3D extends OrganicMesh3D {
  private _nodes: Vector3Tuple[];
  private _edges: [number, number][];
  private _radius: number;
  private _jointRadius: number;
  private _radialSegments: number;
  private _capSegments: number;
  private _jointDetail: number;
  private _rootNode: number;

  constructor(options: TubeNetwork3DOptions) {
    super(options, '#9cdceb');
    const {
      nodes,
      edges,
      radius = 0.05,
      jointRadius = 1.35 * radius,
      radialSegments = 8,
      capSegments = 3,
      jointDetail = 1,
      root = 0,
    } = options;
    requireFinitePoints('TubeNetwork3D', 'nodes', nodes);
    requireNumber('TubeNetwork3D', 'radius', radius, 0);
    requireNumber('TubeNetwork3D', 'jointRadius', jointRadius, 0);
    this._nodes = nodes.map((p) => [...p] as Vector3Tuple);
    this._edges = edges
      .filter(([a, b]) => a !== b && a >= 0 && b >= 0 && a < nodes.length && b < nodes.length)
      .filter(([a, b]) => lengthVec(subVec(nodes[a], nodes[b])) > 1e-9)
      .map(([a, b]) => [a, b] as [number, number]);
    this._radius = radius;
    this._jointRadius = jointRadius;
    this._radialSegments = Math.max(3, Math.floor(radialSegments));
    this._capSegments = Math.max(1, Math.floor(capSegments));
    this._jointDetail = Math.max(0, Math.floor(jointDetail));
    this._rootNode = Math.min(Math.max(0, root), Math.max(0, nodes.length - 1));
  }

  /**
   * Graph distance of each node from the root (breadth-first tree, Euclidean
   * edge lengths). Other components continue after the root component.
   */
  private _distances(): number[] {
    const n = this._nodes.length;
    const adjacency: number[][] = Array.from({ length: n }, () => []);
    for (const [a, b] of this._edges) {
      adjacency[a].push(b);
      adjacency[b].push(a);
    }
    const dist = new Array<number>(n).fill(Number.NaN);
    let offset = 0;
    const order = [this._rootNode, ...Array.from({ length: n }, (_, i) => i)];
    for (const start of order) {
      if (!Number.isNaN(dist[start])) continue;
      dist[start] = offset;
      const queue = [start];
      let maxInComponent = offset;
      while (queue.length > 0) {
        const u = queue.shift() as number;
        for (const v of adjacency[u]) {
          if (!Number.isNaN(dist[v])) continue;
          dist[v] = dist[u] + lengthVec(subVec(this._nodes[u], this._nodes[v]));
          maxInComponent = Math.max(maxInComponent, dist[v]);
          queue.push(v);
        }
      }
      offset = maxInComponent;
    }
    return dist;
  }

  protected _buildGeometry(): THREE.BufferGeometry {
    const builder = new MeshBuilder();
    const dist = this._distances();
    const maxDist = Math.max(1e-9, ...dist);
    const reveal = (i: number) => dist[i] / maxDist;

    for (const [a, b] of this._edges) {
      const [from, to] = dist[a] <= dist[b] ? [a, b] : [b, a];
      sweepCappedTube(
        builder,
        [this._nodes[from], this._nodes[to]],
        this._radius,
        this._radialSegments,
        this._capSegments,
        [reveal(from), reveal(to)],
      );
    }

    if (this._jointRadius > this._radius) {
      const { vertices, faces } = icosphere(this._jointDetail);
      const used = new Set(this._edges.flat());
      for (const i of used) {
        const c = this._nodes[i];
        const base = builder.vertexCount;
        for (const d of vertices) {
          const r = this._jointRadius;
          builder.vertex([c[0] + r * d[0], c[1] + r * d[1], c[2] + r * d[2]], d, reveal(i));
        }
        for (const f of faces) builder.tri(base + f[0], base + f[1], base + f[2]);
      }
    }
    return builder.build();
  }

  /** Number of tubes. */
  getEdgeCount(): number {
    return this._edges.length;
  }

  /** A copy of the node positions. */
  getNodes(): Vector3Tuple[] {
    return this._nodes.map((p) => [...p] as Vector3Tuple);
  }

  /** A copy of the edges. */
  getEdges(): [number, number][] {
    return this._edges.map(([a, b]) => [a, b] as [number, number]);
  }

  /**
   * Generate a seeded, jittered lattice net inside a box or ellipsoid region.
   * Nodes left without an edge are removed. Spread the result into the
   * TubeNetwork3D options.
   *
   * @post result.edges.every(([a, b]) => a < result.nodes.length && b < result.nodes.length)
   */
  static lattice(options: TubeLatticeOptions = {}): TubeGraph {
    const { center = [0, 0, 0], seed = 1, warp } = options;
    requireNumber('TubeNetwork3D.lattice', 'spacing', options.spacing ?? 0.4, 0, true);
    (options.size ?? [3, 3, 0.2]).forEach((v, i) =>
      requireNumber('TubeNetwork3D.lattice', `size[${i}]`, v, 0),
    );
    requireNumber('TubeNetwork3D.lattice', 'jitter', options.jitter ?? 0.35);
    const rng = mulberry32(seed);
    const grid = latticeNodes(options, rng);
    const edges = latticeEdges(grid, options, rng);
    return compactGraph(grid.raw, edges, center, warp);
  }

  override copy(): TubeNetwork3D {
    const copy = new TubeNetwork3D({
      nodes: this._nodes,
      edges: this._edges,
      radius: this._radius,
      jointRadius: this._jointRadius,
      radialSegments: this._radialSegments,
      capSegments: this._capSegments,
      jointDetail: this._jointDetail,
      root: this._rootNode,
      color: this.color,
      opacity: this._opacity,
      center: this._centerPoint,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

/** Jittered lattice positions; null where a node falls outside the region. */
interface LatticeGrid {
  counts: number[];
  raw: (Vector3Tuple | null)[];
}

/** Flat index of lattice cell (i, j, k). */
function latticeId(counts: number[], i: number, j: number, k: number): number {
  return (k * counts[1] + j) * counts[0] + i;
}

function latticeNodes(options: TubeLatticeOptions, rng: () => number): LatticeGrid {
  const {
    size = [3, 3, 0.2],
    center = [0, 0, 0],
    spacing = 0.4,
    jitter = 0.35,
    shape = 'box',
  } = options;
  const counts = size.map((s) => Math.max(1, Math.round(s / spacing) + 1));
  // An axis thinner than one spacing holds a single, un-jittered layer.
  const jitterAxis = size.map((s, axis) => !(counts[axis] === 1 && s < spacing));
  const raw: (Vector3Tuple | null)[] = [];
  for (let k = 0; k < counts[2]; k++) {
    for (let j = 0; j < counts[1]; j++) {
      for (let i = 0; i < counts[0]; i++) {
        const p = [i, j, k].map((g, axis) => {
          const base = counts[axis] === 1 ? 0 : (g / (counts[axis] - 1) - 0.5) * size[axis];
          return jitterAxis[axis] ? base + (rng() - 0.5) * 2 * jitter * spacing : base;
        });
        const radial = p.reduce(
          (acc, g, axis) => acc + (size[axis] > 0 ? (2 * g) / size[axis] : 0) ** 2,
          0,
        );
        const inside = shape === 'box' || radial <= 1;
        raw.push(inside ? [p[0] + center[0], p[1] + center[1], p[2] + center[2]] : null);
      }
    }
  }
  return { counts, raw };
}

function latticeEdges(
  grid: LatticeGrid,
  options: TubeLatticeOptions,
  rng: () => number,
): [number, number][] {
  const { dropout = 0.15, diagonals = 0.3 } = options;
  const { counts, raw } = grid;
  const id = (i: number, j: number, k: number) => latticeId(counts, i, j, k);
  const edges: [number, number][] = [];
  const tryEdge = (a: number, b: number, keep: number) => {
    if (raw[a] && raw[b] && rng() < keep) edges.push([a, b]);
  };
  for (let k = 0; k < counts[2]; k++) {
    for (let j = 0; j < counts[1]; j++) {
      for (let i = 0; i < counts[0]; i++) {
        const here = id(i, j, k);
        if (i + 1 < counts[0]) tryEdge(here, id(i + 1, j, k), 1 - dropout);
        if (j + 1 < counts[1]) tryEdge(here, id(i, j + 1, k), 1 - dropout);
        if (k + 1 < counts[2]) tryEdge(here, id(i, j, k + 1), 1 - dropout);
        if (i + 1 < counts[0] && j + 1 < counts[1]) {
          if (rng() < 0.5) tryEdge(here, id(i + 1, j + 1, k), diagonals);
          else tryEdge(id(i + 1, j, k), id(i, j + 1, k), diagonals);
        }
      }
    }
  }
  return edges;
}

/**
 * Keep only nodes that carry an edge, re-index them, and put the node nearest
 * `center` first, so the default root (node 0) grows the net from the middle.
 */
function compactGraph(
  raw: (Vector3Tuple | null)[],
  edges: [number, number][],
  center: Vector3Tuple,
  warp: ((p: Vector3Tuple) => Vector3Tuple) | undefined,
): TubeGraph {
  const remap = new Map<number, number>();
  const nodes: Vector3Tuple[] = [];
  for (const v of edges.flat()) {
    if (remap.has(v)) continue;
    remap.set(v, nodes.length);
    const p = raw[v] as Vector3Tuple;
    nodes.push(warp ? warp(p) : p);
  }
  let nearest = 0;
  nodes.forEach((p, i) => {
    if (lengthVec(subVec(p, center)) < lengthVec(subVec(nodes[nearest], center))) nearest = i;
  });
  const swap = (i: number) => (i === nearest ? 0 : i === 0 ? nearest : i);
  if (nodes.length > 0) [nodes[0], nodes[nearest]] = [nodes[nearest], nodes[0]];
  return {
    nodes,
    edges: edges.map(([a, b]) => [swap(remap.get(a) ?? 0), swap(remap.get(b) ?? 0)]),
  };
}
