// Live example component for the "New in 0.20, 0.21, and 0.22" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { PieChart } = await import('manim-web');

  // One slice per positive value, sized by value / total. showPercentages
  // appends the rounded percentage to each label.
  const pie = new PieChart({
    values: [35, 25, 20, 15, 5],
    labels: ['Rust', 'TS', 'Python', 'Go', 'Other'],
    showPercentages: true,
    radius: 2.1,
    labelFontSize: 34,
  });

  scene.add(pie);
  await scene.wait(999999);
}

export default function PieChartExample() {
  return <ManimExample animationFn={animate} />;
}
