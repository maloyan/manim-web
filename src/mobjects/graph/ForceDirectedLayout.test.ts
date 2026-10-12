import { describe, it, expect } from 'vitest';
import { Vector3Tuple } from '../../core/Mobject';
import { VertexId, EdgeTuple } from './graphTypes';
import { Graph } from './Graph';
import { ForceDirectedLayout, forceDirectedLayout } from './ForceDirectedLayout';
import { springLayoutStep, springForceConstant, type SpringPoint } from './layoutAlgorithms';

const EDGES: EdgeTuple[] = [[0, 1]];

function makeGraph(): Graph {
  return new Graph({ vertices: [0, 1], edges: EDGES });
}

function vertexDistance(graph: Graph, a: VertexId, b: VertexId): number {
  const pa = graph.getVertexPosition(a)!;
  const pb = graph.getVertexPosition(b)!;
  return Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
}

/** Run the bare simulation to the settled layout from the given start. */
function settle(
  vertices: VertexId[],
  edges: EdgeTuple[],
  init: Map<VertexId, SpringPoint>,
  scale: number,
  iterations: number,
): Map<VertexId, SpringPoint> {
  let pos = init;
  const k = springForceConstant(vertices.length, scale);
  let temperature = scale;
  for (let i = 0; i < iterations; i++) {
    const result = springLayoutStep(vertices, edges, pos, { k, temperature });
    pos = result.positions;
    temperature = result.temperature;
  }
  return pos;
}

describe('ForceDirectedLayout', () => {
  const initialPositions = new Map<VertexId, Vector3Tuple>([
    [0, [-6, 0, 0]],
    [1, [6, 0, 0]],
  ]);
  const scale = 3;
  const iterations = 60;

  it('places vertices at the initial layout at alpha 0', () => {
    const graph = makeGraph();
    const anim = new ForceDirectedLayout(graph, { scale, iterations, initialPositions });
    anim.begin();
    anim.interpolate(0);
    expect(graph.getVertexPosition(0)![0]).toBeCloseTo(-6, 10);
    expect(graph.getVertexPosition(1)![0]).toBeCloseTo(6, 10);
  });

  it('moves vertices to the settled layout at alpha 1', () => {
    const graph = makeGraph();
    const anim = new ForceDirectedLayout(graph, { scale, iterations, initialPositions });
    anim.begin();
    anim.interpolate(1);

    const expected = settle(
      [0, 1],
      EDGES,
      new Map<VertexId, SpringPoint>([
        [0, { x: -6, y: 0 }],
        [1, { x: 6, y: 0 }],
      ]),
      scale,
      iterations,
    );
    expect(graph.getVertexPosition(0)![0]).toBeCloseTo(expected.get(0)!.x, 10);
    expect(graph.getVertexPosition(0)![1]).toBeCloseTo(expected.get(0)!.y, 10);
    expect(graph.getVertexPosition(1)![0]).toBeCloseTo(expected.get(1)!.x, 10);
    expect(graph.getVertexPosition(1)![1]).toBeCloseTo(expected.get(1)!.y, 10);
  });

  it('getSettledPositions equals the final interpolated layout', () => {
    const graph = makeGraph();
    const anim = new ForceDirectedLayout(graph, { scale, iterations, initialPositions });
    anim.begin();
    anim.interpolate(1);
    const settled = anim.getSettledPositions();
    expect(graph.getVertexPosition(0)![0]).toBeCloseTo(settled.get(0)![0], 10);
    expect(graph.getVertexPosition(0)![1]).toBeCloseTo(settled.get(0)![1], 10);
  });

  it('advances monotonically forward through the simulation snapshots', () => {
    const graph = makeGraph();
    const anim = new ForceDirectedLayout(graph, { scale, iterations, initialPositions });
    anim.begin();

    // Independent forward simulation: one snapshot per step.
    const snapshots: Map<VertexId, SpringPoint>[] = [];
    let pos = new Map<VertexId, SpringPoint>([
      [0, { x: -6, y: 0 }],
      [1, { x: 6, y: 0 }],
    ]);
    snapshots.push(pos);
    const k = springForceConstant(2, scale);
    let temperature = scale;
    for (let i = 0; i < iterations; i++) {
      const result = springLayoutStep([0, 1], EDGES, pos, { k, temperature });
      pos = result.positions;
      temperature = result.temperature;
      snapshots.push(pos);
    }

    // Increasing alpha lands on strictly later snapshots (monotone progress):
    // interpolate(i / iterations) reproduces the i-th forward snapshot.
    for (let i = 0; i <= iterations; i++) {
      anim.interpolate(i / iterations);
      expect(graph.getVertexPosition(0)![0]).toBeCloseTo(snapshots[i].get(0)!.x, 9);
      expect(graph.getVertexPosition(0)![1]).toBeCloseTo(snapshots[i].get(0)!.y, 9);
      expect(graph.getVertexPosition(1)![0]).toBeCloseTo(snapshots[i].get(1)!.x, 9);
      expect(graph.getVertexPosition(1)![1]).toBeCloseTo(snapshots[i].get(1)!.y, 9);
    }

    // The settled layout differs from the initial one (the graph actually moved).
    anim.interpolate(1);
    expect(vertexDistance(graph, 0, 1)).not.toBeCloseTo(12, 3);
  });

  it('is deterministic for a fixed seed', () => {
    const g1 = new Graph({
      vertices: [0, 1, 2, 3],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ],
    });
    const g2 = new Graph({
      vertices: [0, 1, 2, 3],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ],
    });
    const a1 = new ForceDirectedLayout(g1, { seed: 42, iterations: 40, scale: 2 });
    const a2 = new ForceDirectedLayout(g2, { seed: 42, iterations: 40, scale: 2 });
    a1.begin();
    a2.begin();
    const s1 = a1.getSettledPositions();
    const s2 = a2.getSettledPositions();
    for (const v of [0, 1, 2, 3]) {
      expect(s1.get(v)).toEqual(s2.get(v));
    }
  });

  it('graph.animateSpringLayout builds a ForceDirectedLayout using the graph layout', () => {
    const graph = new Graph({
      vertices: [0, 1],
      edges: EDGES,
      layout: { type: 'spring', scale: 3, center: [1, 1, 0], iterations: 20 },
    });
    const anim = graph.animateSpringLayout({ initialPositions });
    expect(anim).toBeInstanceOf(ForceDirectedLayout);
    anim.begin();
    anim.interpolate(1);
    // The animation settles the vertices (they moved from the far-apart start).
    expect(vertexDistance(graph, 0, 1)).toBeLessThan(12);
  });

  it('factory function returns a ForceDirectedLayout', () => {
    const graph = makeGraph();
    const anim = forceDirectedLayout(graph, { iterations: 10 });
    expect(anim).toBeInstanceOf(ForceDirectedLayout);
  });

  it('handles an empty graph without throwing', () => {
    const graph = new Graph();
    const anim = new ForceDirectedLayout(graph, { iterations: 10 });
    anim.begin();
    expect(() => anim.interpolate(0.5)).not.toThrow();
  });
});
