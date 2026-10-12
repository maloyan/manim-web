// Live example component for the "New in 0.26" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { WaterfallChart, FadeIn } = await import('manim-web');

  // Sequential contributions, left to right. Each bar starts at the running
  // total of the bars before it. A final total bar spans 0 to the sum.
  const chart = new WaterfallChart({
    values: [1200, 340, -180, 90, -120],
    labels: ['Start', 'Sales', 'Refunds', 'Add-ons', 'Fees'],
    showTotal: true,
    totalLabel: 'Net',
    height: 5,
    width: 9,
  });
  chart.center();

  await scene.play(new FadeIn(chart, { duration: 1 }));
  await scene.wait(999999);
}

export default function WaterfallChartExample() {
  return <ManimExample animationFn={animate} />;
}
