/**
 * PoolingLayer - a pooling layer drawn as a diagonal stack of small square
 * feature maps (the manim-ml PoolingLayer analogue).
 *
 * It mirrors ConvolutionalLayer but uses smaller squares by default to read as
 * a downsampling step. Each square is a connection anchor.
 */

import { NeuralNetworkLayer } from './NeuralNetworkLayer';
import { buildFeatureMapStack } from './featureMapStack';
import {
  NodeStyleOptions,
  ResolvedNodeStyle,
  DEFAULT_NODE_STYLE,
  resolveNodeStyle,
} from './mlStyles';

export interface PoolingLayerOptions {
  /** Number of feature-map squares in the stack. Default: 3. Must be >= 0. */
  numFeatureMaps?: number;
  /** Side length of each square feature map. Default: 0.3. */
  mapSize?: number;
  /** Diagonal offset between adjacent squares. Default: 0.12. */
  offset?: number;
  /** Node style overrides for the squares. */
  nodeStyle?: NodeStyleOptions;
}

export class PoolingLayer extends NeuralNetworkLayer {
  private readonly _width: number;

  constructor(options: PoolingLayerOptions = {}) {
    super();

    const numFeatureMaps = options.numFeatureMaps ?? 3;
    const mapSize = options.mapSize ?? 0.3;
    const offset = options.offset ?? 0.12;
    const style: ResolvedNodeStyle = resolveNodeStyle(DEFAULT_NODE_STYLE, options.nodeStyle);

    const { nodes, width } = buildFeatureMapStack({ numFeatureMaps, mapSize, offset, style });
    this._width = width;
    for (const node of nodes) {
      this._nodes.push(node);
      this.add(node);
    }
  }

  /** Horizontal extent of the feature-map stack, used for spacing. */
  override layerWidth(): number {
    return this._width;
  }
}
