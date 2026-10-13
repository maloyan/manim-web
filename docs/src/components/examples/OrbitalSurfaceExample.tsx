// Live example for the 0.38 OrbitalSurface mobject: a single p-orbital (pz),
// the two-lobe dumbbell with one positive phase and one negative phase in two
// colors. It extends Group, so it lives in a ThreeDScene. The lobes fade in
// with FadeIn, then a gentle ambient rotation turns the dumbbell so its 3D
// shape reads. orbitControlsUp 'z' keeps the dumbbell upright while it spins.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { OrbitalSurface, FadeIn } = await import('manim-web');

  // A pz orbital: two lobes along z, red (positive) over blue (negative).
  // scale 2 widens the lobes so the dumbbell fills the frame.
  const orbital = new OrbitalSurface({ type: 'pz', scale: 2 });
  scene.add(orbital);
  await scene.play(new FadeIn(orbital, { duration: 1.5 }));

  // Spin slowly so both lobes and the waist between them read as 3D.
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
    distance: 10,
    orbitControlsUp: 'z',
  });
}

export default function OrbitalSurfaceExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
