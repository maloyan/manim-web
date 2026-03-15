/**
 * GenericGraph - Base class for graph visualization
 *
 * Provides the foundation for both directed and undirected graphs.
 * Manages vertices and edges as Mobject children for animation support.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Dot } from '../geometry/Dot';
import { Line } from '../geometry/Line';
import { Arrow } from '../geometry/Arrow';
import { BLUE, WHITE, RED, DEFAULT_STROKE_WIDTH } from '../../constants';
import {
  VertexId,
  EdgeTuple,
  LayoutType,
  VertexStyleOptions,
  EdgeStyleOptions,
  VertexConfig,
  EdgeConfig,
  LayoutConfig,
  GenericGraphOptions,
} from './graphTypes';
import { computeLayout } from './layoutAlgorithms';

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

  // eslint-disable-next-line complexity
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
      this._vertexConfig,
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
    radius: number,
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
    const newEnd: Vector3Tuple = [end[0] - dx * factor, end[1] - dy * factor, end[2] - dz * factor];

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
