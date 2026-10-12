// Live example component for the "New in 0.26" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

// Build about four months of daily values with a deterministic pattern, so the
// chart renders the same GitHub-style contribution grid on every run.
function buildData(): { date: string; value: number }[] {
  const data: { date: string; value: number }[] = [];
  const start = new Date(Date.UTC(2024, 0, 1));
  for (let day = 0; day < 120; day++) {
    const date = new Date(start.getTime() + day * 86400000);
    const wobble = Math.sin(day * 0.7) * Math.cos(day * 0.11);
    const value = Math.max(0, Math.round((wobble + 1) * 3));
    data.push({ date: date.toISOString().slice(0, 10), value });
  }
  return data;
}

async function animate(scene: any) {
  const { CalendarHeatmap, FadeIn } = await import('manim-web');

  // Each day is a cell colored by its value across the GitHub green palette.
  const heatmap = new CalendarHeatmap({
    data: buildData(),
    cellSize: 0.32,
  });
  heatmap.center();

  await scene.play(new FadeIn(heatmap, { duration: 1 }));
  await scene.wait(999999);
}

export default function CalendarHeatmapExample() {
  return <ManimExample animationFn={animate} />;
}
