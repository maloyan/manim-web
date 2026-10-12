// Live example component for the "New in 0.26" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { StackedBarChart, FadeIn } = await import('manim-web');

  // Two series across three categories, stacked so each series sits on the
  // cumulative sum of the series below it.
  const chart = new StackedBarChart({
    values: [
      [3, 7, 2],
      [5, 4, 6],
    ],
    mode: 'stacked',
    xLabels: ['Q1', 'Q2', 'Q3'],
    seriesNames: ['2023', '2024'],
    showLegend: true,
    height: 5,
    width: 8,
  });
  chart.center();

  await scene.play(new FadeIn(chart, { duration: 1 }));
  await scene.wait(999999);
}

export default function StackedBarChartExample() {
  return <ManimExample animationFn={animate} />;
}
