// Live example for the 0.39 molecular MD-trajectory playback: parsePdbTrajectory
// + playTrajectory. A hand-authored multi-MODEL PDB holds one 6-carbon chain in
// three conformations (extended -> half-folded -> hairpin). parsePdbTrajectory
// reads each MODEL block into a frame; playTrajectory drives a Molecule3D from
// frame 0 through each frame in order, rebuilding the bonds every frame so the
// sticks follow the atoms. The scene plays forward then back so it loops. 3D, so
// it uses a ThreeDScene. All data is inline, no files, no network.
import React from 'react';
import ManimExample from '../ManimExample';

// A column-correct multi-MODEL PDB: 3 models, 6 carbons each, one linear chain
// (CONECT 1-2-3-4-5-6). Every model holds the same atoms in the same order, as
// parsePdbTrajectory requires. The chain lies in the vertical X-Z plane (y = 0),
// so a side-on, z-up camera sees the fold face-on and well lit.
const pdb = `MODEL        1
ATOM      1  C1  ALA A   1      -3.250   0.000  -0.380  1.00  0.00           C
ATOM      2  C2  ALA A   1      -1.950   0.000   0.380  1.00  0.00           C
ATOM      3  C3  ALA A   1      -0.650   0.000  -0.380  1.00  0.00           C
ATOM      4  C4  ALA A   1       0.650   0.000   0.380  1.00  0.00           C
ATOM      5  C5  ALA A   1       1.950   0.000  -0.380  1.00  0.00           C
ATOM      6  C6  ALA A   1       3.250   0.000   0.380  1.00  0.00           C
ENDMDL
MODEL        2
ATOM      1  C1  ALA A   1      -3.250   0.000  -0.380  1.00  0.00           C
ATOM      2  C2  ALA A   1      -1.950   0.000   0.380  1.00  0.00           C
ATOM      3  C3  ALA A   1      -0.650   0.000  -0.380  1.00  0.00           C
ATOM      4  C4  ALA A   1       0.450   0.000   0.600  1.00  0.00           C
ATOM      5  C5  ALA A   1       0.300   0.000   2.050  1.00  0.00           C
ATOM      6  C6  ALA A   1      -0.900   0.000   2.600  1.00  0.00           C
ENDMDL
MODEL        3
ATOM      1  C1  ALA A   1      -3.250   0.000  -0.380  1.00  0.00           C
ATOM      2  C2  ALA A   1      -1.950   0.000   0.380  1.00  0.00           C
ATOM      3  C3  ALA A   1      -0.650   0.000  -0.380  1.00  0.00           C
ATOM      4  C4  ALA A   1      -0.650   0.000   1.120  1.00  0.00           C
ATOM      5  C5  ALA A   1      -1.950   0.000   1.880  1.00  0.00           C
ATOM      6  C6  ALA A   1      -3.250   0.000   1.120  1.00  0.00           C
ENDMDL
CONECT    1    2
CONECT    2    1    3
CONECT    3    2    4
CONECT    4    3    5
CONECT    5    4    6
CONECT    6    5
END`;

async function animate(scene: any) {
  const { parsePdbTrajectory, Molecule3D, playTrajectory, Create } = await import('manim-web');

  // Parse the MODEL blocks into { structure, frames, numModels }.
  const traj = parsePdbTrajectory(pdb);

  // Build the molecule from the first model's atoms and bonds. Its atom count
  // matches every frame, which playTrajectory requires. Carbons are tinted so
  // the chain reads on the dark background.
  const molecule = new Molecule3D({
    atoms: traj.structure.atoms,
    bonds: traj.structure.bonds,
    style: 'ball-and-stick',
    colors: { C: '#58c4dd' },
    bondColor: '#9fe3f0',
  });
  scene.add(molecule);
  await scene.play(new Create(molecule, { duration: 1.2 }));

  // Play the trajectory forward (frame 0 -> 1 -> 2), then back, so it loops.
  await scene.play(playTrajectory({ molecule, frames: traj.frames, runTime: 2.5 }));
  await scene.play(playTrajectory({ molecule, frames: [...traj.frames].reverse(), runTime: 2.5 }));
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    // The chain lies in the vertical X-Z plane; a side-on, z-up view shows the
    // extended <-> hairpin change face-on and lights the atoms well.
    phi: 80 * (Math.PI / 180),
    theta: -90 * (Math.PI / 180),
    distance: 15,
    fov: 45,
    orbitControlsUp: 'z',
  });
}

export default function MoleculeTrajectoryExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
