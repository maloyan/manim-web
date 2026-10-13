// Live example for the 0.33 biology mobjects: Cell.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Cell, Create } = await import('manim-web');

  // A 2D cell diagram: a bilayer membrane, a detailed nucleus, and realistic
  // organelles. Organelles with no position are auto-arranged on a ring, and
  // each name picks its own shape (bean cristae, stacked golgi, dot clusters).
  const cell = new Cell({
    radius: 2.6,
    organelles: [
      { name: 'mitochondrion' },
      { name: 'ribosome' },
      { name: 'lysosome' },
      { name: 'vacuole' },
      { name: 'golgi' },
      { name: 'endoplasmic reticulum', label: 'ER' },
    ],
    labelFontSize: 18,
  });

  await scene.play(new Create(cell, { duration: 2.5 }));
  await scene.wait(999999);
}

export default function CellExample() {
  return <ManimExample animationFn={animate} />;
}
