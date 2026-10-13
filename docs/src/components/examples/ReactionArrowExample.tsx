// Live example for the 0.38 ReactionArrow mobject: the four reaction symbols an
// organic chemist draws between reactants and products, stacked in one 2D frame.
// forward (one head), reversible (two full heads), equilibrium (two harpoon
// half-heads) and resonance (a head at both ends). ReactionArrow is 2D, so a
// regular Scene. Each arrow is drawn with Create, so the shaft reveals left to
// right. White arrows read on the dark background.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { ReactionArrow, Create } = await import('manim-web');

  // One row per kind. Each shaft spans x = -2..2; rows are 1.6 apart.
  const arrows = [
    new ReactionArrow({
      start: [-2, 2.4, 0],
      end: [2, 2.4, 0],
      kind: 'forward',
      conditionsAbove: 'cat., Δ',
      conditionsBelow: 'H2O',
      color: '#ffffff',
      strokeWidth: 6,
    }),
    new ReactionArrow({
      start: [-2, 0.8, 0],
      end: [2, 0.8, 0],
      kind: 'reversible',
      conditionsAbove: 'k1',
      color: '#ffffff',
      strokeWidth: 6,
    }),
    new ReactionArrow({
      start: [-2, -0.8, 0],
      end: [2, -0.8, 0],
      kind: 'equilibrium',
      color: '#ffffff',
      strokeWidth: 6,
    }),
    new ReactionArrow({
      start: [-2, -2.4, 0],
      end: [2, -2.4, 0],
      kind: 'resonance',
      color: '#ffffff',
      strokeWidth: 6,
    }),
  ];

  // Draw each arrow in turn, top to bottom.
  for (const arrow of arrows) {
    await scene.play(new Create(arrow, { duration: 0.9 }));
  }
}

export default function ReactionArrowExample() {
  return <ManimExample animationFn={animate} />;
}
