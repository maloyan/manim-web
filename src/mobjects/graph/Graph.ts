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

import { EdgeTuple, GenericGraphOptions } from './graphTypes';
import { GenericGraph } from './GenericGraph';

export class Graph extends GenericGraph {
  constructor(options: GenericGraphOptions = {}) {
    super(options);
    this._directed = false;
  }

  override copy(): Graph {
    const copy = new Graph({
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
