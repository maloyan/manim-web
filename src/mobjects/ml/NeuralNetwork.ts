/**
 * NeuralNetwork - a diagram of stacked layers with connection lines between
 * adjacent layers (a manim-ml NeuralNetwork analogue).
 *
 * The network is a VGroup built from a list of layers. It places the layers
 * left to right and, for every adjacent pair, draws a dense set of connection
 * lines between their node anchors (n_i x n_{i+1} lines). Connections are added
 * before the layers so they render behind the nodes.
 */

import * as THREE from 'three';
import { VGroup } from '../../core/VGroup';
import { Line } from '../geometry/Line';
import { NeuralNetworkLayer } from './NeuralNetworkLayer';
import {
  ConnectionStyleOptions,
  ResolvedEdgeStyle,
  DEFAULT_EDGE_STYLE,
  resolveEdgeStyle,
} from './mlStyles';

export interface NeuralNetworkOptions {
  /** Horizontal gap between adjacent layers. Default: 1. */
  layerSpacing?: number;
  /** Connection line style overrides. */
  edgeStyle?: ConnectionStyleOptions;
  /** When false, no connection lines are drawn. Default: true. */
  connectAdjacent?: boolean;
}

export class NeuralNetwork extends VGroup {
  private readonly _layers: NeuralNetworkLayer[];
  private readonly _connections: Line[] = [];
  /** Connection lines grouped by the gap they cross (stage i joins layer i and i+1). */
  private readonly _stages: Line[][] = [];
  private readonly _edgeStyle: ResolvedEdgeStyle;

  /**
   * @param layers - The layers, drawn left to right in array order.
   * @param options - Spacing, edge style and whether to connect layers.
   */
  constructor(layers: NeuralNetworkLayer[] = [], options: NeuralNetworkOptions = {}) {
    super();

    this._layers = [...layers];
    this._edgeStyle = resolveEdgeStyle(DEFAULT_EDGE_STYLE, options.edgeStyle);
    const layerSpacing = options.layerSpacing ?? 1;
    const connectAdjacent = options.connectAdjacent ?? true;

    this._placeLayers(layerSpacing);
    if (connectAdjacent) {
      this._buildConnections();
    }

    // Connections first so they render behind the layers.
    for (const line of this._connections) this.add(line);
    for (const layer of this._layers) this.add(layer);
  }

  /**
   * A container flattens its transform into its children (layers and lines)
   * rather than baking its own geometry, matching GenericGraph.
   */
  override normalizeTransform(worldMatrix: THREE.Matrix4 = this._ownMatrix()): this {
    return this._flattenAsContainer(worldMatrix);
  }

  /**
   * Place each layer so its center sits on a strictly increasing x, spaced by
   * the layers' own widths plus `layerSpacing`. Uses shift (not moveTo) so an
   * empty layer is positioned without measuring absent geometry.
   * @param layerSpacing - Horizontal gap between adjacent layer edges.
   */
  private _placeLayers(layerSpacing: number): void {
    const halfWidths = this._layers.map((layer) => layer.layerWidth() / 2);
    let x = 0;
    for (let i = 0; i < this._layers.length; i++) {
      if (i > 0) {
        x += halfWidths[i - 1] + layerSpacing + halfWidths[i];
      }
      // Layers are built centered on their local origin, so shifting by x puts
      // the layer center at world x.
      this._layers[i].shift([x, 0, 0]);
    }
  }

  /**
   * Build dense connection lines between every adjacent pair of layers.
   * A pair contributes n_i x n_{i+1} lines; a 0-node layer contributes none.
   */
  private _buildConnections(): void {
    for (let i = 0; i < this._layers.length - 1; i++) {
      const sources = this._layers[i].nodeAnchors();
      const targets = this._layers[i + 1].nodeAnchors();
      const stage: Line[] = [];
      for (const start of sources) {
        for (const end of targets) {
          const line = new Line({
            start,
            end,
            color: this._edgeStyle.color,
            strokeWidth: this._edgeStyle.strokeWidth,
          });
          line.setStrokeOpacity(this._edgeStyle.opacity);
          stage.push(line);
          this._connections.push(line);
        }
      }
      this._stages.push(stage);
    }
  }

  /** Get the layers in left-to-right order. */
  getLayers(): NeuralNetworkLayer[] {
    return [...this._layers];
  }

  /**
   * Get a single layer by index.
   * @param index - Zero-based layer index.
   * @returns The layer, or undefined when the index is out of range.
   */
  getLayer(index: number): NeuralNetworkLayer | undefined {
    return this._layers[index];
  }

  /** Get the number of layers. */
  get numLayers(): number {
    return this._layers.length;
  }

  /** Get every connection line, flattened across all gaps. */
  getConnections(): Line[] {
    return [...this._connections];
  }

  /**
   * Get the connection lines grouped by gap. Entry i holds the lines that join
   * layer i and layer i+1.
   */
  getConnectionStages(): Line[][] {
    return this._stages.map((stage) => [...stage]);
  }
}
