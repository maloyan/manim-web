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

import { VertexId, EdgeTuple, DiGraphOptions } from './graphTypes';
import { GenericGraph } from './GenericGraph';

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

  override copy(): DiGraph {
    const copy = new DiGraph({
      vertices: [...this._vertices],
      edges: this._edges.map((e) => [...e] as EdgeTuple),
      layout: { ...this._layoutConfig },
      vertexStyle: { ...this._vertexStyle },
      edgeStyle: { ...this._edgeStyle },
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
