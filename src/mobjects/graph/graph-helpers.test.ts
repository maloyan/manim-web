import { describe, it, expect } from 'vitest';
import {
  Graph,
  DiGraph,
  GenericGraph,
  completeGraph,
  cycleGraph,
  pathGraph,
  starGraph,
  binaryTree,
  gridGraph,
  bipartiteGraph,
} from './index';

describe('Layout algorithms', () => {
  it('circular layout places vertices on a circle', () => {
    const g = new Graph({
      vertices: [0, 1, 2, 3],
      layout: { type: 'circular', scale: 2, center: [0, 0, 0] },
    });
    const positions = g.getPositions();
    expect(positions.size).toBe(4);
    for (const [, pos] of positions) {
      const dist = Math.sqrt(pos[0] ** 2 + pos[1] ** 2);
      expect(dist).toBeCloseTo(2, 1);
    }
  });

  it('circular layout with custom center offsets positions', () => {
    const g = new Graph({
      vertices: [0, 1],
      layout: { type: 'circular', scale: 1, center: [5, 5, 0] },
    });
    for (const [, pos] of g.getPositions()) {
      const dist = Math.sqrt((pos[0] - 5) ** 2 + (pos[1] - 5) ** 2);
      expect(dist).toBeCloseTo(1, 1);
    }
  });

  it('grid layout places vertices in a grid pattern', () => {
    const g = new Graph({
      vertices: [0, 1, 2, 3],
      layout: { type: 'grid', scale: 2, center: [0, 0, 0] },
    });
    const pts = Array.from(g.getPositions().values());
    const xs = new Set(pts.map((p) => Math.round(p[0] * 100)));
    const ys = new Set(pts.map((p) => Math.round(p[1] * 100)));
    expect(xs.size).toBe(2);
    expect(ys.size).toBe(2);
  });

  it('custom layout uses provided positions', () => {
    const positions = new Map<string | number, [number, number, number]>();
    positions.set('a', [1, 2, 0]);
    positions.set('b', [3, 4, 0]);
    const g = new Graph({ vertices: ['a', 'b'], layout: { type: 'custom', positions } });
    expect(g.getVertexPosition('a')).toEqual([1, 2, 0]);
    expect(g.getVertexPosition('b')).toEqual([3, 4, 0]);
  });

  it('tree layout assigns positions hierarchically', () => {
    const g = new Graph({
      vertices: ['root', 'L', 'R'],
      edges: [
        ['root', 'L'],
        ['root', 'R'],
      ],
      layout: { type: 'tree', root: 'root', scale: 2, center: [0, 0, 0] },
    });
    const positions = g.getPositions();
    expect(positions.get('root')![1]).toBeGreaterThan(positions.get('L')![1]);
    expect(positions.get('root')![1]).toBeGreaterThan(positions.get('R')![1]);
    expect(positions.get('L')![1]).toBeCloseTo(positions.get('R')![1], 5);
  });

  it('tree layout defaults to first vertex as root', () => {
    const g = new Graph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [1, 3],
      ],
      layout: { type: 'tree', scale: 2 },
    });
    expect(g.getPositions().get(1)![1]).toBeGreaterThan(g.getPositions().get(2)![1]);
  });

  it('tree layout handles disconnected vertices', () => {
    const g = new Graph({
      vertices: [1, 2, 3, 99],
      edges: [
        [1, 2],
        [1, 3],
      ],
      layout: { type: 'tree', root: 1, scale: 2 },
    });
    expect(g.getPositions().size).toBe(4);
    expect(g.getPositions().get(99)).toBeDefined();
  });

  it('bipartite layout splits vertices into two columns', () => {
    const left = ['L0', 'L1'];
    const right = ['R0', 'R1'];
    const g = new Graph({
      vertices: [...left, ...right],
      edges: [
        ['L0', 'R0'],
        ['L1', 'R1'],
      ],
      layout: { type: 'bipartite', partition: [left, right], scale: 2, center: [0, 0, 0] },
    });
    const positions = g.getPositions();
    for (const v of left) expect(positions.get(v)![0]).toBeCloseTo(-2, 5);
    for (const v of right) expect(positions.get(v)![0]).toBeCloseTo(2, 5);
  });

  it('bipartite layout defaults to half-half split', () => {
    const g = new Graph({ vertices: [1, 2, 3, 4], layout: { type: 'bipartite', scale: 2 } });
    const positions = g.getPositions();
    expect(positions.get(1)![0]).toBeCloseTo(-2, 5);
    expect(positions.get(2)![0]).toBeCloseTo(-2, 5);
    expect(positions.get(3)![0]).toBeCloseTo(2, 5);
    expect(positions.get(4)![0]).toBeCloseTo(2, 5);
  });

  it('shell layout places all vertices with 3-tuples', () => {
    const g = new Graph({
      vertices: [0, 1, 2, 3, 4, 5, 6, 7],
      layout: { type: 'shell', scale: 2, center: [0, 0, 0] },
    });
    expect(g.getPositions().size).toBe(8);
    for (const [, pos] of g.getPositions()) expect(pos).toHaveLength(3);
  });

  it('kamada_kawai layout places all vertices', () => {
    const g = new Graph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [2, 3],
      ],
      layout: { type: 'kamada_kawai', scale: 2, center: [0, 0, 0] },
    });
    expect(g.getPositions().size).toBe(3);
  });

  it('kamada_kawai with single vertex places at center', () => {
    const g = new Graph({
      vertices: [1],
      layout: { type: 'kamada_kawai', scale: 2, center: [3, 4, 0] },
    });
    const pos = g.getVertexPosition(1)!;
    expect(pos[0]).toBeCloseTo(3, 5);
    expect(pos[1]).toBeCloseTo(4, 5);
  });

  it('random layout produces positions for all vertices', () => {
    const g = new Graph({
      vertices: [1, 2, 3, 4, 5],
      layout: { type: 'random', scale: 3, center: [0, 0, 0] },
    });
    expect(g.getPositions().size).toBe(5);
  });

  it('spring layout produces positions for all vertices', () => {
    const g = new Graph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [2, 3],
      ],
      layout: { type: 'spring', scale: 2, iterations: 5 },
    });
    expect(g.getPositions().size).toBe(3);
  });

  it('layout string shorthand sets type', () => {
    expect(new Graph({ vertices: [1, 2, 3], layout: 'circular' }).getPositions().size).toBe(3);
  });

  it('setLayout changes the layout', () => {
    const g = new Graph({
      vertices: [1, 2, 3, 4],
      edges: [
        [1, 2],
        [2, 3],
        [3, 4],
      ],
      layout: 'circular',
    });
    g.setLayout('grid');
    expect(g.getPositions().size).toBe(4);
  });

  it('setLayout with config object', () => {
    const g = new Graph({ vertices: [1, 2], layout: 'circular' });
    g.setLayout({ type: 'grid', scale: 5 });
    expect(g.getPositions().size).toBe(2);
  });

  it('setLayout returns this for chaining', () => {
    expect(new Graph({ vertices: [1] }).setLayout('circular')).toBeInstanceOf(Graph);
  });

  it('getPositions returns a copy', () => {
    const g = new Graph({ vertices: [1, 2] });
    expect(g.getPositions()).not.toBe(g.getPositions());
  });

  it('empty vertices produces empty layout', () => {
    expect(new Graph({ layout: 'circular' }).getPositions().size).toBe(0);
  });
});

describe('Styling operations', () => {
  it('setVertexColor returns this for chaining', () => {
    expect(new Graph({ vertices: [1] }).setVertexColor(1, '#FF0000')).toBeInstanceOf(Graph);
  });

  it('setVertexColor on missing vertex is a no-op', () => {
    expect(new Graph().setVertexColor(99, '#FF0000')).toBeInstanceOf(Graph);
  });

  it('setEdgeColor returns this for chaining', () => {
    expect(
      new Graph({ vertices: [1, 2], edges: [[1, 2]] }).setEdgeColor(1, 2, '#0F0'),
    ).toBeInstanceOf(Graph);
  });

  it('setEdgeColor on missing edge is a no-op', () => {
    expect(new Graph().setEdgeColor(1, 2, '#00FF00')).toBeInstanceOf(Graph);
  });

  it('highlightPath returns this for chaining', () => {
    const g = new Graph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [2, 3],
      ],
    });
    expect(g.highlightPath([1, 2, 3])).toBe(g);
  });

  it('highlightPath works with custom colors', () => {
    const g = new Graph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [2, 3],
      ],
    });
    expect(g.highlightPath([1, 2, 3], '#00FF00', '#0000FF')).toBe(g);
  });

  it('resetColors returns this for chaining', () => {
    const g = new Graph({ vertices: [1, 2], edges: [[1, 2]] });
    g.highlightPath([1, 2]);
    expect(g.resetColors()).toBe(g);
  });

  it('resetColors with per-vertex config', () => {
    const vcfg = new Map();
    vcfg.set(1, { style: { color: '#FF0000' } });
    const g = new Graph({ vertices: [1, 2], edges: [[1, 2]], vertexConfig: vcfg });
    g.highlightPath([1, 2]);
    expect(g.resetColors()).toBe(g);
  });

  it('resetColors with per-edge config', () => {
    const ecfg = new Map();
    ecfg.set('1--2', { style: { color: '#00FF00' } });
    const g = new Graph({ vertices: [1, 2], edges: [[1, 2]], edgeConfig: ecfg });
    g.highlightPath([1, 2]);
    expect(g.resetColors()).toBe(g);
  });
});

describe('completeGraph', () => {
  it('creates K0 (empty)', () => {
    expect(completeGraph(0).numVertices).toBe(0);
    expect(completeGraph(0).numEdges).toBe(0);
  });

  it('creates K1 (single vertex, no edges)', () => {
    expect(completeGraph(1).numVertices).toBe(1);
    expect(completeGraph(1).numEdges).toBe(0);
  });

  it('creates K3 with 3 edges', () => {
    expect(completeGraph(3).numEdges).toBe(3);
  });

  it('creates K4 with n*(n-1)/2 = 6 edges', () => {
    expect(completeGraph(4).numEdges).toBe(6);
  });

  it('creates K5 with 10 edges', () => {
    expect(completeGraph(5).numEdges).toBe(10);
  });

  it('returns a Graph instance', () => {
    expect(completeGraph(3)).toBeInstanceOf(Graph);
  });

  it('accepts custom options', () => {
    expect(completeGraph(3, { layout: 'grid' }).numVertices).toBe(3);
  });
});

describe('cycleGraph', () => {
  it('creates C3 with degree 2 for all vertices', () => {
    const g = cycleGraph(3);
    expect(g.numVertices).toBe(3);
    expect(g.numEdges).toBe(3);
    for (let i = 0; i < 3; i++) expect(g.getDegree(i)).toBe(2);
  });

  it('creates C4 (square)', () => {
    expect(cycleGraph(4).numEdges).toBe(4);
  });

  it('creates C1 (self-loop)', () => {
    expect(cycleGraph(1).numEdges).toBe(1);
  });

  it('returns a Graph instance', () => {
    expect(cycleGraph(5)).toBeInstanceOf(Graph);
  });
});

describe('pathGraph', () => {
  it('creates P1 (single vertex, no edges)', () => {
    expect(pathGraph(1).numEdges).toBe(0);
  });

  it('creates P3 with endpoint degree 1 and middle degree 2', () => {
    const g = pathGraph(3);
    expect(g.numEdges).toBe(2);
    expect(g.getDegree(0)).toBe(1);
    expect(g.getDegree(1)).toBe(2);
    expect(g.getDegree(2)).toBe(1);
  });

  it('P5 has n-1 edges', () => {
    expect(pathGraph(5).numEdges).toBe(4);
  });

  it('returns a Graph instance', () => {
    expect(pathGraph(3)).toBeInstanceOf(Graph);
  });
});

describe('starGraph', () => {
  it('creates S3 (center + 3 outer)', () => {
    const g = starGraph(3);
    expect(g.numVertices).toBe(4);
    expect(g.numEdges).toBe(3);
    expect(g.getDegree(0)).toBe(3);
  });

  it('creates S1 (center + 1 outer)', () => {
    expect(starGraph(1).numVertices).toBe(2);
  });

  it('outer vertices have degree 1', () => {
    const g = starGraph(4);
    for (let i = 1; i <= 4; i++) expect(g.getDegree(i)).toBe(1);
  });

  it('returns a Graph instance', () => {
    expect(starGraph(3)).toBeInstanceOf(Graph);
  });
});

describe('binaryTree', () => {
  it('creates depth-0 tree (single root)', () => {
    expect(binaryTree(0).numVertices).toBe(1);
    expect(binaryTree(0).numEdges).toBe(0);
  });

  it('creates depth-1 tree (3 nodes, 2 edges)', () => {
    expect(binaryTree(1).numVertices).toBe(3);
    expect(binaryTree(1).numEdges).toBe(2);
  });

  it('creates depth-2 tree (7 nodes, 6 edges)', () => {
    expect(binaryTree(2).numVertices).toBe(7);
    expect(binaryTree(2).numEdges).toBe(6);
  });

  it('returns a DiGraph instance', () => {
    expect(binaryTree(1)).toBeInstanceOf(DiGraph);
    expect(binaryTree(1)).toBeInstanceOf(GenericGraph);
  });

  it('root has out-degree 2', () => {
    expect(binaryTree(2).getOutDegree(0)).toBe(2);
  });

  it('leaf nodes have out-degree 0', () => {
    const t = binaryTree(2);
    for (const leaf of [3, 4, 5, 6]) expect(t.getOutDegree(leaf)).toBe(0);
  });
});

describe('gridGraph', () => {
  it('creates 2x2 grid (4 edges)', () => {
    expect(gridGraph(2, 2).numVertices).toBe(4);
    expect(gridGraph(2, 2).numEdges).toBe(4);
  });

  it('creates 3x3 grid (12 edges)', () => {
    expect(gridGraph(3, 3).numEdges).toBe(12);
  });

  it('creates 1x1 grid (no edges)', () => {
    expect(gridGraph(1, 1).numEdges).toBe(0);
  });

  it('creates 1xN path', () => {
    expect(gridGraph(1, 4).numEdges).toBe(3);
  });

  it('vertex ids use row,col format', () => {
    const g = gridGraph(2, 3);
    expect(g.hasVertex('0,0')).toBe(true);
    expect(g.hasVertex('1,2')).toBe(true);
    expect(g.hasVertex('0,3')).toBe(false);
  });

  it('returns a Graph instance', () => {
    expect(gridGraph(2, 2)).toBeInstanceOf(Graph);
  });
});

describe('bipartiteGraph', () => {
  it('creates complete bipartite K(2,3) with 6 edges', () => {
    expect(bipartiteGraph(2, 3).numEdges).toBe(6);
  });

  it('creates K(1,1)', () => {
    expect(bipartiteGraph(1, 1).numEdges).toBe(1);
  });

  it('vertices use L/R prefix', () => {
    const g = bipartiteGraph(2, 2);
    expect(g.hasVertex('L0')).toBe(true);
    expect(g.hasVertex('R1')).toBe(true);
  });

  it('creates bipartite with custom edges', () => {
    const g = bipartiteGraph(2, 2, [['L0', 'R1']]);
    expect(g.numEdges).toBe(1);
    expect(g.hasEdge('L0', 'R1')).toBe(true);
  });

  it('returns a Graph instance', () => {
    expect(bipartiteGraph(2, 2)).toBeInstanceOf(Graph);
  });
});
