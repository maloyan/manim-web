import { describe, it, expect, afterEach } from 'vitest';
import { Vector3Tuple } from '../../core/Mobject';
import { VertexId, EdgeTuple } from './graphTypes';
import {
  computeLayout,
  springLayoutStep,
  randomSpringPositions,
  springForceConstant,
  DEFAULT_SPRING_COOLING,
  type SpringPoint,
} from './layoutAlgorithms';

// ============================================================================
// Deterministic RNG + a verbatim copy of the ORIGINAL spring algorithm.
// The reference lets us prove the refactor keeps computeSpringLayout
// byte-identical to the pre-refactor behavior.
// ============================================================================

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Verbatim copy of the original Fruchterman-Reingold implementation, with an
 * injectable RNG. It is the reference "known-good" output.
 */
function referenceSpringLayout(
  vertices: VertexId[],
  edges: EdgeTuple[],
  scale: number,
  center: Vector3Tuple,
  iterations: number,
  random: () => number,
): Map<VertexId, Vector3Tuple> {
  const positions = new Map<VertexId, Vector3Tuple>();
  const n = vertices.length;
  if (n === 0) return positions;

  const pos: Map<VertexId, { x: number; y: number }> = new Map();
  for (const v of vertices) {
    pos.set(v, {
      x: center[0] + (random() - 0.5) * scale * 2,
      y: center[1] + (random() - 0.5) * scale * 2,
    });
  }

  const area = scale * scale * 4;
  const k = Math.sqrt(area / n);
  let temperature = scale;

  for (let iter = 0; iter < iterations; iter++) {
    const disp: Map<VertexId, { x: number; y: number }> = new Map();
    for (const v of vertices) {
      disp.set(v, { x: 0, y: 0 });
    }

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const u = vertices[i];
        const v = vertices[j];
        const pu = pos.get(u)!;
        const pv = pos.get(v)!;
        const dx = pu.x - pv.x;
        const dy = pu.y - pv.y;
        const dist = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        disp.get(u)!.x += fx;
        disp.get(u)!.y += fy;
        disp.get(v)!.x -= fx;
        disp.get(v)!.y -= fy;
      }
    }

    for (const [u, v] of edges) {
      const pu = pos.get(u);
      const pv = pos.get(v);
      if (!pu || !pv) continue;
      const dx = pu.x - pv.x;
      const dy = pu.y - pv.y;
      const dist = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp.get(u)!.x -= fx;
      disp.get(u)!.y -= fy;
      disp.get(v)!.x += fx;
      disp.get(v)!.y += fy;
    }

    for (const v of vertices) {
      const d = disp.get(v)!;
      const p = pos.get(v)!;
      const dist = Math.sqrt(d.x * d.x + d.y * d.y);
      if (dist > 0) {
        const factor = Math.min(dist, temperature) / dist;
        p.x += d.x * factor;
        p.y += d.y * factor;
      }
    }

    temperature *= 0.95;
  }

  for (const v of vertices) {
    const p = pos.get(v)!;
    positions.set(v, [p.x, p.y, center[2]]);
  }
  return positions;
}

function distance(a: SpringPoint, b: SpringPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ============================================================================

describe('springLayoutStep', () => {
  it('default cooling constant matches the original algorithm', () => {
    expect(DEFAULT_SPRING_COOLING).toBe(0.95);
  });

  it('is pure: it does not mutate the input positions', () => {
    const vertices: VertexId[] = [0, 1];
    const edges: EdgeTuple[] = [[0, 1]];
    const input = new Map<VertexId, SpringPoint>([
      [0, { x: -3, y: 0 }],
      [1, { x: 3, y: 0 }],
    ]);
    const k = springForceConstant(2, 2);
    springLayoutStep(vertices, edges, input, { k, temperature: 2 });
    expect(input.get(0)).toEqual({ x: -3, y: 0 });
    expect(input.get(1)).toEqual({ x: 3, y: 0 });
  });

  it('cools the temperature by the cooling factor', () => {
    const vertices: VertexId[] = [0];
    const pos = new Map<VertexId, SpringPoint>([[0, { x: 0, y: 0 }]]);
    const result = springLayoutStep(vertices, [], pos, { k: 1, temperature: 2, cooling: 0.9 });
    expect(result.temperature).toBeCloseTo(1.8, 12);
  });

  it('moves two connected nodes that are far apart closer together', () => {
    const vertices: VertexId[] = [0, 1];
    const edges: EdgeTuple[] = [[0, 1]];
    const pos = new Map<VertexId, SpringPoint>([
      [0, { x: -5, y: 0 }],
      [1, { x: 5, y: 0 }],
    ]);
    const before = distance(pos.get(0)!, pos.get(1)!);
    const k = springForceConstant(2, 2);
    const result = springLayoutStep(vertices, edges, pos, { k, temperature: 2 });
    const after = distance(result.positions.get(0)!, result.positions.get(1)!);
    expect(after).toBeLessThan(before);
  });

  it('pushes two overlapping unconnected nodes apart', () => {
    const vertices: VertexId[] = [0, 1];
    const pos = new Map<VertexId, SpringPoint>([
      [0, { x: 0.1, y: 0 }],
      [1, { x: -0.1, y: 0 }],
    ]);
    const before = distance(pos.get(0)!, pos.get(1)!);
    const k = springForceConstant(2, 2);
    const result = springLayoutStep(vertices, [], pos, { k, temperature: 2 });
    const after = distance(result.positions.get(0)!, result.positions.get(1)!);
    expect(after).toBeGreaterThan(before);
  });

  it('is deterministic for fixed initial positions and params', () => {
    const vertices: VertexId[] = [0, 1, 2];
    const edges: EdgeTuple[] = [
      [0, 1],
      [1, 2],
    ];
    const init = randomSpringPositions(vertices, 2, [0, 0, 0], mulberry32(5));
    const k = springForceConstant(3, 2);
    const a = springLayoutStep(vertices, edges, init, { k, temperature: 2 });
    const b = springLayoutStep(vertices, edges, init, { k, temperature: 2 });
    for (const v of vertices) {
      expect(a.positions.get(v)).toEqual(b.positions.get(v));
    }
  });
});

describe('spring layout equivalence', () => {
  const vertices: VertexId[] = [0, 1, 2, 3, 4];
  const edges: EdgeTuple[] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 0],
    [0, 2],
  ];
  const scale = 2;
  const center: Vector3Tuple = [0, 0, 0];
  const iterations = 50;

  const originalRandom = Math.random;
  afterEach(() => {
    Math.random = originalRandom;
  });

  it('computeLayout spring output is byte-identical to the original algorithm', () => {
    const seed = 12345;
    Math.random = mulberry32(seed);
    const actual = computeLayout(vertices, edges, { type: 'spring', scale, center, iterations });

    const expected = referenceSpringLayout(
      vertices,
      edges,
      scale,
      center,
      iterations,
      mulberry32(seed),
    );

    for (const v of vertices) {
      expect(actual.get(v)).toEqual(expected.get(v));
    }
  });

  it('running springLayoutStep N times reproduces computeLayout spring', () => {
    const seed = 777;
    Math.random = mulberry32(seed);
    const actual = computeLayout(vertices, edges, { type: 'spring', scale, center, iterations });

    // Rebuild the final layout by running the single step `iterations` times
    // from the same seeded initial positions.
    let pos = randomSpringPositions(vertices, scale, center, mulberry32(seed));
    const k = springForceConstant(vertices.length, scale);
    let temperature = scale;
    for (let i = 0; i < iterations; i++) {
      const result = springLayoutStep(vertices, edges, pos, { k, temperature });
      pos = result.positions;
      temperature = result.temperature;
    }

    for (const v of vertices) {
      expect(actual.get(v)![0]).toBe(pos.get(v)!.x);
      expect(actual.get(v)![1]).toBe(pos.get(v)!.y);
      expect(actual.get(v)![2]).toBe(center[2]);
    }
  });
});
