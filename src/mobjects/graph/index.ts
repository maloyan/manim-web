/**
 * Graph mobjects for network visualization in manimweb
 *
 * This module provides graph classes for visualizing networks with vertices
 * and edges. Supports both undirected (Graph) and directed (DiGraph) graphs
 * with various layout algorithms.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Dot } from '../geometry/Dot';
import { Line } from '../geometry/Line';
import { Arrow } from '../geometry/Arrow';
import { BLUE, WHITE, RED, DEFAULT_STROKE_WIDTH } from '../../constants';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Unique identifier for a vertex
 */
export type VertexId = string | number;

/**
 * Edge definition as a tuple of [source, target]
 */
export type EdgeTuple = [VertexId, VertexId];

/**
 * Layout algorithm types
 */
export type LayoutType =
  | 'spring'
  | 'circular'
  | 'shell'
  | 'tree'
  | 'random'
  | 'grid'
  | 'kamada_kawai'
  | 'spectral'
  | 'bipartite'
  | 'custom';

/**
 * Options for vertex styling
 */
export interface VertexStyleOptions {
  /** Radius of the vertex dot. Default: 0.15 */
  radius?: number;
  /** Fill color of the vertex. Default: WHITE */
  color?: string;
  /** Fill opacity. Default: 1 */
  fillOpacity?: number;
  /** Stroke color for the vertex border. Default: same as color */
  strokeColor?: string;
  /** Stroke width. Default: 2 */
  strokeWidth?: number;
}

/**
 * Options for edge styling
 */
export interface EdgeStyleOptions {
  /** Color of the edge. Default: BLUE */
  color?: string;
  /** Stroke width of the edge. Default: 4 */
  strokeWidth?: number;
  /** For directed graphs, tip length. Default: 0.2 */
  tipLength?: number;
  /** For directed graphs, tip width. Default: 0.12 */
  tipWidth?: number;
}

/**
 * Configuration for a single vertex
 */
export interface VertexConfig {
  /** Position of the vertex (if using custom layout) */
  position?: Vector3Tuple;
  /** Custom styling for this vertex */
  style?: VertexStyleOptions;
  /** Label text to display next to the vertex */
  label?: string;
}

/**
 * Configuration for a single edge
 */
export interface EdgeConfig {
  /** Custom styling for this edge */
  style?: EdgeStyleOptions;
  /** Label text to display on the edge */
  label?: string;
  /** Weight of the edge (used by some layout algorithms) */
  weight?: number;
}

/**
 * Layout configuration options
 */
export interface LayoutConfig {
  /** Type of layout algorithm */
  type: LayoutType;
  /** Scale factor for the layout. Default: 2 */
  scale?: number;
  /** Center point of the layout. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Number of iterations for force-directed layouts. Default: 50 */
  iterations?: number;
  /** For tree layout: root vertex */
  root?: VertexId;
  /** For bipartite layout: partition sets */
  partition?: [VertexId[], VertexId[]];
  /** Custom positions map for custom layout */
  positions?: Map<VertexId, Vector3Tuple>;
}

/**
 * Options for creating a graph
 */
export interface GenericGraphOptions {
  /** List of vertex identifiers */
  vertices?: VertexId[];
  /** List of edges as [source, target] tuples */
  edges?: EdgeTuple[];
  /** Layout configuration */
  layout?: LayoutType | LayoutConfig;
  /** Default vertex styling */
  vertexStyle?: VertexStyleOptions;
  /** Default edge styling */
  edgeStyle?: EdgeStyleOptions;
  /** Per-vertex configuration */
  vertexConfig?: Map<VertexId, VertexConfig> | Record<string, VertexConfig>;
  /** Per-edge configuration (key is "source-target") */
  edgeConfig?: Map<string, EdgeConfig> | Record<string, EdgeConfig>;
  /** Whether to show vertex labels. Default: false */
  showLabels?: boolean;
  /** Label font size. Default: 24 */
  labelFontSize?: number;
}

// ============================================================================
// Layout Algorithms
// ============================================================================

/**
 * Compute vertex positions using the specified layout algorithm
 */
function computeLayout(
  vertices: VertexId[],
  edges: EdgeTuple[],
  config: LayoutConfig,
  vertexConfig?: Map<VertexId, VertexConfig>
): Map<VertexId, Vector3Tuple> {
  const positions = new Map<VertexId, Vector3Tuple>();
  const scale = config.scale ?? 2;
  const center = config.center ?? [0, 0, 0];

  switch (config.type) {
    case 'circular':
      computeCircularLayout(vertices, positions, scale, center);
      break;
    case 'spring':
      computeSpringLayout(vertices, edges, positions, scale, center, config.iterations ?? 50);
      break;
    case 'tree':
      computeTreeLayout(vertices, edges, positions, scale, center, config.root);
      break;
    case 'grid':
      computeGridLayout(vertices, positions, scale, center);
      break;
    case 'random':
      computeRandomLayout(vertices, positions, scale, center);
      break;
    case 'shell':
      computeShellLayout(vertices, positions, scale, center);
      break;
    case 'kamada_kawai':
      computeKamadaKawaiLayout(vertices, edges, positions, scale, center, config.iterations ?? 50);
      break;
    case 'bipartite':
      computeBipartiteLayout(vertices, positions, scale, center, config.partition);
      break;
    case 'custom':
      if (config.positions) {
        for (const [v, pos] of config.positions) {
          positions.set(v, pos);
        }
      }
      break;
    default:
      computeCircularLayout(vertices, positions, scale, center);
  }

  // Override with any custom positions from vertexConfig
  if (vertexConfig) {
    for (const [v, cfg] of vertexConfig) {
      if (cfg.position) {
        positions.set(v, cfg.position);
      }
    }
  }

  return positions;
}

/**
 * Circular layout: vertices equally spaced on a circle
 */
function computeCircularLayout(
  vertices: VertexId[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple
): void {
  const n = vertices.length;
  if (n === 0) return;

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2; // Start from top
    const x = center[0] + scale * Math.cos(angle);
    const y = center[1] + scale * Math.sin(angle);
    positions.set(vertices[i], [x, y, center[2]]);
  }
}

/**
 * Spring (force-directed) layout using Fruchterman-Reingold algorithm
 */
function computeSpringLayout(
  vertices: VertexId[],
  edges: EdgeTuple[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple,
  iterations: number
): void {
  const n = vertices.length;
  if (n === 0) return;

  // Initialize with random positions
  const pos: Map<VertexId, { x: number; y: number }> = new Map();
  for (const v of vertices) {
    pos.set(v, {
      x: center[0] + (Math.random() - 0.5) * scale * 2,
      y: center[1] + (Math.random() - 0.5) * scale * 2,
    });
  }

  // Build adjacency
  const adjacency = new Map<VertexId, Set<VertexId>>();
  for (const v of vertices) {
    adjacency.set(v, new Set());
  }
  for (const [u, v] of edges) {
    adjacency.get(u)?.add(v);
    adjacency.get(v)?.add(u);
  }

  // Fruchterman-Reingold parameters
  const area = scale * scale * 4;
  const k = Math.sqrt(area / n);
  let temperature = scale;

  for (let iter = 0; iter < iterations; iter++) {
    const disp: Map<VertexId, { x: number; y: number }> = new Map();
    for (const v of vertices) {
      disp.set(v, { x: 0, y: 0 });
    }

    // Repulsive forces between all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const u = vertices[i];
        const v = vertices[j];
        const pu = pos.get(u)!;
        const pv = pos.get(v)!;
        const dx = pu.x - pv.x;
        const dy = pu.y - pv.y;
        const dist = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        disp.get(u)!.x += fx;
        disp.get(u)!.y += fy;
        disp.get(v)!.x -= fx;
        disp.get(v)!.y -= fy;
      }
    }

    // Attractive forces along edges
    for (const [u, v] of edges) {
      const pu = pos.get(u);
      const pv = pos.get(v);
      if (!pu || !pv) continue;
      const dx = pu.x - pv.x;
      const dy = pu.y - pv.y;
      const dist = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp.get(u)!.x -= fx;
      disp.get(u)!.y -= fy;
      disp.get(v)!.x += fx;
      disp.get(v)!.y += fy;
    }

    // Apply displacements with temperature limit
    for (const v of vertices) {
      const d = disp.get(v)!;
      const p = pos.get(v)!;
      const dist = Math.sqrt(d.x * d.x + d.y * d.y);
      if (dist > 0) {
        const factor = Math.min(dist, temperature) / dist;
        p.x += d.x * factor;
        p.y += d.y * factor;
      }
    }

    // Cool down
    temperature *= 0.95;
  }

  // Copy to output
  for (const v of vertices) {
    const p = pos.get(v)!;
    positions.set(v, [p.x, p.y, center[2]]);
  }
}

/**
 * Tree layout using a simple hierarchical algorithm
 */
function computeTreeLayout(
  vertices: VertexId[],
  edges: EdgeTuple[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple,
  root?: VertexId
): void {
  if (vertices.length === 0) return;

  // Build adjacency list
  const children = new Map<VertexId, VertexId[]>();
  for (const v of vertices) {
    children.set(v, []);
  }

  // Find root (use provided or first vertex)
  const rootVertex = root ?? vertices[0];

  // Build tree from edges (assuming directed from parent to child)
  const visited = new Set<VertexId>();
  const queue: VertexId[] = [rootVertex];
  visited.add(rootVertex);

  // BFS to build tree structure
  const parent = new Map<VertexId, VertexId | null>();
  parent.set(rootVertex, null);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const [u, v] of edges) {
      if (u === current && !visited.has(v)) {
        children.get(current)!.push(v);
        parent.set(v, current);
        visited.add(v);
        queue.push(v);
      } else if (v === current && !visited.has(u)) {
        children.get(current)!.push(u);
        parent.set(u, current);
        visited.add(u);
        queue.push(u);
      }
    }
  }

  // Compute tree dimensions
  const depth = new Map<VertexId, number>();
  const subtreeSize = new Map<VertexId, number>();

  function computeDepthAndSize(v: VertexId, d: number): number {
    depth.set(v, d);
    const kids = children.get(v) ?? [];
    if (kids.length === 0) {
      subtreeSize.set(v, 1);
      return 1;
    }
    let size = 0;
    for (const child of kids) {
      size += computeDepthAndSize(child, d + 1);
    }
    subtreeSize.set(v, size);
    return size;
  }

  computeDepthAndSize(rootVertex, 0);

  // Assign positions
  const maxDepth = Math.max(...Array.from(depth.values()));
  const verticalSpacing = maxDepth > 0 ? (scale * 2) / maxDepth : 1;

  function assignPositions(v: VertexId, xMin: number, xMax: number): void {
    const d = depth.get(v)!;
    const xMid = (xMin + xMax) / 2;
    const y = center[1] + scale - d * verticalSpacing;
    positions.set(v, [xMid, y, center[2]]);

    const kids = children.get(v) ?? [];
    if (kids.length === 0) return;

    const totalSize = subtreeSize.get(v)! - 1;
    let currentX = xMin;
    for (const child of kids) {
      const childSize = subtreeSize.get(child)!;
      const childWidth = ((xMax - xMin) * childSize) / totalSize;
      assignPositions(child, currentX, currentX + childWidth);
      currentX += childWidth;
    }
  }

  const totalWidth = scale * 2;
  assignPositions(rootVertex, center[0] - totalWidth / 2, center[0] + totalWidth / 2);

  // Position any unvisited vertices
  let offset = 0;
  for (const v of vertices) {
    if (!positions.has(v)) {
      positions.set(v, [center[0] + offset * 0.5, center[1] - scale, center[2]]);
      offset++;
    }
  }
}

/**
 * Grid layout: vertices arranged in a grid
 */
function computeGridLayout(
  vertices: VertexId[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple
): void {
  const n = vertices.length;
  if (n === 0) return;

  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const spacing = scale / Math.max(cols - 1, rows - 1, 1);

  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = center[0] + (col - (cols - 1) / 2) * spacing;
    const y = center[1] + ((rows - 1) / 2 - row) * spacing;
    positions.set(vertices[i], [x, y, center[2]]);
  }
}

/**
 * Random layout: vertices at random positions
 */
function computeRandomLayout(
  vertices: VertexId[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple
): void {
  for (const v of vertices) {
    const x = center[0] + (Math.random() - 0.5) * scale * 2;
    const y = center[1] + (Math.random() - 0.5) * scale * 2;
    positions.set(v, [x, y, center[2]]);
  }
}

/**
 * Shell layout: vertices arranged in concentric circles
 */
function computeShellLayout(
  vertices: VertexId[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple
): void {
  const n = vertices.length;
  if (n === 0) return;

  // Determine number of shells (roughly sqrt(n))
  const numShells = Math.max(1, Math.ceil(Math.sqrt(n / 4)));
  const verticesPerShell: VertexId[][] = Array.from({ length: numShells }, () => []);

  // Distribute vertices across shells
  let idx = 0;
  for (let shell = 0; shell < numShells && idx < n; shell++) {
    const shellSize = Math.min(
      Math.max(1, Math.ceil((n - idx) / (numShells - shell))),
      n - idx
    );
    for (let i = 0; i < shellSize && idx < n; i++) {
      verticesPerShell[shell].push(vertices[idx++]);
    }
  }

  // Position vertices in each shell
  for (let shell = 0; shell < numShells; shell++) {
    const shellVertices = verticesPerShell[shell];
    const radius = ((shell + 1) / numShells) * scale;
    for (let i = 0; i < shellVertices.length; i++) {
      const angle = (2 * Math.PI * i) / shellVertices.length - Math.PI / 2;
      const x = center[0] + radius * Math.cos(angle);
      const y = center[1] + radius * Math.sin(angle);
      positions.set(shellVertices[i], [x, y, center[2]]);
    }
  }
}

/**
 * Kamada-Kawai layout: force-directed with graph-theoretic distances
 */
function computeKamadaKawaiLayout(
  vertices: VertexId[],
  edges: EdgeTuple[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple,
  iterations: number
): void {
  const n = vertices.length;
  if (n === 0) return;
  if (n === 1) {
    positions.set(vertices[0], [...center]);
    return;
  }

  // Initialize with circular layout
  computeCircularLayout(vertices, positions, scale * 0.5, center);

  // Compute shortest path distances using Floyd-Warshall
  const dist: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(Infinity)
  );
  const vertexIndex = new Map<VertexId, number>();
  vertices.forEach((v, i) => {
    vertexIndex.set(v, i);
    dist[i][i] = 0;
  });

  for (const [u, v] of edges) {
    const i = vertexIndex.get(u)!;
    const j = vertexIndex.get(v)!;
    dist[i][j] = 1;
    dist[j][i] = 1;
  }

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }

  // Compute ideal distances
  const maxDist = Math.max(...dist.flat().filter((d) => d !== Infinity));
  const L = scale / (maxDist || 1);
  const K = 1;

  // Kamada-Kawai iterations
  const pos = vertices.map((v) => {
    const p = positions.get(v)!;
    return { x: p[0], y: p[1] };
  });

  for (let iter = 0; iter < iterations; iter++) {
    for (let m = 0; m < n; m++) {
      let dEdx = 0;
      let dEdy = 0;

      for (let i = 0; i < n; i++) {
        if (i === m || dist[m][i] === Infinity) continue;
        const dx = pos[m].x - pos[i].x;
        const dy = pos[m].y - pos[i].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d === 0) continue;
        const lij = L * dist[m][i];
        const kij = K / (dist[m][i] * dist[m][i]);
        dEdx += kij * (dx - (lij * dx) / d);
        dEdy += kij * (dy - (lij * dy) / d);
      }

      const stepSize = 0.1;
      pos[m].x -= stepSize * dEdx;
      pos[m].y -= stepSize * dEdy;
    }
  }

  // Copy results
  for (let i = 0; i < n; i++) {
    positions.set(vertices[i], [pos[i].x, pos[i].y, center[2]]);
  }
}

/**
 * Bipartite layout: two columns of vertices
 */
function computeBipartiteLayout(
  vertices: VertexId[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple,
  partition?: [VertexId[], VertexId[]]
): void {
  const n = vertices.length;
  if (n === 0) return;

  // Use provided partition or split in half
  const [left, right] = partition ?? [
    vertices.slice(0, Math.ceil(n / 2)),
    vertices.slice(Math.ceil(n / 2)),
  ];

  const xLeft = center[0] - scale;
  const xRight = center[0] + scale;

  // Position left column
  const leftSpacing = left.length > 1 ? (scale * 2) / (left.length - 1) : 0;
  for (let i = 0; i < left.length; i++) {
    const y = center[1] + scale - i * leftSpacing;
    positions.set(left[i], [xLeft, y, center[2]]);
  }

  // Position right column
  const rightSpacing = right.length > 1 ? (scale * 2) / (right.length - 1) : 0;
  for (let i = 0; i < right.length; i++) {
    const y = center[1] + scale - i * rightSpacing;
    positions.set(right[i], [xRight, y, center[2]]);
  }
}

// ============================================================================
// GenericGraph Base Class
// ============================================================================

/**
 * GenericGraph - Base class for graph visualization
 *
 * Provides the foundation for both directed and undirected graphs.
 * Manages vertices and edges as Mobject children for animation support.
 */
export class GenericGraph extends Mobject {
  /** List of vertex identifiers */
  protected _vertices: VertexId[] = [];

  /** List of edges as [source, target] tuples */
  protected _edges: EdgeTuple[] = [];

  /** Map of vertex id to position */
  protected _positions: Map<VertexId, Vector3Tuple> = new Map();

  /** Map of vertex id to Dot mobject */
  protected _vertexMobjects: Map<VertexId, Dot> = new Map();

  /** Map of edge key to Line/Arrow mobject */
  protected _edgeMobjects: Map<string, Mobject> = new Map();

  /** Layout configuration */
  protected _layoutConfig: LayoutConfig;

  /** Default vertex style */
  protected _vertexStyle: VertexStyleOptions;

  /** Default edge style */
  protected _edgeStyle: EdgeStyleOptions;

  /** Per-vertex configuration */
  protected _vertexConfig: Map<VertexId, VertexConfig> = new Map();

  /** Per-edge configuration */
  protected _edgeConfig: Map<string, EdgeConfig> = new Map();

  /** Whether this is a directed graph */
  protected _directed: boolean = false;

  /** Three.js group for this graph */
  protected _group: THREE.Group | null = null;

  constructor(options: GenericGraphOptions = {}) {
    super();

    const {
      vertices = [],
      edges = [],
      layout = 'spring',
      vertexStyle = {},
      edgeStyle = {},
      vertexConfig,
      edgeConfig,
    } = options;

    // Store configuration
    this._vertexStyle = {
      radius: 0.15,
      color: WHITE,
      fillOpacity: 1,
      strokeWidth: 2,
      ...vertexStyle,
    };

    this._edgeStyle = {
      color: BLUE,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      tipLength: 0.2,
      tipWidth: 0.12,
      ...edgeStyle,
    };

    // Parse layout config
    if (typeof layout === 'string') {
      this._layoutConfig = { type: layout, scale: 2, center: [0, 0, 0] };
    } else {
      this._layoutConfig = { scale: 2, center: [0, 0, 0], ...layout };
    }

    // Convert vertex config
    if (vertexConfig) {
      if (vertexConfig instanceof Map) {
        this._vertexConfig = vertexConfig;
      } else {
        for (const [k, v] of Object.entries(vertexConfig)) {
          this._vertexConfig.set(k, v);
        }
      }
    }

    // Convert edge config
    if (edgeConfig) {
      if (edgeConfig instanceof Map) {
        this._edgeConfig = edgeConfig;
      } else {
        for (const [k, v] of Object.entries(edgeConfig)) {
          this._edgeConfig.set(k, v);
        }
      }
    }

    // Add initial vertices and edges
    for (const v of vertices) {
      this._vertices.push(v);
    }
    for (const e of edges) {
      this._edges.push(e);
    }

    // Compute layout and create mobjects
    this._computeLayout();
    this._createMobjects();
  }

  /**
   * Get edge key from vertex pair
   */
  protected _getEdgeKey(source: VertexId, target: VertexId): string {
    if (this._directed) {
      return `${source}->${target}`;
    }
    // For undirected, use canonical ordering
    const a = String(source);
    const b = String(target);
    return a < b ? `${a}--${b}` : `${b}--${a}`;
  }

  /**
   * Compute vertex positions using the layout algorithm
   */
  protected _computeLayout(): void {
    this._positions = computeLayout(
      this._vertices,
      this._edges,
      this._layoutConfig,
      this._vertexConfig
    );
  }

  /**
   * Create vertex and edge mobjects
   */
  protected _createMobjects(): void {
    // Clear existing mobjects
    for (const m of this._vertexMobjects.values()) {
      this.remove(m);
    }
    for (const m of this._edgeMobjects.values()) {
      this.remove(m);
    }
    this._vertexMobjects.clear();
    this._edgeMobjects.clear();

    // Create edges first (so they render behind vertices)
    for (const [source, target] of this._edges) {
      this._createEdgeMobject(source, target);
    }

    // Create vertices
    for (const v of this._vertices) {
      this._createVertexMobject(v);
    }

    this._markDirty();
  }

  /**
   * Create a single vertex mobject
   */
  protected _createVertexMobject(v: VertexId): void {
    const pos = this._positions.get(v) ?? [0, 0, 0];
    const cfg = this._vertexConfig.get(v);
    const style = { ...this._vertexStyle, ...cfg?.style };

    const dot = new Dot({
      point: pos,
      radius: style.radius,
      color: style.color,
      fillOpacity: style.fillOpacity,
      strokeWidth: style.strokeWidth,
    });

    if (style.strokeColor) {
      dot.setColor(style.strokeColor);
    }

    this._vertexMobjects.set(v, dot);
    this.add(dot);
  }

  /**
   * Create a single edge mobject
   */
  protected _createEdgeMobject(source: VertexId, target: VertexId): void {
    const sourcePos = this._positions.get(source) ?? [0, 0, 0];
    const targetPos = this._positions.get(target) ?? [0, 0, 0];
    const key = this._getEdgeKey(source, target);
    const cfg = this._edgeConfig.get(key);
    const style = { ...this._edgeStyle, ...cfg?.style };

    // Shorten edge to not overlap with vertex circles
    const vertexRadius = this._vertexStyle.radius ?? 0.15;
    const [startPos, endPos] = this._shortenEdge(sourcePos, targetPos, vertexRadius);

    let edge: Mobject;
    if (this._directed) {
      edge = new Arrow({
        start: startPos,
        end: endPos,
        color: style.color,
        strokeWidth: style.strokeWidth,
        tipLength: style.tipLength,
        tipWidth: style.tipWidth,
      });
    } else {
      edge = new Line({
        start: startPos,
        end: endPos,
        color: style.color,
        strokeWidth: style.strokeWidth,
      });
    }

    this._edgeMobjects.set(key, edge);
    this.add(edge);
  }

  /**
   * Shorten an edge to not overlap with vertex circles
   */
  protected _shortenEdge(
    start: Vector3Tuple,
    end: Vector3Tuple,
    radius: number
  ): [Vector3Tuple, Vector3Tuple] {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (length < radius * 2) {
      // Edge too short, return midpoint
      const mid: Vector3Tuple = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2,
      ];
      return [mid, mid];
    }

    const factor = radius / length;
    const newStart: Vector3Tuple = [
      start[0] + dx * factor,
      start[1] + dy * factor,
      start[2] + dz * factor,
    ];
    const newEnd: Vector3Tuple = [
      end[0] - dx * factor,
      end[1] - dy * factor,
      end[2] - dz * factor,
    ];

    return [newStart, newEnd];
  }

  // ========== Vertex Operations ==========

  /**
   * Add a vertex to the graph
   * @param v - Vertex identifier
   * @param config - Optional vertex configuration
   * @returns this for chaining
   */
  addVertex(v: VertexId, config?: VertexConfig): this {
    if (this._vertices.includes(v)) {
      return this; // Already exists
    }

    this._vertices.push(v);
    if (config) {
      this._vertexConfig.set(v, config);
    }

    // Recompute layout and recreate mobjects
    this._computeLayout();
    this._createMobjects();

    return this;
  }

  /**
   * Add multiple vertices to the graph
   * @param vertices - Array of vertex identifiers
   * @returns this for chaining
   */
  addVertices(...vertices: VertexId[]): this {
    for (const v of vertices) {
      if (!this._vertices.includes(v)) {
        this._vertices.push(v);
      }
    }

    this._computeLayout();
    this._createMobjects();

    return this;
  }

  /**
   * Remove a vertex from the graph
   * @param v - Vertex identifier
   * @returns this for chaining
   */
  removeVertex(v: VertexId): this {
    const idx = this._vertices.indexOf(v);
    if (idx === -1) {
      return this;
    }

    this._vertices.splice(idx, 1);
    this._vertexConfig.delete(v);

    // Remove all edges connected to this vertex
    this._edges = this._edges.filter(([s, t]) => s !== v && t !== v);

    this._computeLayout();
    this._createMobjects();

    return this;
  }

  /**
   * Get all vertex identifiers
   */
  getVertices(): VertexId[] {
    return [...this._vertices];
  }

  /**
   * Get the number of vertices
   */
  get numVertices(): number {
    return this._vertices.length;
  }

  /**
   * Check if the graph contains a vertex
   */
  hasVertex(v: VertexId): boolean {
    return this._vertices.includes(v);
  }

  /**
   * Get the Dot mobject for a vertex
   */
  getVertexMobject(v: VertexId): Dot | undefined {
    return this._vertexMobjects.get(v);
  }

  /**
   * Get the position of a vertex
   */
  getVertexPosition(v: VertexId): Vector3Tuple | undefined {
    return this._positions.get(v);
  }

  /**
   * Set the position of a vertex
   */
  setVertexPosition(v: VertexId, position: Vector3Tuple): this {
    if (!this._vertices.includes(v)) {
      return this;
    }

    this._positions.set(v, position);
    const dot = this._vertexMobjects.get(v);
    if (dot) {
      dot.moveTo(position);
    }

    // Update connected edges
    for (const [source, target] of this._edges) {
      if (source === v || target === v) {
        const key = this._getEdgeKey(source, target);
        const edge = this._edgeMobjects.get(key);
        if (edge) {
          this.remove(edge);
          this._edgeMobjects.delete(key);
          this._createEdgeMobject(source, target);
        }
      }
    }

    this._markDirty();
    return this;
  }

  /**
   * Get neighbors of a vertex (adjacent vertices)
   */
  getNeighbors(v: VertexId): VertexId[] {
    const neighbors: VertexId[] = [];
    for (const [source, target] of this._edges) {
      if (source === v && !neighbors.includes(target)) {
        neighbors.push(target);
      } else if (target === v && !neighbors.includes(source)) {
        neighbors.push(source);
      }
    }
    return neighbors;
  }

  /**
   * Get the degree of a vertex (number of edges)
   */
  getDegree(v: VertexId): number {
    return this.getNeighbors(v).length;
  }

  // ========== Edge Operations ==========

  /**
   * Add an edge to the graph
   * @param source - Source vertex
   * @param target - Target vertex
   * @param config - Optional edge configuration
   * @returns this for chaining
   */
  addEdge(source: VertexId, target: VertexId, config?: EdgeConfig): this {
    // Add vertices if they don't exist
    if (!this._vertices.includes(source)) {
      this._vertices.push(source);
    }
    if (!this._vertices.includes(target)) {
      this._vertices.push(target);
    }

    // Check if edge already exists
    const key = this._getEdgeKey(source, target);
    if (this._edgeMobjects.has(key)) {
      return this;
    }

    this._edges.push([source, target]);
    if (config) {
      this._edgeConfig.set(key, config);
    }

    this._computeLayout();
    this._createMobjects();

    return this;
  }

  /**
   * Add multiple edges to the graph
   * @param edges - Array of [source, target] tuples
   * @returns this for chaining
   */
  addEdges(...edges: EdgeTuple[]): this {
    for (const [source, target] of edges) {
      if (!this._vertices.includes(source)) {
        this._vertices.push(source);
      }
      if (!this._vertices.includes(target)) {
        this._vertices.push(target);
      }

      const key = this._getEdgeKey(source, target);
      if (!this._edgeMobjects.has(key)) {
        this._edges.push([source, target]);
      }
    }

    this._computeLayout();
    this._createMobjects();

    return this;
  }

  /**
   * Remove an edge from the graph
   * @param source - Source vertex
   * @param target - Target vertex
   * @returns this for chaining
   */
  removeEdge(source: VertexId, target: VertexId): this {
    const key = this._getEdgeKey(source, target);

    this._edges = this._edges.filter(([s, t]) => {
      const edgeKey = this._getEdgeKey(s, t);
      return edgeKey !== key;
    });

    const edge = this._edgeMobjects.get(key);
    if (edge) {
      this.remove(edge);
      this._edgeMobjects.delete(key);
    }

    this._edgeConfig.delete(key);
    this._markDirty();

    return this;
  }

  /**
   * Get all edges
   */
  getEdges(): EdgeTuple[] {
    return [...this._edges];
  }

  /**
   * Get the number of edges
   */
  get numEdges(): number {
    return this._edges.length;
  }

  /**
   * Check if the graph contains an edge
   */
  hasEdge(source: VertexId, target: VertexId): boolean {
    const key = this._getEdgeKey(source, target);
    return this._edgeMobjects.has(key);
  }

  /**
   * Get the Line/Arrow mobject for an edge
   */
  getEdgeMobject(source: VertexId, target: VertexId): Mobject | undefined {
    const key = this._getEdgeKey(source, target);
    return this._edgeMobjects.get(key);
  }

  // ========== Layout Operations ==========

  /**
   * Change the layout algorithm
   * @param layout - Layout type or configuration
   * @returns this for chaining
   */
  setLayout(layout: LayoutType | LayoutConfig): this {
    if (typeof layout === 'string') {
      this._layoutConfig = { ...this._layoutConfig, type: layout };
    } else {
      this._layoutConfig = { ...this._layoutConfig, ...layout };
    }

    this._computeLayout();

    // Update mobject positions
    for (const v of this._vertices) {
      const pos = this._positions.get(v);
      const dot = this._vertexMobjects.get(v);
      if (pos && dot) {
        dot.moveTo(pos);
      }
    }

    // Recreate edges with new positions
    for (const [source, target] of this._edges) {
      const key = this._getEdgeKey(source, target);
      const edge = this._edgeMobjects.get(key);
      if (edge) {
        this.remove(edge);
        this._edgeMobjects.delete(key);
      }
      this._createEdgeMobject(source, target);
    }

    this._markDirty();
    return this;
  }

  /**
   * Get all vertex positions
   */
  getPositions(): Map<VertexId, Vector3Tuple> {
    return new Map(this._positions);
  }

  // ========== Styling Operations ==========

  /**
   * Set the color of a specific vertex
   */
  setVertexColor(v: VertexId, color: string): this {
    const dot = this._vertexMobjects.get(v);
    if (dot) {
      dot.setColor(color);
      dot.fillColor = color;
    }
    return this;
  }

  /**
   * Set the color of a specific edge
   */
  setEdgeColor(source: VertexId, target: VertexId, color: string): this {
    const key = this._getEdgeKey(source, target);
    const edge = this._edgeMobjects.get(key);
    if (edge) {
      edge.setColor(color);
    }
    return this;
  }

  /**
   * Highlight a path (sequence of vertices)
   */
  highlightPath(path: VertexId[], vertexColor: string = RED, edgeColor: string = RED): this {
    for (let i = 0; i < path.length; i++) {
      this.setVertexColor(path[i], vertexColor);
      if (i < path.length - 1) {
        this.setEdgeColor(path[i], path[i + 1], edgeColor);
      }
    }
    return this;
  }

  /**
   * Reset all colors to default
   */
  resetColors(): this {
    for (const [v, dot] of this._vertexMobjects) {
      const cfg = this._vertexConfig.get(v);
      const color = cfg?.style?.color ?? this._vertexStyle.color ?? WHITE;
      dot.setColor(color);
      dot.fillColor = color;
    }

    for (const [key, edge] of this._edgeMobjects) {
      const cfg = this._edgeConfig.get(key);
      const color = cfg?.style?.color ?? this._edgeStyle.color ?? BLUE;
      edge.setColor(color);
    }

    return this;
  }

  // ========== Three.js Integration ==========

  /**
   * Create the Three.js backing object
   */
  protected _createThreeObject(): THREE.Object3D {
    this._group = new THREE.Group();
    return this._group;
  }

  /**
   * Create a copy of this graph
   */
  protected _createCopy(): GenericGraph {
    return new GenericGraph({
      vertices: [...this._vertices],
      edges: this._edges.map((e) => [...e] as EdgeTuple),
      layout: { ...this._layoutConfig },
      vertexStyle: { ...this._vertexStyle },
      edgeStyle: { ...this._edgeStyle },
    });
  }
}

// ============================================================================
// Graph Class (Undirected)
// ============================================================================

/**
 * Graph - Undirected graph visualization
 *
 * Creates a graph with vertices connected by undirected edges (Lines).
 *
 * @example
 * ```typescript
 * // Create a simple triangle graph
 * const graph = new Graph({
 *   vertices: ['A', 'B', 'C'],
 *   edges: [['A', 'B'], ['B', 'C'], ['C', 'A']],
 *   layout: 'circular'
 * });
 *
 * // Create a graph with custom styling
 * const styledGraph = new Graph({
 *   vertices: [1, 2, 3, 4],
 *   edges: [[1, 2], [2, 3], [3, 4], [4, 1]],
 *   layout: 'spring',
 *   vertexStyle: { color: '#FF0000', radius: 0.2 },
 *   edgeStyle: { color: '#00FF00', strokeWidth: 3 }
 * });
 * ```
 */
export class Graph extends GenericGraph {
  constructor(options: GenericGraphOptions = {}) {
    super(options);
    this._directed = false;
  }

  /**
   * Create a copy of this graph
   */
  protected override _createCopy(): Graph {
    return new Graph({
      vertices: [...this._vertices],
      edges: this._edges.map((e) => [...e] as EdgeTuple),
      layout: { ...this._layoutConfig },
      vertexStyle: { ...this._vertexStyle },
      edgeStyle: { ...this._edgeStyle },
    });
  }
}

// ============================================================================
// DiGraph Class (Directed)
// ============================================================================

/**
 * Options for creating a directed graph
 */
export interface DiGraphOptions extends GenericGraphOptions {}

/**
 * DiGraph - Directed graph visualization
 *
 * Creates a graph with vertices connected by directed edges (Arrows).
 *
 * @example
 * ```typescript
 * // Create a directed graph
 * const digraph = new DiGraph({
 *   vertices: ['A', 'B', 'C'],
 *   edges: [['A', 'B'], ['B', 'C'], ['C', 'A']],
 *   layout: 'circular'
 * });
 *
 * // Tree structure with directed edges
 * const tree = new DiGraph({
 *   vertices: ['root', 'left', 'right', 'leafL', 'leafR'],
 *   edges: [
 *     ['root', 'left'],
 *     ['root', 'right'],
 *     ['left', 'leafL'],
 *     ['right', 'leafR']
 *   ],
 *   layout: { type: 'tree', root: 'root' }
 * });
 * ```
 */
export class DiGraph extends GenericGraph {
  constructor(options: DiGraphOptions = {}) {
    super(options);
    this._directed = true;

    // Recreate edge mobjects as arrows
    for (const m of this._edgeMobjects.values()) {
      this.remove(m);
    }
    this._edgeMobjects.clear();

    for (const [source, target] of this._edges) {
      this._createEdgeMobject(source, target);
    }
  }

  /**
   * Get out-neighbors (vertices this vertex points to)
   */
  getOutNeighbors(v: VertexId): VertexId[] {
    const neighbors: VertexId[] = [];
    for (const [source, target] of this._edges) {
      if (source === v && !neighbors.includes(target)) {
        neighbors.push(target);
      }
    }
    return neighbors;
  }

  /**
   * Get in-neighbors (vertices that point to this vertex)
   */
  getInNeighbors(v: VertexId): VertexId[] {
    const neighbors: VertexId[] = [];
    for (const [source, target] of this._edges) {
      if (target === v && !neighbors.includes(source)) {
        neighbors.push(source);
      }
    }
    return neighbors;
  }

  /**
   * Get out-degree (number of outgoing edges)
   */
  getOutDegree(v: VertexId): number {
    return this.getOutNeighbors(v).length;
  }

  /**
   * Get in-degree (number of incoming edges)
   */
  getInDegree(v: VertexId): number {
    return this.getInNeighbors(v).length;
  }

  /**
   * Create a copy of this digraph
   */
  protected override _createCopy(): DiGraph {
    return new DiGraph({
      vertices: [...this._vertices],
      edges: this._edges.map((e) => [...e] as EdgeTuple),
      layout: { ...this._layoutConfig },
      vertexStyle: { ...this._vertexStyle },
      edgeStyle: { ...this._edgeStyle },
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a complete graph (all vertices connected)
 * @param n - Number of vertices
 * @returns A complete Graph with n vertices
 */
export function completeGraph(n: number, options: Partial<GenericGraphOptions> = {}): Graph {
  const vertices: VertexId[] = Array.from({ length: n }, (_, i) => i);
  const edges: EdgeTuple[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      edges.push([i, j]);
    }
  }

  return new Graph({
    vertices,
    edges,
    layout: 'circular',
    ...options,
  });
}

/**
 * Create a cycle graph (vertices in a ring)
 * @param n - Number of vertices
 * @returns A cycle Graph with n vertices
 */
export function cycleGraph(n: number, options: Partial<GenericGraphOptions> = {}): Graph {
  const vertices: VertexId[] = Array.from({ length: n }, (_, i) => i);
  const edges: EdgeTuple[] = vertices.map((v, i) => [v, vertices[(i + 1) % n]]);

  return new Graph({
    vertices,
    edges,
    layout: 'circular',
    ...options,
  });
}

/**
 * Create a path graph (linear chain)
 * @param n - Number of vertices
 * @returns A path Graph with n vertices
 */
export function pathGraph(n: number, options: Partial<GenericGraphOptions> = {}): Graph {
  const vertices: VertexId[] = Array.from({ length: n }, (_, i) => i);
  const edges: EdgeTuple[] = [];

  for (let i = 0; i < n - 1; i++) {
    edges.push([i, i + 1]);
  }

  return new Graph({
    vertices,
    edges,
    layout: {
      type: 'custom',
      positions: new Map(
        vertices.map((v, i) => [v, [(i - (n - 1) / 2) * 0.8, 0, 0] as Vector3Tuple])
      ),
    },
    ...options,
  });
}

/**
 * Create a star graph (one central vertex connected to all others)
 * @param n - Number of outer vertices (total vertices = n + 1)
 * @returns A star Graph
 */
export function starGraph(n: number, options: Partial<GenericGraphOptions> = {}): Graph {
  const center: VertexId = 0;
  const vertices: VertexId[] = [center, ...Array.from({ length: n }, (_, i) => i + 1)];
  const edges: EdgeTuple[] = vertices.slice(1).map((v) => [center, v]);

  return new Graph({
    vertices,
    edges,
    layout: 'shell',
    ...options,
  });
}

/**
 * Create a binary tree
 * @param depth - Depth of the tree
 * @returns A binary tree DiGraph
 */
export function binaryTree(depth: number, options: Partial<GenericGraphOptions> = {}): DiGraph {
  const vertices: VertexId[] = [];
  const edges: EdgeTuple[] = [];

  // Generate vertices (BFS order)
  const numVertices = Math.pow(2, depth + 1) - 1;
  for (let i = 0; i < numVertices; i++) {
    vertices.push(i);
  }

  // Generate edges
  for (let i = 0; i < numVertices; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < numVertices) {
      edges.push([i, left]);
    }
    if (right < numVertices) {
      edges.push([i, right]);
    }
  }

  return new DiGraph({
    vertices,
    edges,
    layout: { type: 'tree', root: 0 },
    ...options,
  });
}

/**
 * Create a grid graph
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @returns A grid Graph
 */
export function gridGraph(
  rows: number,
  cols: number,
  options: Partial<GenericGraphOptions> = {}
): Graph {
  const vertices: VertexId[] = [];
  const edges: EdgeTuple[] = [];
  const positions = new Map<VertexId, Vector3Tuple>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = `${r},${c}`;
      vertices.push(v);
      positions.set(v, [(c - (cols - 1) / 2) * 0.8, ((rows - 1) / 2 - r) * 0.8, 0]);

      // Horizontal edge
      if (c < cols - 1) {
        edges.push([v, `${r},${c + 1}`]);
      }
      // Vertical edge
      if (r < rows - 1) {
        edges.push([v, `${r + 1},${c}`]);
      }
    }
  }

  return new Graph({
    vertices,
    edges,
    layout: { type: 'custom', positions },
    ...options,
  });
}

/**
 * Create a bipartite graph
 * @param n1 - Number of vertices in first partition
 * @param n2 - Number of vertices in second partition
 * @param edges - Edges between partitions (optional, complete if not provided)
 * @returns A bipartite Graph
 */
export function bipartiteGraph(
  n1: number,
  n2: number,
  edges?: EdgeTuple[],
  options: Partial<GenericGraphOptions> = {}
): Graph {
  const left: VertexId[] = Array.from({ length: n1 }, (_, i) => `L${i}`);
  const right: VertexId[] = Array.from({ length: n2 }, (_, i) => `R${i}`);
  const vertices = [...left, ...right];

  // If no edges provided, create complete bipartite graph
  const graphEdges: EdgeTuple[] = edges ?? [];
  if (!edges) {
    for (const l of left) {
      for (const r of right) {
        graphEdges.push([l, r]);
      }
    }
  }

  return new Graph({
    vertices,
    edges: graphEdges,
    layout: { type: 'bipartite', partition: [left, right] },
    ...options,
  });
}
