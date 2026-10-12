import { describe, it, expect } from 'vitest';
import { NeuralNetwork, FeedForwardLayer, ConvolutionalLayer, ImageLayer } from './index';

// ============================================================================
// Construction + layer accessors
// ============================================================================

describe('NeuralNetwork construction', () => {
  it('reports the right layer count', () => {
    const net = new NeuralNetwork([
      new FeedForwardLayer({ numNodes: 3 }),
      new FeedForwardLayer({ numNodes: 4 }),
      new FeedForwardLayer({ numNodes: 2 }),
    ]);
    expect(net.numLayers).toBe(3);
    expect(net.getLayers()).toHaveLength(3);
  });

  it('exposes layers by index', () => {
    const l0 = new FeedForwardLayer({ numNodes: 3 });
    const l1 = new FeedForwardLayer({ numNodes: 4 });
    const net = new NeuralNetwork([l0, l1]);
    expect(net.getLayer(0)).toBe(l0);
    expect(net.getLayer(1)).toBe(l1);
    expect(net.getLayer(5)).toBeUndefined();
  });
});

// ============================================================================
// Dense connections: edges = n_i x n_{i+1}
// ============================================================================

describe('NeuralNetwork connections', () => {
  it('fully connects each adjacent pair (edges = n_i x n_{i+1})', () => {
    const counts = [3, 4, 2];
    const net = new NeuralNetwork(counts.map((n) => new FeedForwardLayer({ numNodes: n })));
    const stages = net.getConnectionStages();
    expect(stages).toHaveLength(counts.length - 1);
    expect(stages[0]).toHaveLength(counts[0] * counts[1]); // 3 x 4 = 12
    expect(stages[1]).toHaveLength(counts[1] * counts[2]); // 4 x 2 = 8

    const totalExpected = counts[0] * counts[1] + counts[1] * counts[2];
    expect(net.getConnections()).toHaveLength(totalExpected); // 20
  });

  it('connects conv feature maps densely to the next layer', () => {
    const net = new NeuralNetwork([
      new ConvolutionalLayer({ numFeatureMaps: 3 }),
      new FeedForwardLayer({ numNodes: 5 }),
    ]);
    expect(net.getConnections()).toHaveLength(3 * 5);
  });

  it('connects an image layer as a single block (1 x M)', () => {
    const net = new NeuralNetwork([
      new ImageLayer({ rows: 4, cols: 4 }),
      new FeedForwardLayer({ numNodes: 6 }),
    ]);
    expect(net.getConnections()).toHaveLength(1 * 6);
  });

  it('draws no connections when connectAdjacent is false', () => {
    const net = new NeuralNetwork(
      [new FeedForwardLayer({ numNodes: 3 }), new FeedForwardLayer({ numNodes: 3 })],
      { connectAdjacent: false },
    );
    expect(net.getConnections()).toHaveLength(0);
  });
});

// ============================================================================
// Left-to-right layout
// ============================================================================

describe('NeuralNetwork layout', () => {
  it('arranges layers left-to-right with strictly increasing x', () => {
    const net = new NeuralNetwork([
      new FeedForwardLayer({ numNodes: 3 }),
      new FeedForwardLayer({ numNodes: 4 }),
      new FeedForwardLayer({ numNodes: 2 }),
    ]);
    const xs = net.getLayers().map((layer) => layer.getCenter()[0]);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    }
  });

  it('places node anchors of later layers further right', () => {
    const net = new NeuralNetwork([
      new FeedForwardLayer({ numNodes: 3 }),
      new FeedForwardLayer({ numNodes: 3 }),
    ]);
    const x0 = net.getLayer(0)!.nodeAnchors()[0][0];
    const x1 = net.getLayer(1)!.nodeAnchors()[0][0];
    expect(x1).toBeGreaterThan(x0);
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('NeuralNetwork edge cases', () => {
  it('an empty network does not throw and has no layers or connections', () => {
    let net: NeuralNetwork | undefined;
    expect(() => {
      net = new NeuralNetwork([]);
    }).not.toThrow();
    expect(net!.numLayers).toBe(0);
    expect(net!.getConnections()).toHaveLength(0);
    expect(net!.getConnectionStages()).toHaveLength(0);
  });

  it('a single-layer network has no connections and does not throw', () => {
    let net: NeuralNetwork | undefined;
    expect(() => {
      net = new NeuralNetwork([new FeedForwardLayer({ numNodes: 3 })]);
    }).not.toThrow();
    expect(net!.numLayers).toBe(1);
    expect(net!.getConnections()).toHaveLength(0);
  });

  it('a layer with zero nodes contributes no connections and does not throw', () => {
    let net: NeuralNetwork | undefined;
    expect(() => {
      net = new NeuralNetwork([
        new FeedForwardLayer({ numNodes: 3 }),
        new FeedForwardLayer({ numNodes: 0 }),
        new FeedForwardLayer({ numNodes: 2 }),
      ]);
    }).not.toThrow();
    const stages = net!.getConnectionStages();
    expect(stages[0]).toHaveLength(0); // 3 x 0
    expect(stages[1]).toHaveLength(0); // 0 x 2
    expect(net!.getConnections()).toHaveLength(0);
  });

  it('constructs with default options', () => {
    expect(() => new NeuralNetwork()).not.toThrow();
  });
});
