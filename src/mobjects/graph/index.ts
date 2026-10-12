/**
 * Graph mobjects for network visualization in manimweb
 *
 * This module provides graph classes for visualizing networks with vertices
 * and edges. Supports both undirected (Graph) and directed (DiGraph) graphs
 * with various layout algorithms.
 */

// Types and interfaces
export type {
  VertexId,
  EdgeTuple,
  LayoutType,
  VertexStyleOptions,
  EdgeStyleOptions,
  VertexConfig,
  EdgeConfig,
  LayoutConfig,
  GenericGraphOptions,
  DiGraphOptions,
} from './graphTypes';

// Layout algorithms (exported for direct use and testing)
export {
  computeLayout,
  computeCircularLayout,
  springLayoutStep,
  randomSpringPositions,
  springForceConstant,
  DEFAULT_SPRING_COOLING,
  type SpringPoint,
  type SpringStepParams,
  type SpringStepResult,
} from './layoutAlgorithms';

// Animated (live) force-directed layout
export {
  ForceDirectedLayout,
  forceDirectedLayout,
  type ForceDirectedLayoutOptions,
} from './ForceDirectedLayout';

// Core graph classes
export { GenericGraph } from './GenericGraph';
export { Graph } from './Graph';
export { DiGraph } from './DiGraph';

// Factory functions for common graph types
export {
  completeGraph,
  cycleGraph,
  pathGraph,
  starGraph,
  binaryTree,
  gridGraph,
  bipartiteGraph,
} from './graphFactories';

// Sankey (flow) diagram
export {
  SankeyDiagram,
  SankeyNode,
  SankeyLink,
  type SankeyDiagramOptions,
  type SankeyLinkColorMode,
  type SankeySpan,
} from './SankeyDiagram';
export {
  computeSankeyLayout,
  orientPoint,
  type SankeyNodeInput,
  type SankeyLinkInput,
  type SankeyOrientation,
  type SankeyLayoutOptions,
  type NodeLayout,
  type LinkLayout,
  type SankeyLayout,
} from './sankeyLayout';
