// Live example component for the "New in 0.26" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { ChordDiagram, FadeIn } = await import('manim-web');

  // Each group becomes an arc whose angle is proportional to its total flow.
  // Each non-zero flow pair becomes a ribbon between two arcs.
  const chord = new ChordDiagram({
    matrix: [
      [0, 5, 2, 1],
      [5, 0, 3, 2],
      [2, 3, 0, 4],
      [1, 2, 4, 0],
    ],
    labels: ['A', 'B', 'C', 'D'],
    radius: 2.3,
  });

  await scene.play(new FadeIn(chord, { duration: 1 }));
  await scene.wait(999999);
}

export default function ChordDiagramExample() {
  return <ManimExample animationFn={animate} />;
}
