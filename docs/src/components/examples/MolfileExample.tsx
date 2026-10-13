// Live example for the 0.38 moleculeFromMolfile parser: a 2D skeletal drawing
// built from an inline V2000 MOL block. The molecule has a C=C double bond, a
// C-O single bond, a C-Cl wedge bond (coming toward the viewer) and an O-Cl
// dash bond (going behind), so every molfile bond type reads at once. 2D, so it
// uses a regular Scene.
import React from 'react';
import ManimExample from '../ManimExample';

// A hand-authored V2000 MOL block (no files, no network). 4 atoms, 4 bonds.
const molfile = `test-molecule
  manim-web
a comment line
  4  4  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.0000    0.0000 Cl  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  1  4  1  1  0  0  0
  3  4  1  6  0  0  0
M  END`;

async function animate(scene: any) {
  const { moleculeFromMolfile, Create } = await import('manim-web');

  // Parse the MOL block into a 2D skeletal MoleculeMobject. bondLength scales
  // the atom coordinates; showCarbonLabels draws the C labels too.
  const molecule = moleculeFromMolfile(molfile, {
    bondLength: 1.8,
    showCarbonLabels: true,
  });
  molecule.center();
  molecule.scale(1.6);

  await scene.play(new Create(molecule, { duration: 2 }));
  await scene.wait(999999);
}

export default function MolfileExample() {
  return <ManimExample animationFn={animate} />;
}
