// Live example component for the "New in 0.23, 0.24, and 0.25" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Graph } = await import('manim-web');

  const graph = new Graph({
    vertices: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    edges: [
      ['A', 'B'],
      ['A', 'C'],
      ['B', 'C'],
      ['C', 'D'],
      ['D', 'E'],
      ['E', 'F'],
      ['F', 'D'],
      ['G', 'A'],
      ['G', 'E'],
    ],
    showLabels: true,
    vertexStyle: { color: '#58c4dd', radius: 0.22 },
    edgeStyle: { color: '#888888', strokeWidth: 3 },
  });
  graph.scale(1.3);
  scene.add(graph);

  // animateSpringLayout returns a ForceDirectedLayout animation. It runs the
  // Fruchterman-Reingold simulation step by step over the run time, so the
  // graph visibly settles. seed sets repeatable random start positions.
  await scene.play(graph.animateSpringLayout({ iterations: 80, seed: 5, duration: 3 }));
  await scene.wait(999999);
}

export default function ForceDirectedLayoutExample() {
  return <ManimExample animationFn={animate} />;
}
