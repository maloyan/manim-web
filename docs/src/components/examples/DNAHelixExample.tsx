// Live example for the 0.33 biology mobject DNAHelix, shown as a true 3D
// double helix so the two backbone strands read as separate parts.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { DNAHelix, Create } = await import('manim-web');

  // threeD winds the two backbones around the vertical axis (Z in a
  // ThreeDScene), so the strands read as two separate helices standing
  // upright, with the base-pair rungs crossing the interior and a colored
  // nucleotide sphere where each rung meets a strand. The rungs are colored by
  // base with the A/T/G/C palette; the second strand is the complement.
  const dna = new DNAHelix({
    threeD: true,
    turns: 4,
    basePairs: 14,
    pitch: 1.5,
    radius: 1.1,
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
    // The helix axis is Z (the ThreeDScene is Z-up), so a slightly top-down,
    // three-quarter view stands it upright and shows the 3D winding.
    phi: 72 * (Math.PI / 180),
    theta: -45 * (Math.PI / 180),
    distance: 13,
    fov: 45,
  });
}

export default function DNAHelixExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
