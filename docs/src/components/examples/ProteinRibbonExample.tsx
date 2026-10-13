// Live example for the 0.37 molecular module Protein, shown as a smooth tube
// through a programmatically generated alpha-helix CA trace. Every residue is
// marked ss:'helix', so secondary-structure coloring paints the whole tube red.
import React from 'react';
import ManimExample from '../ManimExample';

// Build an ideal alpha helix: 18 residues, 100 degrees of turn and 1.5 angstrom
// of rise per residue, on a cylinder of radius 2.3. The helix climbs the Z axis
// (vertical, since the scene uses Z-up) and is centered on the origin.
const RESIDUE_CODES = ['A', 'L', 'V', 'G', 'K', 'E', 'S'];
const N = 18;
const residues = Array.from({ length: N }, (_, i) => {
  const t = i * ((100 * Math.PI) / 180);
  return {
    code: RESIDUE_CODES[i % RESIDUE_CODES.length],
    ca: [2.3 * Math.cos(t), 2.3 * Math.sin(t), i * 1.5 - ((N - 1) * 1.5) / 2] as [
      number,
      number,
      number,
    ],
    ss: 'helix' as const,
  };
});

async function animate(scene: any) {
  const { Protein, Create } = await import('manim-web');

  const protein = new Protein({
    residues,
    representation: 'tube',
    colorMode: 'secondary-structure', // helix -> red, sheet -> yellow, coil -> grey
    tubeRadius: 0.35,
    smoothing: 8,
  });

  scene.add(protein);
  await scene.play(new Create(protein, { duration: 2.5 }));

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

export default function ProteinRibbonExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
