// Live example component for the "New in 0.27 and 0.28" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { GanttChart, FadeIn } = await import('manim-web');

  // Each task is a horizontal bar spanning its start to its end on a shared
  // time axis. Dependency arrows point from a predecessor's end to a
  // dependent's start.
  const chart = new GanttChart({
    tasks: [
      { name: 'Research', start: 0, end: 3 },
      { name: 'Design', start: 3, end: 6, dependencies: ['Research'] },
      { name: 'Build', start: 6, end: 11, dependencies: ['Design'] },
      { name: 'Test', start: 9, end: 13, dependencies: ['Build'] },
      { name: 'Launch', start: 13, end: 15, dependencies: ['Test'] },
    ],
    showDependencies: true,
    today: 7,
    width: 9,
  });
  chart.center();

  await scene.play(new FadeIn(chart, { duration: 1 }));
  await scene.wait(999999);
}

export default function GanttChartExample() {
  return <ManimExample animationFn={animate} />;
}
