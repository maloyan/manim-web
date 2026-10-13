// Live example for the 0.33 biology mobject DNAHelix, shown as a true 3D
// double helix so the two backbone strands read as separate parts.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { DNAHelix, Create } = await import('manim-web');

  // threeD winds the two backbones around the helix axis in Z, so they read as
  // two separate strands, not a flat ladder. The rungs are colored by base with
  // the A/T/G/C palette; the second strand is the complement of the first.
  const dna = new DNAHelix({
    threeD: true,
    turns: 3,
    basePairs: 18,
    pitch: 1.6,
    radius: 0.95,
    sequence: ['A', 'T', 'G', 'C', 'A', 'A', 'T', 'G', 'C', 'T', 'A', 'G'],
  });
  // The helix is built along Y; stand it up along Z (the scene's vertical) so
  // the ambient camera rotation spins it like a turntable.
  dna.rotate(Math.PI / 2, [1, 0, 0]);
  dna.scale(0.9);

  scene.add(dna);
  await scene.play(new Create(dna, { duration: 2.5 }));

  // Spin the helix so the 3D winding of the two strands is obvious.
  scene.beginAmbientCameraRotation(0.3);
  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 78 * (Math.PI / 180), // look nearly side-on at the standing helix
    theta: 6 * (Math.PI / 180),
    distance: 8.5,
    fov: 45,
    enableOrbitControls: false,
  });
}

export default function DNAHelixExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
