/**
 * Types and interfaces for graph mobjects
 */

import { Vector3Tuple } from '../../core/Mobject';

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
  /** Radius of a self-loop arc (edge from a vertex to itself). Default: 0.3 */
  selfLoopRadius?: number;
  /** Font size for a weight or label rendered on the edge. Default: 24 */
  labelFontSize?: number;
  /** Color for a weight or label rendered on the edge. Default: edge color */
  labelColor?: string;
  /** Gap between a straight edge and its label. Default: 0.2 */
  labelBuff?: number;
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

/**
 * Options for creating a directed graph
 */
export type DiGraphOptions = GenericGraphOptions;
