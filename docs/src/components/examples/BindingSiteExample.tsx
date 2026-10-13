// Live example for the 0.38 structure-selection API: parsePdb +
// bindingSiteSelection. A tiny, column-correct PDB holds three residues (ALA 1,
// SER 2, LEU 3) and a three-atom HETATM ligand (LIG) sitting between residues 1
// and 2. bindingSiteSelection keeps only the protein atoms within 6 angstrom of
// the ligand, so LEU 3 (about 12 angstrom away) drops out and the pocket
// (ALA 1 + SER 2, 10 atoms, 8 bonds) is isolated. The pocket renders as
// ball-and-stick; the ligand renders beside it. 3D, so it uses a ThreeDScene.
import React from 'react';
import ManimExample from '../ManimExample';

// A hand-authored PDB string (fixed columns, no files, no network). The LEU 3
// residue is placed far from the ligand so the selection visibly trims it.
const pdb = `ATOM      1  N   ALA A   1       1.200   1.000   0.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       2.000   0.600   0.600  1.00  0.00           C
ATOM      3  C   ALA A   1       2.800   1.400   0.200  1.00  0.00           C
ATOM      4  O   ALA A   1       3.000   1.200  -1.000  1.00  0.00           O
ATOM      5  CB  ALA A   1       2.400  -0.800   0.400  1.00  0.00           C
ATOM      6  N   SER A   2      -1.400   0.800   0.500  1.00  0.00           N
ATOM      7  CA  SER A   2      -2.200   0.200   0.000  1.00  0.00           C
ATOM      8  C   SER A   2      -2.900   1.000  -0.800  1.00  0.00           C
ATOM      9  O   SER A   2      -3.100   0.600  -1.900  1.00  0.00           O
ATOM     10  OG  SER A   2      -2.800  -1.000   0.600  1.00  0.00           O
ATOM     11  N   LEU A   3       0.500   0.000  12.000  1.00  0.00           N
ATOM     12  CA  LEU A   3       1.000   0.500  12.800  1.00  0.00           C
ATOM     13  C   LEU A   3       1.800   1.400  12.200  1.00  0.00           C
ATOM     14  O   LEU A   3       2.000   1.300  11.000  1.00  0.00           O
HETATM   15  C1  LIG A   4       0.000   0.000   0.000  1.00  0.00           C
HETATM   16  O1  LIG A   4       0.600   0.900   0.300  1.00  0.00           O
HETATM   17  C2  LIG A   4      -0.800  -0.500  -0.700  1.00  0.00           C
CONECT    1    2
CONECT    2    1    3    5
CONECT    3    2    4
CONECT    4    3
CONECT    5    2
CONECT    6    7
CONECT    7    6    8   10
CONECT    8    7    9
CONECT    9    8
CONECT   10    7
CONECT   15   16   17
CONECT   16   15
CONECT   17   15
END`;

async function animate(scene: any) {
  const { parsePdb, bindingSiteSelection, Molecule3D, Create, FadeIn } = await import('manim-web');

  const structure = parsePdb(pdb);

  // Isolate the pocket: protein atoms (and bonds) within 6 angstrom of the
  // ligand. The ligand itself (hetatms) is the reference, so it is not in the
  // result; render it separately from structure.hetatms.
  const site = bindingSiteSelection(structure, 6);

  const pocket = new Molecule3D({
    atoms: site.atoms,
    bonds: site.bonds,
    style: 'ball-and-stick',
  });
  const ligand = new Molecule3D({
    atoms: structure.hetatms,
    style: 'ball-and-stick',
  });

  scene.add(pocket);
  scene.add(ligand);
  await scene.play(new Create(pocket, { duration: 2 }));
  await scene.play(new FadeIn(ligand, { duration: 1 }));

  // Spin so the pocket and the ligand inside it read as a real 3D arrangement.
  scene.beginAmbientCameraRotation(0.3);
  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 70 * (Math.PI / 180),
    theta: -45 * (Math.PI / 180),
    distance: 16,
    fov: 45,
  });
}

export default function BindingSiteExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
