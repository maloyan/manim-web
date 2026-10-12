/**
 * FeedForwardLayer - a dense layer drawn as a vertical column of circular nodes.
 *
 * This is the manim-ml FeedForwardLayer analogue: N circles stacked top to
 * bottom and centered on the layer's local origin. The circles are the
 * connection anchors, so a dense connection to a layer of M nodes draws N x M
 * lines.
 */

import { Circle } from '../geometry/Circle';
import { NeuralNetworkLayer } from './NeuralNetworkLayer';
import {
  NodeStyleOptions,
  ResolvedNodeStyle,
  DEFAULT_NODE_STYLE,
  resolveNodeStyle,
} from './mlStyles';

export interface FeedForwardLayerOptions {
  /** Number of nodes (circles) in the column. Default: 3. Must be >= 0. */
  numNodes?: number;
  /** Radius of each node circle. Default: 0.25. */
  nodeRadius?: number;
  /** Vertical gap between the centers of adjacent nodes. Default: 0.7. */
  nodeSpacing?: number;
  /** Node style overrides. */
  nodeStyle?: NodeStyleOptions;
}

export class FeedForwardLayer extends NeuralNetworkLayer {
  private readonly _nodeRadius: number;
  private readonly _nodeSpacing: number;
  private readonly _nodeStyle: ResolvedNodeStyle;

  constructor(options: FeedForwardLayerOptions = {}) {
    super();

    const requested = options.numNodes ?? 3;
    const numNodes = Math.max(0, Math.floor(requested));
    this._nodeRadius = options.nodeRadius ?? 0.25;
    this._nodeSpacing = options.nodeSpacing ?? 0.7;
    this._nodeStyle = resolveNodeStyle(DEFAULT_NODE_STYLE, options.nodeStyle);

    this._buildNodes(numNodes);
  }

  /**
   * Build `count` circles in a vertical column centered on the local origin.
   * @param count - Number of circles to create (0 leaves the layer empty).
   */
  private _buildNodes(count: number): void {
    if (count === 0) return;

    // Center the column on y = 0: the top node sits at +totalHeight/2.
    const totalHeight = (count - 1) * this._nodeSpacing;
    for (let i = 0; i < count; i++) {
      const y = totalHeight / 2 - i * this._nodeSpacing;
      const circle = new Circle({
        radius: this._nodeRadius,
        color: this._nodeStyle.color,
        fillOpacity: this._nodeStyle.fillOpacity,
        strokeWidth: this._nodeStyle.strokeWidth,
        center: [0, y, 0],
      });
      circle.setFillOpacity(this._nodeStyle.fillOpacity);
      this._nodes.push(circle);
      this.add(circle);
    }
  }

  /** Get the radius of each node circle. */
  getNodeRadius(): number {
    return this._nodeRadius;
  }

  /**
   * Horizontal extent of the column (one circle wide), used for spacing.
   * Stays positive even with zero nodes so the network can place an empty layer.
   */
  override layerWidth(): number {
    return 2 * this._nodeRadius;
  }
}
