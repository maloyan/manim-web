import { describe, it, expect } from 'vitest';
import { SankeyDiagram, SankeyLink, SankeyNode } from './SankeyDiagram';
import { computeSankeyLayout } from './sankeyLayout';

const LAYOUT_OPTIONS = {
  nodeWidth: 0.3,
  nodePadding: 0.4,
  layerSpacing: 3,
  height: 4,
  minNodeLength: 0.05,
};

describe('SankeyDiagram', () => {
  it('creates one node mobject per input node and one link per input link', () => {
    const sankey = new SankeyDiagram({
      nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      links: [
        { source: 'a', target: 'b', value: 2 },
        { source: 'a', target: 'c', value: 1 },
      ],
      showLabels: false,
    });

    expect(sankey.getNodes()).toHaveLength(3);
    expect(sankey.getLinks()).toHaveLength(2);
    expect(sankey.getNodes()[0]).toBeInstanceOf(SankeyNode);
    expect(sankey.getLinks()[0]).toBeInstanceOf(SankeyLink);
  });

  it('exposes node and link accessors by id and index', () => {
    const sankey = new SankeyDiagram({
      nodes: [{ id: 'a' }, { id: 'b' }],
      links: [{ source: 'a', target: 'b', value: 1 }],
      showLabels: false,
    });

    expect(sankey.getNode('a')?.id).toBe('a');
    expect(sankey.getNode('missing')).toBeUndefined();
    expect(sankey.getLink(0)?.source).toBe('a');
    expect(sankey.getLink(0)?.target).toBe('b');
    expect(sankey.getLink(5)).toBeUndefined();
  });

  it('makes a link ribbon width proportional to its value', () => {
    const sankey = new SankeyDiagram({
      nodes: [{ id: 'src' }, { id: 'small' }, { id: 'big' }],
      links: [
        { source: 'src', target: 'small', value: 1 },
        { source: 'src', target: 'big', value: 2 },
      ],
      showLabels: false,
    });

    const small = sankey.getLink(0)!.getLinkWidth();
    const big = sankey.getLink(1)!.getLinkWidth();
    expect(small).toBeGreaterThan(0);
    expect(big / small).toBeCloseTo(2, 5);
  });

  it('positions nodes in later layers to the right of their sources', () => {
    const sankey = new SankeyDiagram({
      nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      links: [
        { source: 'a', target: 'b', value: 1 },
        { source: 'b', target: 'c', value: 1 },
      ],
      showLabels: false,
    });

    const ax = sankey.getNode('a')!.getCenter()[0];
    const bx = sankey.getNode('b')!.getCenter()[0];
    const cx = sankey.getNode('c')!.getCenter()[0];
    expect(bx).toBeGreaterThan(ax);
    expect(cx).toBeGreaterThan(bx);
  });

  it('stacks two links into one node without overlap', () => {
    const sankey = new SankeyDiagram({
      nodes: [{ id: 'a' }, { id: 'b' }, { id: 'sink' }],
      links: [
        { source: 'a', target: 'sink', value: 1 },
        { source: 'b', target: 'sink', value: 1 },
      ],
      showLabels: false,
    });

    const first = sankey.getLink(0)!.getTargetSpan();
    const second = sankey.getLink(1)!.getTargetSpan();
    // Each span is top > bottom, and the first sits entirely above the second.
    expect(first.top).toBeGreaterThan(first.bottom);
    expect(second.top).toBeGreaterThan(second.bottom);
    expect(first.bottom).toBeGreaterThanOrEqual(second.top - 1e-9);
  });

  it('sizes a node by max(incoming, outgoing) when the two differ', () => {
    const sankey = new SankeyDiagram({
      nodes: [{ id: 'in1' }, { id: 'in2' }, { id: 'hub' }, { id: 'out' }],
      links: [
        { source: 'in1', target: 'hub', value: 3 },
        { source: 'in2', target: 'hub', value: 2 },
        { source: 'hub', target: 'out', value: 1 },
      ],
      showLabels: false,
    });

    // Incoming total 5 > outgoing total 1, so throughput is 5.
    expect(sankey.getNode('hub')!.throughput).toBe(5);
  });

  it('renders node labels by default and omits them when disabled', () => {
    const withLabels = new SankeyDiagram({
      nodes: [{ id: 'a' }, { id: 'b' }],
      links: [{ source: 'a', target: 'b', value: 1 }],
    });
    const withoutLabels = new SankeyDiagram({
      nodes: [{ id: 'a' }, { id: 'b' }],
      links: [{ source: 'a', target: 'b', value: 1 }],
      showLabels: false,
    });
    // 2 nodes + 1 link + 2 labels vs 2 nodes + 1 link.
    expect(withLabels.children.length).toBe(5);
    expect(withoutLabels.children.length).toBe(3);
  });

  it('supports a vertical orientation without throwing', () => {
    const sankey = new SankeyDiagram({
      nodes: [{ id: 'a' }, { id: 'b' }],
      links: [{ source: 'a', target: 'b', value: 1 }],
      orientation: 'vertical',
      showLabels: false,
    });
    // Flow runs downward: the target sits below the source.
    const ay = sankey.getNode('a')!.getCenter()[1];
    const by = sankey.getNode('b')!.getCenter()[1];
    expect(ay).toBeGreaterThan(by);
  });

  describe('edge cases', () => {
    it('handles an empty diagram as an empty group without throwing', () => {
      const sankey = new SankeyDiagram({ nodes: [], links: [] });
      expect(sankey.getNodes()).toHaveLength(0);
      expect(sankey.getLinks()).toHaveLength(0);
      expect(sankey.isEmpty()).toBe(true);
    });

    it('handles a single link', () => {
      const sankey = new SankeyDiagram({
        nodes: [{ id: 'a' }, { id: 'b' }],
        links: [{ source: 'a', target: 'b', value: 1 }],
        showLabels: false,
      });
      expect(sankey.getLinks()).toHaveLength(1);
      expect(sankey.getNodes()).toHaveLength(2);
    });

    it('handles a node with no links without throwing', () => {
      const sankey = new SankeyDiagram({
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'lonely' }],
        links: [{ source: 'a', target: 'b', value: 1 }],
        showLabels: false,
      });
      expect(sankey.getNode('lonely')).toBeDefined();
      expect(sankey.getNode('lonely')!.throughput).toBe(0);
      expect(sankey.getNodes()).toHaveLength(3);
    });

    it('ignores links that reference unknown nodes gracefully', () => {
      const sankey = new SankeyDiagram({
        nodes: [{ id: 'a' }],
        links: [{ source: 'a', target: 'ghost', value: 1 }],
        showLabels: false,
      });
      // The link mobject still exists (count matches input) but has a
      // degenerate span because its target node is missing.
      expect(sankey.getLinks()).toHaveLength(1);
      const span = sankey.getLink(0)!.getTargetSpan();
      expect(span.top).toBe(0);
      expect(span.bottom).toBe(0);
    });
  });
});

describe('computeSankeyLayout', () => {
  it('returns empty arrays for empty input', () => {
    const layout = computeSankeyLayout([], [], LAYOUT_OPTIONS);
    expect(layout.nodes).toHaveLength(0);
    expect(layout.links).toHaveLength(0);
  });

  it('respects explicit layer indices', () => {
    const layout = computeSankeyLayout(
      [
        { id: 'a', layer: 0 },
        { id: 'b', layer: 2 },
      ],
      [{ source: 'a', target: 'b', value: 1 }],
      LAYOUT_OPTIONS,
    );
    const a = layout.nodes.find((n) => n.id === 'a')!;
    const b = layout.nodes.find((n) => n.id === 'b')!;
    expect(a.layer).toBe(0);
    expect(b.layer).toBe(2);
    expect(b.x).toBeGreaterThan(a.x);
  });

  it('terminates on a cyclic graph', () => {
    const layout = computeSankeyLayout(
      [{ id: 'a' }, { id: 'b' }],
      [
        { source: 'a', target: 'b', value: 1 },
        { source: 'b', target: 'a', value: 1 },
      ],
      LAYOUT_OPTIONS,
    );
    expect(layout.nodes).toHaveLength(2);
    expect(layout.links).toHaveLength(2);
  });
});
