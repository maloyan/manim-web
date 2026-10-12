// Live example component for the "New in 0.16 and 0.17" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { StreamLines } = await import('manim-web');

  // A rotational field. 'rk4' traces the curved paths accurately, and the
  // seed makes the flow animation reproducible run to run.
  const streamLines = new StreamLines({
    func: (x: number, y: number) => [-y, x],
    xRange: [-4, 4, 0.5],
    yRange: [-4, 4, 0.5],
    integrator: 'rk4',
    strokeWidth: 3,
    maxAnchorsPerLine: 30,
  });
  scene.add(streamLines);

  streamLines.startAnimation({ warmUp: false, flowSpeed: 1.5, seed: 42 });
  await scene.wait(streamLines.virtualTime / 1.5);
}

export default function StreamLinesRk4Example() {
  return <ManimExample animationFn={animate} />;
}
