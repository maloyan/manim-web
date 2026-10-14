// Live example component for the "New in 0.11 and 0.12" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Circle, GrowFromCenter, RED, GREEN, BLUE } = await import('manim-web');

  // No stroke, so each circle reads as a solid disc. A stroked outline beads
  // into dots under a brightening blend, because the thick-line segments
  // double-count where they meet.
  const red = new Circle({ radius: 1.4, color: RED, fillOpacity: 0.9, strokeWidth: 0 });
  red.moveTo([-0.8, 0.5, 0]);

  const green = new Circle({ radius: 1.4, color: GREEN, fillOpacity: 0.9, strokeWidth: 0 });
  green.moveTo([0.8, 0.5, 0]);

  const blue = new Circle({ radius: 1.4, color: BLUE, fillOpacity: 0.9, strokeWidth: 0 });
  blue.moveTo([0, -0.8, 0]);

  // Screen blending lightens where colors overlap, so each pair blends to a
  // clear new tint (red+green to yellow, green+blue to cyan) instead of washing
  // out to flat white.
  for (const circle of [red, green, blue]) {
    circle.setBlendMode('screen');
  }

  await scene.play(new GrowFromCenter(red, { duration: 0.8 }));
  await scene.play(new GrowFromCenter(green, { duration: 0.8 }));
  await scene.play(new GrowFromCenter(blue, { duration: 0.8 }));
}

export default function BlendModeThemeExample() {
  return <ManimExample animationFn={animate} />;
}
