/**
 * Graph mobjects for network visualization in manimweb
 *
 * This module provides graph classes for visualizing networks with vertices
 * and edges. Supports both undirected (Graph) and directed (DiGraph) graphs
 * with various layout algorithms.
 */

// Types and interfaces
export type {
  DiGraphOptions,
  EdgeConfig,
  EdgeStyleOptions,
  EdgeTuple,
  GenericGraphOptions,
  LayoutConfig,
  LayoutType,
  VertexConfig,
  VertexId,
  VertexStyleOptions,
} from "./graphTypes";

// Layout algorithms (exported for direct use and testing)
export { computeCircularLayout, computeLayout } from "./layoutAlgorithms";

// Core graph classes
export { GenericGraph } from "./GenericGraph";
export { Graph } from "./Graph";
export { DiGraph } from "./DiGraph";

// Factory functions for common graph types
export {
  binaryTree,
  bipartiteGraph,
  completeGraph,
  cycleGraph,
  gridGraph,
  pathGraph,
  starGraph,
} from "./graphFactories";
