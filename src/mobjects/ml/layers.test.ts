import { describe, it, expect } from 'vitest';
import {
  FeedForwardLayer,
  ConvolutionalLayer,
  PoolingLayer,
  ImageLayer,
  NeuralNetworkLayer,
} from './index';

// ============================================================================
// FeedForwardLayer
// ============================================================================

describe('FeedForwardLayer', () => {
  it('builds N circular nodes stacked in a column', () => {
    const layer = new FeedForwardLayer({ numNodes: 4 });
    expect(layer.numNodes).toBe(4);
    expect(layer.getNodes()).toHaveLength(4);
  });

  it('arranges nodes top-to-bottom with decreasing y', () => {
    const layer = new FeedForwardLayer({ numNodes: 3, nodeSpacing: 0.7 });
    const ys = layer.nodeAnchors().map((p) => p[1]);
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeLessThan(ys[i - 1]);
    }
  });

  it('centers the column on y = 0', () => {
    const layer = new FeedForwardLayer({ numNodes: 5, nodeSpacing: 0.5 });
    const ys = layer.nodeAnchors().map((p) => p[1]);
    const sum = ys.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0, 6);
  });

  it('extends NeuralNetworkLayer', () => {
    expect(new FeedForwardLayer()).toBeInstanceOf(NeuralNetworkLayer);
  });

  it('defaults to 3 nodes', () => {
    expect(new FeedForwardLayer().numNodes).toBe(3);
  });

  it('handles zero nodes without throwing and exposes no anchors', () => {
    let layer: FeedForwardLayer | undefined;
    expect(() => {
      layer = new FeedForwardLayer({ numNodes: 0 });
    }).not.toThrow();
    expect(layer!.numNodes).toBe(0);
    expect(layer!.nodeAnchors()).toEqual([]);
    expect(layer!.layerWidth()).toBeGreaterThan(0);
  });

  it('clamps a negative node count to zero', () => {
    expect(new FeedForwardLayer({ numNodes: -2 }).numNodes).toBe(0);
  });
});

// ============================================================================
// ConvolutionalLayer / PoolingLayer (feature-map stacks)
// ============================================================================

describe('ConvolutionalLayer', () => {
  it('builds one node per feature map', () => {
    const layer = new ConvolutionalLayer({ numFeatureMaps: 4 });
    expect(layer.numNodes).toBe(4);
    expect(layer.getNodes()).toHaveLength(4);
  });

  it('has a positive layer width that grows with the stack', () => {
    const small = new ConvolutionalLayer({ numFeatureMaps: 1, mapSize: 0.5, offset: 0.15 });
    const big = new ConvolutionalLayer({ numFeatureMaps: 5, mapSize: 0.5, offset: 0.15 });
    expect(small.layerWidth()).toBeGreaterThan(0);
    expect(big.layerWidth()).toBeGreaterThan(small.layerWidth());
  });

  it('handles zero feature maps without throwing', () => {
    expect(() => new ConvolutionalLayer({ numFeatureMaps: 0 })).not.toThrow();
    expect(new ConvolutionalLayer({ numFeatureMaps: 0 }).numNodes).toBe(0);
  });
});

describe('PoolingLayer', () => {
  it('builds one node per feature map', () => {
    const layer = new PoolingLayer({ numFeatureMaps: 3 });
    expect(layer.numNodes).toBe(3);
  });

  it('extends NeuralNetworkLayer', () => {
    expect(new PoolingLayer()).toBeInstanceOf(NeuralNetworkLayer);
  });
});

// ============================================================================
// ImageLayer
// ============================================================================

describe('ImageLayer', () => {
  it('exposes a single connection anchor for a non-empty grid', () => {
    const layer = new ImageLayer({ rows: 4, cols: 4 });
    expect(layer.numNodes).toBe(1);
    expect(layer.nodeAnchors()).toHaveLength(1);
  });

  it('centers its single anchor near the origin', () => {
    const layer = new ImageLayer({ rows: 3, cols: 3, cellSize: 0.25 });
    const [x, y] = layer.nodeAnchors()[0];
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(0, 6);
  });

  it('exposes no anchor for an empty grid and does not throw', () => {
    expect(() => new ImageLayer({ rows: 0, cols: 0 })).not.toThrow();
    expect(new ImageLayer({ rows: 0, cols: 5 }).numNodes).toBe(0);
  });

  it('has a positive layer width', () => {
    expect(new ImageLayer({ rows: 2, cols: 2 }).layerWidth()).toBeGreaterThan(0);
  });
});
