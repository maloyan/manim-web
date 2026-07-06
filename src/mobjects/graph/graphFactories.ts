/**
 * Factory functions for creating common graph types
 */

import { Vector3Tuple } from "../../core/Mobject";
import { EdgeTuple, GenericGraphOptions, VertexId } from "./graphTypes";
import { Graph } from "./Graph";
import { DiGraph } from "./DiGraph";

/**
 * Create a complete graph (all vertices connected)
 * @param n - Number of vertices
 * @returns A complete Graph with n vertices
 */
export function completeGraph(
  n: number,
  options: Partial<GenericGraphOptions> = {},
): Graph {
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
    layout: "circular",
    ...options,
  });
}

/**
 * Create a cycle graph (vertices in a ring)
 * @param n - Number of vertices
 * @returns A cycle Graph with n vertices
 */
export function cycleGraph(
  n: number,
  options: Partial<GenericGraphOptions> = {},
): Graph {
  const vertices: VertexId[] = Array.from({ length: n }, (_, i) => i);
  const edges: EdgeTuple[] = vertices.map((v, i) => [v, vertices[(i + 1) % n]]);

  return new Graph({
    vertices,
    edges,
    layout: "circular",
    ...options,
  });
}

/**
 * Create a path graph (linear chain)
 * @param n - Number of vertices
 * @returns A path Graph with n vertices
 */
export function pathGraph(
  n: number,
  options: Partial<GenericGraphOptions> = {},
): Graph {
  const vertices: VertexId[] = Array.from({ length: n }, (_, i) => i);
  const edges: EdgeTuple[] = [];

  for (let i = 0; i < n - 1; i++) {
    edges.push([i, i + 1]);
  }

  return new Graph({
    vertices,
    edges,
    layout: {
      type: "custom",
      positions: new Map(
        vertices.map((
          v,
          i,
        ) => [v, [(i - (n - 1) / 2) * 0.8, 0, 0] as Vector3Tuple]),
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
export function starGraph(
  n: number,
  options: Partial<GenericGraphOptions> = {},
): Graph {
  const center: VertexId = 0;
  const vertices: VertexId[] = [
    center,
    ...Array.from({ length: n }, (_, i) => i + 1),
  ];
  const edges: EdgeTuple[] = vertices.slice(1).map((v) => [center, v]);

  return new Graph({
    vertices,
    edges,
    layout: "shell",
    ...options,
  });
}

/**
 * Create a binary tree
 * @param depth - Depth of the tree
 * @returns A binary tree DiGraph
 */
export function binaryTree(
  depth: number,
  options: Partial<GenericGraphOptions> = {},
): DiGraph {
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
    layout: { type: "tree", root: 0 },
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
  options: Partial<GenericGraphOptions> = {},
): Graph {
  const vertices: VertexId[] = [];
  const edges: EdgeTuple[] = [];
  const positions = new Map<VertexId, Vector3Tuple>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = `${r},${c}`;
      vertices.push(v);
      positions.set(v, [
        (c - (cols - 1) / 2) * 0.8,
        ((rows - 1) / 2 - r) * 0.8,
        0,
      ]);

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
    layout: { type: "custom", positions },
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
  options: Partial<GenericGraphOptions> = {},
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
    layout: { type: "bipartite", partition: [left, right] },
    ...options,
  });
}
