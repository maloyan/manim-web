// Live example component for the "New in 0.13, 0.14 and 0.15" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Square, Text, Transform, spring, steps, BLUE, YELLOW, WHITE } = await import('manim-web');

  // Top row: a bouncy spring rate function overshoots, then settles.
  const springStart = new Square({ sideLength: 1, color: BLUE, fillOpacity: 0.85 });
  springStart.moveTo([-4.5, 1.4, 0]);
  const springEnd = new Square({ sideLength: 1, color: BLUE, fillOpacity: 0.85 });
  springEnd.moveTo([4.5, 1.4, 0]);

  // Bottom row: a five-step staircase easing jumps in discrete steps.
  const stepStart = new Square({ sideLength: 1, color: YELLOW, fillOpacity: 0.85 });
  stepStart.moveTo([-4.5, -1.4, 0]);
  const stepEnd = new Square({ sideLength: 1, color: YELLOW, fillOpacity: 0.85 });
  stepEnd.moveTo([4.5, -1.4, 0]);

  const springLabel = new Text({ text: 'spring({ bounce: 0.5 })', fontSize: 20, color: WHITE });
  springLabel.moveTo([0, 2.7, 0]);
  const stepLabel = new Text({ text: 'steps(5)', fontSize: 20, color: WHITE });
  stepLabel.moveTo([0, -2.7, 0]);

  scene.add(springStart, stepStart, springLabel, stepLabel);

  await scene.play(
    new Transform(springStart, springEnd, { duration: 2.5, rateFunc: spring({ bounce: 0.5 }) }),
    new Transform(stepStart, stepEnd, { duration: 2.5, rateFunc: steps(5) }),
  );
}

export default function SpringEasingExample() {
  return <ManimExample animationFn={animate} />;
}
