// Live example for the 0.33 biology mobjects: AminoAcidChain.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { AminoAcidChain, Create } = await import('manim-web');

  // A bead chain of amino acid residues joined by peptide bonds, laid out as a
  // zigzag. Each bead is colored by residue and labeled with its code.
  const chain = new AminoAcidChain({
    residues: ['M', 'A', 'G', 'K', 'D', 'E', 'F', 'R', 'S', 'T'],
    beadRadius: 0.38,
    spacing: 1.05,
    zigzag: true,
    labelFontSize: 22,
  });
  chain.scale(1.05);

  await scene.play(new Create(chain, { duration: 2.5 }));
  await scene.wait(999999);
}

export default function AminoAcidChainExample() {
  return <ManimExample animationFn={animate} />;
}
