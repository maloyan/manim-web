// Live example component for the "New in 0.13, 0.14 and 0.15" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { NumberPlane, makeMatrixTracker, applyMatrixLive } = await import('manim-web');

  const plane = new NumberPlane({ xRange: [-6, 6, 1], yRange: [-4, 4, 1] });
  scene.add(plane);

  // Bind the grid to a 2x2 matrix tracker. The columns are the images of the
  // basis vectors, so the whole grid follows the live matrix.
  const tracker = makeMatrixTracker();
  const binding = applyMatrixLive(plane, tracker, { onChange: () => scene.render() });

  // Drive a continuous rotation from 0 to 90 degrees.
  const frames = 90;
  for (let i = 1; i <= frames; i++) {
    const angle = (i / frames) * (Math.PI / 2);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    tracker.setMatrix([
      [cos, -sin],
      [sin, cos],
    ]);
    binding.update();
    scene.render();
    await new Promise((resolve) => setTimeout(resolve, 33));
  }
}

export default function MatrixLiveExample() {
  return <ManimExample animationFn={animate} />;
}
