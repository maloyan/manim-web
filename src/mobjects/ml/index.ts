/**
 * Neural-network / ML diagram toolkit for manim-web.
 *
 * A manim-ml analogue built purely by composition: layers are VGroups of
 * geometry, the network arranges them and draws connections, and forward /
 * backward passes animate a signal flowing through the connections.
 */

// Shared style options and defaults
export {
  type NodeStyleOptions,
  type ConnectionStyleOptions,
  type ResolvedNodeStyle,
  type ResolvedEdgeStyle,
  DEFAULT_NODE_STYLE,
  DEFAULT_EDGE_STYLE,
  DEFAULT_ACTIVATION_COLOR,
  resolveNodeStyle,
  resolveEdgeStyle,
} from './mlStyles';

// Layer base class
export { NeuralNetworkLayer } from './NeuralNetworkLayer';

// Layer mobjects
export { FeedForwardLayer, type FeedForwardLayerOptions } from './FeedForwardLayer';
export { ConvolutionalLayer, type ConvolutionalLayerOptions } from './ConvolutionalLayer';
export { PoolingLayer, type PoolingLayerOptions } from './PoolingLayer';
export { ImageLayer, type ImageLayerOptions } from './ImageLayer';

// Shared feature-map stack builder (used by conv and pooling layers)
export {
  buildFeatureMapStack,
  type FeatureMapStackConfig,
  type FeatureMapStackResult,
} from './featureMapStack';

// The network
export { NeuralNetwork, type NeuralNetworkOptions } from './NeuralNetwork';

// Animations
export { EdgePulse, edgePulse, type EdgePulseOptions } from './EdgePulse';
export { forwardPass, backwardPass, type ForwardPassOptions } from './forwardPass';
