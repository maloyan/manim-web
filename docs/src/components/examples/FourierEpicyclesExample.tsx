// Live example component for the "New in 0.23, 0.24, and 0.25" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { FourierEpicycles } = await import('manim-web');

  // Sample the outline of a square as [x, y] points. FourierEpicycles reads
  // each point as the complex number x + i*y and fits a chain of rotating
  // vectors whose tip-to-tail sum tracks the path.
  const path: number[][] = [];
  const perSide = 64;
  const corners = [
    [-1.6, -1.6],
    [1.6, -1.6],
    [1.6, 1.6],
    [-1.6, 1.6],
  ];
  for (let c = 0; c < 4; c++) {
    const [ax, ay] = corners[c];
    const [bx, by] = corners[(c + 1) % 4];
    for (let i = 0; i < perSide; i++) {
      const t = i / perSide;
      path.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
    }
  }

  // animate defaults to true, so an updater advances the chain each frame and
  // extends the traced curve. scene.wait() ticks that updater.
  const epicycles = new FourierEpicycles({
    path,
    numTerms: 40,
    speed: 0.15,
    traceColor: '#ffff00',
    color: '#58c4dd',
  });

  scene.add(epicycles);
  await scene.wait(999999);
}

export default function FourierEpicyclesExample() {
  return <ManimExample animationFn={animate} />;
}
