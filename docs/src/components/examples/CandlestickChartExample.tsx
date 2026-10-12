// Live example component for the "New in 0.23, 0.24, and 0.25" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { CandlestickChart, Create } = await import('manim-web');

  // Each period is one open/high/low/close bar. Bullish periods (close >= open)
  // and bearish periods (close < open) use separate colors. Volume bars render
  // below when showVolume is set.
  const chart = new CandlestickChart({
    data: [
      { open: 10, high: 15, low: 8, close: 14, date: 'Mon', volume: 120 },
      { open: 14, high: 16, low: 11, close: 12, date: 'Tue', volume: 90 },
      { open: 12, high: 13, low: 9, close: 13, date: 'Wed', volume: 140 },
      { open: 13, high: 18, low: 12, close: 17, date: 'Thu', volume: 200 },
      { open: 17, high: 17, low: 13, close: 14, date: 'Fri', volume: 110 },
    ],
    showVolume: true,
    width: 8,
    height: 4.2,
  });

  await scene.play(new Create(chart, { duration: 2 }));
}

export default function CandlestickChartExample() {
  return <ManimExample animationFn={animate} />;
}
