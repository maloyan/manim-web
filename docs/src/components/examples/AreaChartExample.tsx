// Live example component for the "New in 0.26" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { AreaChart, FadeIn } = await import('manim-web');

  // Two stacked series. Each becomes a semi-transparent fill from its line down
  // to the band below it, plus the top line.
  const chart = new AreaChart({
    values: [
      [1, 3, 2, 5, 4, 6],
      [2, 1, 4, 3, 5, 3],
    ],
    stacked: true,
    seriesNames: ['Reads', 'Writes'],
    xLength: 9,
    yLength: 5,
  });
  chart.center();

  // FadeIn brings the axes, stacked areas and legend up together, so the chart
  // reveals coherently (Create would pop the large area fills instead of
  // fading them, since its stroke-reveal does not drive polygon fill opacity).
  await scene.play(new FadeIn(chart, { duration: 1 }));
  await scene.wait(999999);
}

export default function AreaChartExample() {
  return <ManimExample animationFn={animate} />;
}
