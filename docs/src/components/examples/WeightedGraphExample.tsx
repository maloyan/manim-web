// Live example component for the "New in 0.16 and 0.17" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Graph, Create } = await import('manim-web');

  const graph = new Graph({
    vertices: ['A', 'B', 'C', 'D'],
    // ['A', 'A'] is a self-loop: an edge from a vertex to itself.
    edges: [
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'D'],
      ['D', 'A'],
      ['A', 'C'],
      ['A', 'A'],
    ],
    layout: 'circular',
    showLabels: true,
    vertexStyle: { color: '#58c4dd', radius: 0.22 },
    edgeStyle: { color: '#888888', strokeWidth: 3 },
    // Edge keys for an undirected graph are "source--target" in sorted order.
    edgeConfig: {
      'A--B': { weight: 7 },
      'B--C': { weight: 3 },
      'C--D': { weight: 5 },
      'A--D': { weight: 2 },
      'A--C': { label: 'cut', style: { labelColor: '#ffff00' } },
      'A--A': { weight: 1, style: { selfLoopRadius: 0.4 } },
    },
  });
  graph.scale(1.4);

  await scene.play(new Create(graph, { duration: 2 }));
}

export default function WeightedGraphExample() {
  return <ManimExample animationFn={animate} />;
}
