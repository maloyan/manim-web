// Live example for the 0.33 biology mobject DNAHelix, shown as a true 3D
// double helix so the two backbone strands read as separate parts.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { DNAHelix, Create } = await import('manim-web');

  // threeD winds the two backbones around the vertical axis in Z, so the
  // strands are clearly two separate helices (not a flat ladder). The rungs
  // are colored by base with the A/T/G/C palette; the second strand is the
  // complement of the first.
  const dna = new DNAHelix({
    threeD: true,
    turns: 4,
    basePairs: 22,
    pitch: 1.5,
    radius: 1.0,
    sequence: ['A', 'T', 'G', 'C', 'A', 'A', 'T', 'G', 'C', 'T'],
    backboneStrokeWidth: 7,
  });
  dna.scale(0.8);

  scene.add(dna);
  await scene.play(new Create(dna, { duration: 2.5 }));

  // Spin the helix so the 3D winding of the two strands is obvious.
  scene.beginAmbientCameraRotation(0.35);
  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 82 * (Math.PI / 180), // look nearly side-on at the vertical helix
    theta: 0,
    distance: 11,
    fov: 45,
  });
}

export default function DNAHelixExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
