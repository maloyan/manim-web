/**
 * ConvolutionalLayer - a conv layer drawn as a diagonal stack of square
 * feature maps (the manim-ml ConvolutionalLayer analogue).
 *
 * Each feature-map square is a connection anchor, so a conv layer of K maps
 * connects densely to a following layer of M nodes with K x M lines.
 */

import { NeuralNetworkLayer } from './NeuralNetworkLayer';
import { buildFeatureMapStack } from './featureMapStack';
import {
  NodeStyleOptions,
  ResolvedNodeStyle,
  DEFAULT_NODE_STYLE,
  resolveNodeStyle,
} from './mlStyles';

export interface ConvolutionalLayerOptions {
  /** Number of feature-map squares in the stack. Default: 3. Must be >= 0. */
  numFeatureMaps?: number;
  /** Side length of each square feature map. Default: 0.5. */
  mapSize?: number;
  /** Diagonal offset between adjacent squares. Default: 0.15. */
  offset?: number;
  /** Node style overrides for the squares. */
  nodeStyle?: NodeStyleOptions;
}

export class ConvolutionalLayer extends NeuralNetworkLayer {
  private readonly _width: number;

  constructor(options: ConvolutionalLayerOptions = {}) {
    super();

    const numFeatureMaps = options.numFeatureMaps ?? 3;
    const mapSize = options.mapSize ?? 0.5;
    const offset = options.offset ?? 0.15;
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
