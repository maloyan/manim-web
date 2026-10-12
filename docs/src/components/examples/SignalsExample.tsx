// Live example component for the "New in 0.29, 0.30 and 0.31" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { createSignal, createComputed, createEffect, Dot } = await import('manim-web');

  // A writable source and a value derived from it. The computed re-runs only
  // when the signal it reads changes.
  const x = createSignal(-3);
  const y = createComputed(() => (x() * x()) / 3 - 1.5); // parabola from x

  // An effect pushes the derived value into the scene: the cursor follows the
  // computed point whenever the signal changes.
  const cursor = new Dot({ radius: 0.14, color: '#58c4dd' });
  createEffect(() => cursor.moveTo([x(), y(), 0]));
  scene.add(cursor);

  // Drive the signal across its range. Each set() recomputes y and moves the
  // cursor; a trail dot marks the derived point.
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    x.set(-3 + (i * 6) / steps);
    const mark = new Dot({ radius: 0.05, color: '#fc6255' });
    mark.moveTo([x(), y(), 0]);
    scene.add(mark);
    await scene.wait(0.04);
  }
  await scene.wait(999999);
}

export default function SignalsExample() {
  return <ManimExample animationFn={animate} />;
}
