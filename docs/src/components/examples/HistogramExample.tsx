// Live example component for the "New in 0.23, 0.24, and 0.25" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Histogram, Create } = await import('manim-web');

  // A rough bell of samples binned into 12 bars. density plots the probability
  // density; drop it to plot raw counts. When no axes are given, one is built
  // to fit the bins.
  const data: number[] = [];
  for (let i = 0; i < 400; i++) {
    const u = (Math.random() + Math.random() + Math.random() + Math.random()) / 4;
    data.push((u - 0.5) * 10);
  }

  const hist = new Histogram({
    data,
    bins: 12,
    density: true,
    color: '#58c4dd',
    xLength: 8,
    yLength: 4.6,
  });

  await scene.play(new Create(hist, { duration: 1.5 }));
}

export default function HistogramExample() {
  return <ManimExample animationFn={animate} />;
}
