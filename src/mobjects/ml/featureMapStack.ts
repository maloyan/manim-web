/**
 * featureMapStack - shared builder for layers drawn as a diagonal stack of
 * square feature maps (ConvolutionalLayer and PoolingLayer).
 *
 * Each feature map is a square Rectangle. The squares are offset diagonally so
 * the stack reads as depth. Every square is a connection anchor, so a layer of
 * K feature maps connects to a layer of M nodes with K x M lines.
 */

import { Rectangle } from '../geometry/Rectangle';
import { VMobject } from '../../core/VMobject';
import { ResolvedNodeStyle } from './mlStyles';

export interface FeatureMapStackConfig {
  /** Number of stacked feature-map squares. Must be >= 0. */
  numFeatureMaps: number;
  /** Side length of each square feature map. */
  mapSize: number;
  /** Diagonal offset between adjacent squares in the stack. */
  offset: number;
  /** Resolved node style for the squares. */
  style: ResolvedNodeStyle;
}

export interface FeatureMapStackResult {
  /** The feature-map squares, front (first) to back (last). */
  nodes: VMobject[];
  /** Horizontal extent of the stack, always positive. */
  width: number;
}

/**
 * Build a diagonal stack of square feature maps centered on the local origin.
 * @param config - Count, size, offset and style of the stack.
 * @returns The square nodes and the stack's horizontal extent.
 */
export function buildFeatureMapStack(config: FeatureMapStackConfig): FeatureMapStackResult {
  const { numFeatureMaps, mapSize, offset, style } = config;
  const count = Math.max(0, Math.floor(numFeatureMaps));

  const span = count > 0 ? (count - 1) * offset : 0;
  const width = mapSize + span;

  const nodes: VMobject[] = [];
  for (let i = 0; i < count; i++) {
    // Center the diagonal span on the origin; the first square is front-left.
    const x = -span / 2 + i * offset;
    const y = span / 2 - i * offset;
    const square = new Rectangle({
      width: mapSize,
      height: mapSize,
      color: style.color,
      fillOpacity: style.fillOpacity,
      strokeWidth: style.strokeWidth,
      center: [x, y, 0],
    });
    square.setFillOpacity(style.fillOpacity);
    nodes.push(square);
  }

  return { nodes, width };
}
