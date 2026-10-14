// Live example component for the "New in 0.26" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { StepChart, Create } = await import('manim-web');

  // A line graph drawn as horizontal/vertical steps. Each value holds across
  // an interval, then jumps at the next x (stepMode 'after').
  const chart = new StepChart({
    values: [
      [0, 2, 2, 5, 3, 4],
      [1, 1, 3, 3, 2, 5],
    ],
    stepMode: 'after',
    showDots: true,
    xLength: 9,
    yLength: 5,
  });
  chart.center();

  // lagRatio 0 reveals the axes and steps together for a coherent draw-on.
  await scene.play(new Create(chart, { duration: 1.5, lagRatio: 0 }));
  await scene.wait(999999);
}

export default function StepChartExample() {
  return <ManimExample animationFn={animate} />;
}
