// Live example for the 0.39 property-based protein coloring: Protein with
// colorMode 'bfactor'. A hand-authored CA-only PDB holds 12 residues on an ideal
// alpha-helix trace, each ATOM carrying a B-factor (temperature factor) in the
// standard column. parsePdb reads that column into residue.tempFactor; Protein
// in 'bfactor' mode maps it onto a blue -> white -> red ramp, so the flexible
// middle of the chain (high B-factor) is red and the rigid ends (low) are blue.
// The same residues work with colorMode 'hydrophobicity' or 'charge', which read
// the residue code instead of any data. 3D, so it uses a ThreeDScene. Inline
// data only, no files, no network.
import React from 'react';
import ManimExample from '../ManimExample';

// Column-correct CA-only PDB: one ATOM (named CA) per residue. parsePdb builds
// one residue per CA and reads each B-factor from columns 61-66. The B-factors
// rise from the ends (15) to the middle (~84), a smooth flexibility hump.
const pdb = `ATOM      1  CA  ALA A   1       2.300   0.000  -8.250  1.00 15.00           C
ATOM      2  CA  LEU A   2      -0.399   2.265  -6.750  1.00 34.72           C
ATOM      3  CA  VAL A   3      -2.161  -0.787  -5.250  1.00 52.84           C
ATOM      4  CA  GLY A   4       1.150  -1.992  -3.750  1.00 67.90           C
ATOM      5  CA  LYS A   5       1.762   1.478  -2.250  1.00 78.67           C
ATOM      6  CA  GLU A   6      -1.762   1.478  -0.750  1.00 84.29           C
ATOM      7  CA  SER A   7      -1.150  -1.992   0.750  1.00 84.29           C
ATOM      8  CA  PHE A   8       2.161  -0.787   2.250  1.00 78.67           C
ATOM      9  CA  THR A   9       0.399   2.265   3.750  1.00 67.90           C
ATOM     10  CA  ILE A  10      -2.300   0.000   5.250  1.00 52.84           C
ATOM     11  CA  ASP A  11       0.399  -2.265   6.750  1.00 34.72           C
ATOM     12  CA  ARG A  12       2.161   0.787   8.250  1.00 15.00           C
END`;

async function animate(scene: any) {
  const { parsePdb, Protein, Create } = await import('manim-web');

  // parsePdb reads the B-factor column into each residue's tempFactor.
  const { residues } = parsePdb(pdb);

  const protein = new Protein({
    residues,
    representation: 'tube',
    colorMode: 'bfactor', // blue (rigid) -> white -> red (flexible), domain from data
    tubeRadius: 0.35,
    smoothing: 8,
  });
  scene.add(protein);
  await scene.play(new Create(protein, { duration: 2.5 }));

  // Spin so the B-factor gradient along the whole helix reads.
  scene.beginAmbientCameraRotation(0.3);
  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 78 * (Math.PI / 180), // nearly side-on at the vertical helix
    theta: -40 * (Math.PI / 180),
    distance: 24,
    fov: 45,
    orbitControlsUp: 'z',
  });
}

export default function ProteinBFactorExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
