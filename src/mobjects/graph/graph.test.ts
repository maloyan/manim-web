import { describe, it, expect } from 'vitest';
import { Graph, DiGraph, GenericGraph } from './index';

// ============================================================================
// Graph (undirected) construction
// ============================================================================

describe('Graph construction', () => {
  it('constructs an empty graph with defaults', () => {
    const g = new Graph();
    expect(g.numVertices).toBe(0);
    expect(g.numEdges).toBe(0);
    expect(g.getVertices()).toEqual([]);
    expect(g.getEdges()).toEqual([]);
  });

  it('constructs a graph with vertices only', () => {
    const g = new Graph({ vertices: ['a', 'b', 'c'] });
    expect(g.numVertices).toBe(3);
    expect(g.numEdges).toBe(0);
    expect(g.getVertices()).toEqual(['a', 'b', 'c']);
  });

  it('constructs a graph with vertices and edges', () => {
    const g = new Graph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [2, 3],
      ],
    });
    expect(g.numVertices).toBe(3);
    expect(g.numEdges).toBe(2);
  });

  it('constructs with numeric vertex ids', () => {
    const g = new Graph({ vertices: [10, 20, 30] });
    expect(g.hasVertex(10)).toBe(true);
    expect(g.hasVertex(20)).toBe(true);
    expect(g.hasVertex(30)).toBe(true);
    expect(g.hasVertex(40)).toBe(false);
  });

  it('is an instance of GenericGraph', () => {
    expect(new Graph()).toBeInstanceOf(GenericGraph);
  });
});

// ============================================================================
// Vertex operations
// ============================================================================

describe('Vertex operations', () => {
  it('addVertex adds a new vertex', () => {
    const g = new Graph();
    g.addVertex('x');
    expect(g.hasVertex('x')).toBe(true);
    expect(g.numVertices).toBe(1);
  });

  it('addVertex is idempotent for existing vertex', () => {
    const g = new Graph({ vertices: ['a'] });
    g.addVertex('a');
    expect(g.numVertices).toBe(1);
  });

  it('addVertex returns this for chaining', () => {
    const g = new Graph();
    expect(g.addVertex('v')).toBe(g);
  });

  it('addVertex with config stores position', () => {
    const g = new Graph();
    g.addVertex('v', { position: [3, 4, 0] });
    expect(g.hasVertex('v')).toBe(true);
    const pos = g.getVertexPosition('v');
    expect(pos).toBeDefined();
    expect(pos![0]).toBeCloseTo(3, 5);
    expect(pos![1]).toBeCloseTo(4, 5);
  });

  it('addVertices adds multiple vertices at once', () => {
    const g = new Graph();
    g.addVertices('a', 'b', 'c');
    expect(g.numVertices).toBe(3);
    expect(g.hasVertex('a')).toBe(true);
    expect(g.hasVertex('b')).toBe(true);
    expect(g.hasVertex('c')).toBe(true);
  });

  it('addVertices skips already existing vertices', () => {
    const g = new Graph({ vertices: ['a'] });
    g.addVertices('a', 'b');
    expect(g.numVertices).toBe(2);
  });

  it('addVertices returns this for chaining', () => {
    expect(new Graph().addVertices('x')).toBeInstanceOf(Graph);
  });

  it('removeVertex removes a vertex', () => {
    const g = new Graph({ vertices: ['a', 'b', 'c'] });
    g.removeVertex('b');
    expect(g.hasVertex('b')).toBe(false);
    expect(g.numVertices).toBe(2);
  });

  it('removeVertex also removes connected edges', () => {
    const g = new Graph({
      vertices: ['a', 'b', 'c'],
      edges: [
        ['a', 'b'],
        ['b', 'c'],
        ['a', 'c'],
      ],
    });
    g.removeVertex('b');
    expect(g.numEdges).toBe(1);
    expect(g.hasEdge('a', 'c')).toBe(true);
    expect(g.hasEdge('a', 'b')).toBe(false);
  });

  it('removeVertex on non-existent vertex is a no-op', () => {
    const g = new Graph({ vertices: ['a'] });
    g.removeVertex('z');
    expect(g.numVertices).toBe(1);
  });

  it('removeVertex returns this for chaining', () => {
    const g = new Graph({ vertices: ['a'] });
    expect(g.removeVertex('a')).toBe(g);
  });

  it('getVertices returns a copy', () => {
    const g = new Graph({ vertices: [1, 2, 3] });
    const v = g.getVertices();
    v.push(99);
    expect(g.numVertices).toBe(3);
  });

  it('getVertexPosition returns position or undefined', () => {
    const g = new Graph({ vertices: [1], layout: 'circular' });
    expect(g.getVertexPosition(1)).toBeDefined();
    expect(g.getVertexPosition(999)).toBeUndefined();
  });

  it('setVertexPosition updates position', () => {
    const g = new Graph({
      vertices: [1, 2],
      edges: [[1, 2]],
      layout: 'circular',
    });
    g.setVertexPosition(1, [5, 5, 0]);
    expect(g.getVertexPosition(1)).toEqual([5, 5, 0]);
  });

  it('setVertexPosition on non-existent vertex is a no-op', () => {
    const g = new Graph();
    expect(g.setVertexPosition(999, [1, 1, 0])).toBe(g);
  });

  it('setVertexPosition returns this for chaining', () => {
    const g = new Graph({ vertices: [1] });
    expect(g.setVertexPosition(1, [0, 0, 0])).toBe(g);
  });

  it('getVertexMobject returns Dot for existing vertex', () => {
    const g = new Graph({ vertices: ['a'] });
    expect(g.getVertexMobject('a')).toBeDefined();
  });

  it('getVertexMobject returns undefined for missing vertex', () => {
    expect(new Graph().getVertexMobject('x')).toBeUndefined();
  });
});

// ============================================================================
// Neighbor and degree
// ============================================================================

describe('Neighbors and degree', () => {
  it('getNeighbors returns adjacent vertices', () => {
    const g = new Graph({
      vertices: [1, 2, 3, 4],
      edges: [
        [1, 2],
        [1, 3],
        [3, 4],
      ],
    });
    expect(g.getNeighbors(1).sort()).toEqual([2, 3]);
  });

  it('getNeighbors returns empty array for isolated vertex', () => {
    const g = new Graph({ vertices: [1, 2] });
    expect(g.getNeighbors(1)).toEqual([]);
  });

  it('getDegree returns correct count', () => {
    const g = new Graph({
      vertices: [1, 2, 3, 4],
      edges: [
        [1, 2],
        [1, 3],
        [1, 4],
      ],
    });
    expect(g.getDegree(1)).toBe(3);
    expect(g.getDegree(2)).toBe(1);
  });

  it('getDegree is 0 for isolated vertex', () => {
    expect(new Graph({ vertices: ['solo'] }).getDegree('solo')).toBe(0);
  });
});

// ============================================================================
// Edge operations
// ============================================================================

describe('Edge operations', () => {
  it('addEdge adds a new edge', () => {
    const g = new Graph({ vertices: ['a', 'b'] });
    g.addEdge('a', 'b');
    expect(g.hasEdge('a', 'b')).toBe(true);
    expect(g.numEdges).toBe(1);
  });

  it('addEdge also adds missing vertices', () => {
    const g = new Graph();
    g.addEdge('x', 'y');
    expect(g.hasVertex('x')).toBe(true);
    expect(g.hasVertex('y')).toBe(true);
    expect(g.numEdges).toBe(1);
  });

  it('addEdge is idempotent for duplicate edge', () => {
    const g = new Graph({ vertices: ['a', 'b'], edges: [['a', 'b']] });
    g.addEdge('a', 'b');
    expect(g.numEdges).toBe(1);
  });

  it('addEdge returns this for chaining', () => {
    const g = new Graph({ vertices: [1, 2] });
    expect(g.addEdge(1, 2)).toBe(g);
  });

  it('addEdges adds multiple edges', () => {
    const g = new Graph({ vertices: [1, 2, 3, 4] });
    g.addEdges([1, 2], [3, 4]);
    expect(g.numEdges).toBe(2);
    expect(g.hasEdge(1, 2)).toBe(true);
    expect(g.hasEdge(3, 4)).toBe(true);
  });

  it('addEdges creates missing vertices', () => {
    const g = new Graph();
    g.addEdges([10, 20], [20, 30]);
    expect(g.numVertices).toBe(3);
    expect(g.numEdges).toBe(2);
  });

  it('addEdges returns this for chaining', () => {
    expect(new Graph().addEdges([1, 2])).toBeInstanceOf(Graph);
  });

  it('removeEdge removes an existing edge', () => {
    const g = new Graph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [2, 3],
      ],
    });
    g.removeEdge(1, 2);
    expect(g.hasEdge(1, 2)).toBe(false);
    expect(g.numEdges).toBe(1);
    expect(g.hasVertex(1)).toBe(true);
    expect(g.hasVertex(2)).toBe(true);
  });

  it('removeEdge on non-existent edge is a no-op', () => {
    const g = new Graph({ vertices: [1, 2], edges: [[1, 2]] });
    g.removeEdge(1, 3);
    expect(g.numEdges).toBe(1);
  });

  it('removeEdge returns this for chaining', () => {
    expect(new Graph().removeEdge(1, 2)).toBeInstanceOf(Graph);
  });

  it('getEdges returns a copy of edge list', () => {
    const g = new Graph({ vertices: [1, 2], edges: [[1, 2]] });
    const edges = g.getEdges();
    edges.push([3, 4]);
    expect(g.numEdges).toBe(1);
  });

  it('hasEdge is symmetric for undirected graph', () => {
    const g = new Graph({ vertices: ['a', 'b'], edges: [['a', 'b']] });
    expect(g.hasEdge('a', 'b')).toBe(true);
    expect(g.hasEdge('b', 'a')).toBe(true);
  });

  it('getEdgeMobject returns mobject for existing edge', () => {
    const g = new Graph({ vertices: [1, 2], edges: [[1, 2]] });
    expect(g.getEdgeMobject(1, 2)).toBeDefined();
  });

  it('getEdgeMobject returns undefined for missing edge', () => {
    expect(new Graph({ vertices: [1, 2] }).getEdgeMobject(1, 2)).toBeUndefined();
  });
});

// ============================================================================
// DiGraph (directed)
// ============================================================================

describe('DiGraph', () => {
  it('constructs an empty directed graph', () => {
    const dg = new DiGraph();
    expect(dg.numVertices).toBe(0);
    expect(dg.numEdges).toBe(0);
  });

  it('is an instance of GenericGraph', () => {
    expect(new DiGraph()).toBeInstanceOf(GenericGraph);
  });

  it('constructs with vertices and edges', () => {
    const dg = new DiGraph({
      vertices: ['a', 'b', 'c'],
      edges: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    });
    expect(dg.numVertices).toBe(3);
    expect(dg.numEdges).toBe(2);
  });

  it('hasEdge is directional', () => {
    const dg = new DiGraph({ vertices: ['a', 'b'], edges: [['a', 'b']] });
    expect(dg.hasEdge('a', 'b')).toBe(true);
    expect(dg.hasEdge('b', 'a')).toBe(false);
  });

  it('getOutNeighbors returns outgoing neighbors', () => {
    const dg = new DiGraph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [1, 3],
        [2, 3],
      ],
    });
    expect(dg.getOutNeighbors(1).sort()).toEqual([2, 3]);
    expect(dg.getOutNeighbors(3)).toEqual([]);
  });

  it('getInNeighbors returns incoming neighbors', () => {
    const dg = new DiGraph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [1, 3],
        [2, 3],
      ],
    });
    expect(dg.getInNeighbors(3).sort()).toEqual([1, 2]);
    expect(dg.getInNeighbors(1)).toEqual([]);
  });

  it('getOutDegree counts outgoing edges', () => {
    const dg = new DiGraph({
      vertices: [1, 2, 3],
      edges: [
        [1, 2],
        [1, 3],
      ],
    });
    expect(dg.getOutDegree(1)).toBe(2);
    expect(dg.getOutDegree(2)).toBe(0);
  });

  it('getInDegree counts incoming edges', () => {
    const dg = new DiGraph({
      vertices: [1, 2, 3],
      edges: [
        [1, 3],
        [2, 3],
      ],
    });
    expect(dg.getInDegree(3)).toBe(2);
    expect(dg.getInDegree(1)).toBe(0);
  });

  it('addEdge works on directed graph', () => {
    const dg = new DiGraph({ vertices: ['a', 'b'] });
    dg.addEdge('a', 'b');
    expect(dg.hasEdge('a', 'b')).toBe(true);
    expect(dg.hasEdge('b', 'a')).toBe(false);
  });

  it('removeEdge works on directed graph', () => {
    const dg = new DiGraph({ vertices: ['a', 'b'], edges: [['a', 'b']] });
    dg.removeEdge('a', 'b');
    expect(dg.hasEdge('a', 'b')).toBe(false);
  });
});

// ============================================================================
// Edge shortening (tested via construction since _shortenEdge is protected)
// ============================================================================

describe('Edge shortening', () => {
  it('edges between distant vertices are created', () => {
    const positions = new Map<string | number, [number, number, number]>();
    positions.set('a', [-5, 0, 0]);
    positions.set('b', [5, 0, 0]);
    const g = new Graph({
      vertices: ['a', 'b'],
      edges: [['a', 'b']],
      layout: { type: 'custom', positions },
    });
    expect(g.getEdgeMobject('a', 'b')).toBeDefined();
  });

  it('edges between very close vertices are still created', () => {
    const positions = new Map<string | number, [number, number, number]>();
    positions.set('a', [0, 0, 0]);
    positions.set('b', [0.01, 0, 0]);
    const g = new Graph({
      vertices: ['a', 'b'],
      edges: [['a', 'b']],
      layout: { type: 'custom', positions },
    });
    expect(g.getEdgeMobject('a', 'b')).toBeDefined();
  });
});

// ============================================================================
// Custom vertex/edge styling
// ============================================================================

describe('Custom vertex/edge styling via options', () => {
  it('custom vertexStyle is applied', () => {
    const g = new Graph({
      vertices: [1],
      vertexStyle: { radius: 0.5, color: '#FF0000' },
    });
    expect(g.getVertexMobject(1)).toBeDefined();
  });

  it('custom edgeStyle is applied', () => {
    const g = new Graph({
      vertices: [1, 2],
      edges: [[1, 2]],
      edgeStyle: { color: '#00FF00', strokeWidth: 8 },
    });
    expect(g.getEdgeMobject(1, 2)).toBeDefined();
  });

  it('per-vertex style overrides default', () => {
    const vcfg = new Map();
    vcfg.set(1, { style: { color: '#FF0000', radius: 0.3 } });
    const g = new Graph({ vertices: [1, 2], vertexConfig: vcfg });
    expect(g.getVertexMobject(1)).toBeDefined();
    expect(g.getVertexMobject(2)).toBeDefined();
  });

  it('vertexConfig as plain object', () => {
    const g = new Graph({
      vertices: ['a'],
      vertexConfig: { a: { position: [7, 8, 0] } },
    });
    const pos = g.getVertexPosition('a')!;
    expect(pos[0]).toBeCloseTo(7, 5);
    expect(pos[1]).toBeCloseTo(8, 5);
  });

  it('edgeConfig as plain object', () => {
    const g = new Graph({
      vertices: ['a', 'b'],
      edges: [['a', 'b']],
      edgeConfig: { 'a--b': { weight: 5 } },
    });
    expect(g.hasEdge('a', 'b')).toBe(true);
  });

  it('edgeConfig as Map', () => {
    const ecfg = new Map();
    ecfg.set('a--b', { weight: 3 });
    const g = new Graph({
      vertices: ['a', 'b'],
      edges: [['a', 'b']],
      edgeConfig: ecfg,
    });
    expect(g.hasEdge('a', 'b')).toBe(true);
  });

  it('vertexConfig as Map overrides layout position', () => {
    const vcfg = new Map();
    vcfg.set('a', { position: [10, 20, 0] as [number, number, number] });
    const g = new Graph({ vertices: ['a', 'b'], layout: 'circular', vertexConfig: vcfg });
    const pos = g.getVertexPosition('a')!;
    expect(pos[0]).toBeCloseTo(10, 5);
    expect(pos[1]).toBeCloseTo(20, 5);
  });
});
