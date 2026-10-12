// Live example component for the "New in 0.29, 0.30 and 0.31" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { benzene, FadeIn } = await import('manim-web');

  // A prebuilt molecule: six carbons in a hexagon ring with alternating single
  // and double bonds (Kekule benzene). bondLength scales every atom coordinate.
  const molecule = benzene({ bondLength: 1.8, bondColor: '#ffffff' });
  molecule.center();

  await scene.play(new FadeIn(molecule, { duration: 1.5 }));
  await scene.wait(999999);
}

export default function BenzeneMoleculeExample() {
  return <ManimExample animationFn={animate} />;
}
