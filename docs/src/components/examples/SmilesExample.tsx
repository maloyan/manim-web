// Live example for the 0.38 SMILES parser: moleculeFromSmiles builds a 2D
// skeletal structure from a SMILES string. Here acetic acid (CC(=O)O) shows a
// methyl branch, a carbonyl double bond, and a hydroxyl oxygen. 2D, so a
// regular Scene; the structure is drawn with Create.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { moleculeFromSmiles, Create } = await import('manim-web');

  // Any organic-subset SMILES works, e.g. 'CCO' (ethanol), 'c1ccccc1' (benzene),
  // 'C1CCCCC1' (cyclohexane). Acetic acid shows a branch and a double bond.
  const molecule = moleculeFromSmiles('CC(=O)O', { bondLength: 1.6, showCarbonLabels: true });
  molecule.center();
  molecule.scale(1.6);

  scene.add(molecule);
  await scene.play(new Create(molecule, { duration: 2 }));
  await scene.wait(999999);
}

export default function SmilesExample() {
  return <ManimExample animationFn={animate} />;
}
