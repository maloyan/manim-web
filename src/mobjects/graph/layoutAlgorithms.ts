/**
 * Layout algorithms for graph vertex positioning
 */

import { Vector3Tuple } from '../../core/Mobject';
import { VertexId, EdgeTuple, LayoutConfig, VertexConfig } from './graphTypes';

/**
 * Compute vertex positions using the specified layout algorithm
 */
// eslint-disable-next-line complexity
export function computeLayout(
  vertices: VertexId[],
  edges: EdgeTuple[],
  config: LayoutConfig,
  vertexConfig?: Map<VertexId, VertexConfig>,
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
export function computeCircularLayout(
  vertices: VertexId[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple,
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
// eslint-disable-next-line complexity
function computeSpringLayout(
  vertices: VertexId[],
  edges: EdgeTuple[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple,
  iterations: number,
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
  root?: VertexId,
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
  center: Vector3Tuple,
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
  center: Vector3Tuple,
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
  center: Vector3Tuple,
): void {
  const n = vertices.length;
  if (n === 0) return;

  // Determine number of shells (roughly sqrt(n))
  const numShells = Math.max(1, Math.ceil(Math.sqrt(n / 4)));
  const verticesPerShell: VertexId[][] = Array.from({ length: numShells }, () => []);

  // Distribute vertices across shells
  let idx = 0;
  for (let shell = 0; shell < numShells && idx < n; shell++) {
    const shellSize = Math.min(Math.max(1, Math.ceil((n - idx) / (numShells - shell))), n - idx);
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
// eslint-disable-next-line complexity
function computeKamadaKawaiLayout(
  vertices: VertexId[],
  edges: EdgeTuple[],
  positions: Map<VertexId, Vector3Tuple>,
  scale: number,
  center: Vector3Tuple,
  iterations: number,
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
  const dist: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
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
  partition?: [VertexId[], VertexId[]],
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
