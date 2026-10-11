// @vitest-environment happy-dom
/**
 * Tests for weighted-edge labels and self-loop edges (upstream ManimCE #3153).
 *
 * Covers the additive gaps on top of the existing Graph/DiGraph:
 *   - an edge weight or explicit label renders as a Text at the edge
 *   - a self-loop renders a non-degenerate loop arc near its vertex
 *   - a directed self-loop carries an arrow tip
 *   - edges without a weight/label render no label (no regression)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Graph, DiGraph } from './index';
import { Arc } from '../geometry/Arc';
import type { Vector3Tuple } from '../../core/Mobject';

/**
 * happy-dom does not implement a canvas 2d context, which Text needs to render
 * glyph geometry. Mock it so Text builds real geometry during these tests.
 */
function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textBaseline: 'top',
    textAlign: 'center',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((text: string) => ({
      width: text.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 3,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text.length * 10,
    })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
    if (contextId === '2d') return createMockCtx();
    return null;
  });
});

/** Build a two-vertex graph with the endpoints pinned on the x-axis. */
function twoVertexGraph(
  weightOrLabel: { weight?: number; label?: string },
  directed = false,
): Graph | DiGraph {
  const positions = new Map<string | number, Vector3Tuple>();
  positions.set('a', [-2, 0, 0]);
  positions.set('b', [2, 0, 0]);
  const options = {
    vertices: ['a', 'b'],
    edges: [['a', 'b']] as [string, string][],
    layout: { type: 'custom' as const, positions },
    edgeConfig: { 'a--b': weightOrLabel } as Record<string, typeof weightOrLabel>,
  };
  return directed
    ? new DiGraph({ ...options, edgeConfig: { 'a->b': weightOrLabel } })
    : new Graph(options);
}

/** Build a single-vertex graph with one self-loop edge. */
function selfLoopGraph(
  directed: boolean,
  cfg?: { weight?: number; label?: string },
): Graph | DiGraph {
  const positions = new Map<string | number, Vector3Tuple>();
  positions.set('a', [0, 0, 0]);
  const options = {
    vertices: ['a'],
    edges: [['a', 'a']] as [string, string][],
    layout: { type: 'custom' as const, positions },
    ...(cfg ? { edgeConfig: { 'a--a': cfg } as Record<string, typeof cfg> } : {}),
  };
  if (directed) {
    const dirOptions = cfg
      ? { ...options, edgeConfig: { 'a->a': cfg } as Record<string, typeof cfg> }
      : options;
    return new DiGraph(dirOptions);
  }
  return new Graph(options);
}

function dist(a: Vector3Tuple, b: Vector3Tuple): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

// ============================================================================
// Weighted-edge labels
// ============================================================================

describe('Weighted-edge labels', () => {
  it('renders a numeric weight as a label with the weight text', () => {
    const g = twoVertexGraph({ weight: 5 });
    const label = g.getEdgeLabelMobject('a', 'b');
    expect(label).toBeDefined();
    expect(label!.getText()).toBe('5');
  });

  it('positions the weight label near the edge midpoint', () => {
    const g = twoVertexGraph({ weight: 5 });
    const label = g.getEdgeLabelMobject('a', 'b')!;
    // Edge is horizontal and symmetric about the origin, so the midpoint is
    // [0, 0, 0]; the label is pushed perpendicular (up) by the default buff.
    expect(label.position.x).toBeCloseTo(0, 5);
    expect(label.position.y).toBeCloseTo(0.2, 5);
  });

  it('renders an explicit label and lets it win over a weight', () => {
    const g = twoVertexGraph({ weight: 5, label: 'w' });
    expect(g.getEdgeLabelMobject('a', 'b')!.getText()).toBe('w');
  });

  it('renders no label for an edge without a weight or label', () => {
    const g = twoVertexGraph({});
    expect(g.getEdgeLabelMobject('a', 'b')).toBeUndefined();
  });

  it('removes the label when the edge is removed', () => {
    const g = twoVertexGraph({ weight: 5 });
    g.removeEdge('a', 'b');
    expect(g.getEdgeLabelMobject('a', 'b')).toBeUndefined();
  });
});

// ============================================================================
// Self-loop edges
// ============================================================================

describe('Self-loop edges', () => {
  it('isSelfLoop detects a loop edge', () => {
    const g = selfLoopGraph(false);
    expect(g.isSelfLoop('a', 'a')).toBe(true);
  });

  it('renders a non-degenerate loop (positive bounding box)', () => {
    const g = selfLoopGraph(false);
    const loop = g.getEdgeMobject('a', 'a');
    expect(loop).toBeInstanceOf(Arc);
    const bbox = loop!.getBoundingBox();
    expect(bbox.width).toBeGreaterThan(0);
    expect(bbox.height).toBeGreaterThan(0);
  });

  it('places the loop near its vertex', () => {
    const g = selfLoopGraph(false);
    const loop = g.getEdgeMobject('a', 'a')!;
    expect(dist(loop.getCenter(), [0, 0, 0])).toBeLessThan(0.8);
  });

  it('an undirected self-loop has no tip', () => {
    const g = selfLoopGraph(false);
    const loop = g.getEdgeMobject('a', 'a') as Arc;
    expect(loop.hasTip()).toBe(false);
  });

  it('a directed self-loop has a tip', () => {
    const dg = selfLoopGraph(true);
    const loop = dg.getEdgeMobject('a', 'a') as Arc;
    expect(loop).toBeInstanceOf(Arc);
    expect(loop.hasTip()).toBe(true);
  });

  it('renders a weight label on a self-loop above the loop', () => {
    const g = selfLoopGraph(false, { weight: 7 });
    const label = g.getEdgeLabelMobject('a', 'a');
    expect(label).toBeDefined();
    expect(label!.getText()).toBe('7');
    // Label sits above the loop (vertexRadius 0.15 + loopRadius 0.3 twice + buff).
    expect(label!.position.y).toBeGreaterThan(0.45);
  });
});

// ============================================================================
// No regression on the default (unlabeled, non-loop) path
// ============================================================================

describe('Existing edge behavior is unchanged', () => {
  it('a plain edge still renders and carries no label', () => {
    const g = twoVertexGraph({});
    expect(g.getEdgeMobject('a', 'b')).toBeDefined();
    expect(g.getEdgeLabelMobject('a', 'b')).toBeUndefined();
  });

  it('directed plain edge still renders', () => {
    const dg = twoVertexGraph({}, true) as DiGraph;
    expect(dg.getEdgeMobject('a', 'b')).toBeDefined();
    expect(dg.hasEdge('a', 'b')).toBe(true);
    expect(dg.hasEdge('b', 'a')).toBe(false);
  });
});
