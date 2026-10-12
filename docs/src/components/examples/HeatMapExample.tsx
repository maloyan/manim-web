// Live example component for the "New in 0.16 and 0.17" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { HeatMap } = await import('manim-web');

  // Two Gaussian bumps colored with the viridis palette.
  const heat = new HeatMap({
    func: (x: number, y: number) =>
      Math.exp(-((x - 1.3) ** 2 + (y - 1.3) ** 2) / 2) +
      Math.exp(-((x + 1.3) ** 2 + (y + 1.3) ** 2) / 1.5),
    xRange: [-4, 4],
    yRange: [-4, 4],
    resolution: 96,
    domain: [0, 1],
    useOklab: true,
  });
  heat.scale(1.6);

  scene.add(heat);
  await scene.wait(999999);
}

// The HeatMap mesh lives in the z = 0 plane, so view it from straight above.
function createScene(container: HTMLElement, manim: any) {
  return new manim.ThreeDScene(container, {
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    phi: 0,
    theta: -90 * (Math.PI / 180),
    distance: 14,
    fov: 45,
    orbitControlsUp: 'z',
  });
}

export default function HeatMapExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
