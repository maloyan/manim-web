// Live example for the 0.33 biology mobjects: DNAHelix.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { DNAHelix, Create } = await import('manim-web');

  // A 2D schematic double helix. The rungs are colored by base with the
  // A/T/G/C palette; the second strand is the complement of the first.
  const dna = new DNAHelix({
    turns: 3,
    basePairs: 14,
    pitch: 1.6,
    radius: 0.9,
    sequence: ['A', 'T', 'G', 'C', 'A', 'A', 'T', 'G'],
    strokeWidth: 5,
  });
  dna.scale(0.9);

  await scene.play(new Create(dna, { duration: 2.5 }));
  await scene.wait(999999);
}

export default function DNAHelixExample() {
  return <ManimExample animationFn={animate} />;
}
