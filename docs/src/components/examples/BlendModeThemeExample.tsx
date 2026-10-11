// Live example component for the "New in 0.11 and 0.12" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Circle, GrowFromCenter, RED, GREEN, BLUE } = await import('manim-web');

  const red = new Circle({ radius: 1.4, color: RED, fillOpacity: 0.9 });
  red.moveTo([-0.8, 0.5, 0]);

  const green = new Circle({ radius: 1.4, color: GREEN, fillOpacity: 0.9 });
  green.moveTo([0.8, 0.5, 0]);

  const blue = new Circle({ radius: 1.4, color: BLUE, fillOpacity: 0.9 });
  blue.moveTo([0, -0.8, 0]);

  // Additive blending makes the overlaps glow, the way light mixes.
  for (const circle of [red, green, blue]) {
    circle.setBlendMode('additive');
  }

  await scene.play(new GrowFromCenter(red, { duration: 0.8 }));
  await scene.play(new GrowFromCenter(green, { duration: 0.8 }));
  await scene.play(new GrowFromCenter(blue, { duration: 0.8 }));
}

export default function BlendModeThemeExample() {
  return <ManimExample animationFn={animate} />;
}
