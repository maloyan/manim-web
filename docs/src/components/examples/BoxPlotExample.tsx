// Live example component for the "New in 0.23, 0.24, and 0.25" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { BoxPlot, Create } = await import('manim-web');

  // Three data groups side by side. Each box spans Q1 to Q3 with a median line,
  // whiskers reaching the extremes inside 1.5*IQR, and dots for outliers.
  const box = new BoxPlot({
    data: [
      [4, 5, 6, 6, 7, 7, 8, 9, 10, 22],
      [2, 3, 3, 4, 5, 5, 6, 7, 8],
      [6, 7, 8, 8, 9, 10, 11, 12, 13, -4],
    ],
    orientation: 'vertical',
    colors: ['#58c4dd', '#83c167', '#fc6255'],
    xLength: 8,
    yLength: 4.6,
  });

  await scene.play(new Create(box, { duration: 1.5 }));
}

export default function BoxPlotExample() {
  return <ManimExample animationFn={animate} />;
}
