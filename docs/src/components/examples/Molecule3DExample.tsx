// Live example for the 0.37 molecular module Molecule3D, shown as a
// ball-and-stick benzene ring (6 carbons in a planar hexagon + 6 hydrogens,
// alternating double bonds) that spins so the 3D node-link structure reads.
import React from 'react';
import ManimExample from '../ManimExample';

// Benzene: carbons on a hexagon of radius 1.4 in the XY plane, hydrogens on the
// same rays at radius 2.49. Bonds alternate double/single around the ring, then
// one C-H bond per carbon. Coordinates are in angstrom, close to real benzene.
const r = 1.4;
const rh = 2.49;
const angles = [0, 60, 120, 180, 240, 300].map((d) => (d * Math.PI) / 180);
const atoms = [
  ...angles.map((a) => ({
    element: 'C',
    position: [r * Math.cos(a), r * Math.sin(a), 0] as [number, number, number],
  })),
  ...angles.map((a) => ({
    element: 'H',
    position: [rh * Math.cos(a), rh * Math.sin(a), 0] as [number, number, number],
  })),
];
const bonds = [
  { from: 0, to: 1, order: 2 as const },
  { from: 1, to: 2, order: 1 as const },
  { from: 2, to: 3, order: 2 as const },
  { from: 3, to: 4, order: 1 as const },
  { from: 4, to: 5, order: 2 as const },
  { from: 5, to: 0, order: 1 as const },
  { from: 0, to: 6 },
  { from: 1, to: 7 },
  { from: 2, to: 8 },
  { from: 3, to: 9 },
  { from: 4, to: 10 },
  { from: 5, to: 11 },
];

async function animate(scene: any) {
  const { Molecule3D, Create } = await import('manim-web');

  const benzene = new Molecule3D({
    atoms,
    bonds,
    style: 'ball-and-stick',
  });

  scene.add(benzene);
  await scene.play(new Create(benzene, { duration: 2 }));

  // Spin around the vertical axis so the flat ring reads as a real 3D object.
  scene.beginAmbientCameraRotation(0.3);
  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 65 * (Math.PI / 180),
    theta: -30 * (Math.PI / 180),
    distance: 11,
    fov: 45,
  });
}

export default function Molecule3DExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
