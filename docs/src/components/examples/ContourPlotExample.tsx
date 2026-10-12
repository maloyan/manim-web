// Live example component for the "New in 0.16 and 0.17" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { ContourPlot, Create } = await import('manim-web');

  // Iso-contours of a saddle field g(x, y) = x^2 - y^2.
  const contours = new ContourPlot({
    func: (x: number, y: number) => x * x - y * y,
    levels: [-4, -2, -1, 0, 1, 2, 4],
    xRange: [-4, 4],
    yRange: [-4, 4],
    resolution: 64,
    color: '#58c4dd',
    strokeWidth: 3,
  });

  await scene.play(new Create(contours, { duration: 2.5 }));
}

export default function ContourPlotExample() {
  return <ManimExample animationFn={animate} />;
}
