// Live example component for the "New in 0.20, 0.21, and 0.22" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { DonutChart } = await import('manim-web');

  // A DonutChart is a PieChart with a hole. innerRadius is a fraction of the
  // outer radius, in [0, 1).
  const donut = new DonutChart({
    values: [30, 20, 25, 15, 10],
    labels: ['A', 'B', 'C', 'D', 'E'],
    innerRadius: 0.55,
    showPercentages: true,
    radius: 2.1,
    labelFontSize: 34,
  });

  scene.add(donut);
  await scene.wait(999999);
}

export default function DonutChartExample() {
  return <ManimExample animationFn={animate} />;
}
