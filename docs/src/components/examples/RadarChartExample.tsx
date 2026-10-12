// Live example component for the "New in 0.26" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { RadarChart, Create } = await import('manim-web');

  // Two series overlaid on five shared axes. Each value plots at a radius
  // proportional to the value along its axis; the points close into a polygon.
  const chart = new RadarChart({
    data: [
      [4, 2, 5, 1, 3],
      [1, 5, 2, 4, 2],
    ],
    categories: ['Speed', 'Power', 'Range', 'Cost', 'Weight'],
    radius: 2.6,
    seriesColors: ['#58c4dd', '#fc6255'],
  });

  await scene.play(new Create(chart, { duration: 1.5 }));
  await scene.wait(999999);
}

export default function RadarChartExample() {
  return <ManimExample animationFn={animate} />;
}
