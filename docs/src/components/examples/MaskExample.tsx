// Live example component for the "New Features" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { VGroup, Rectangle, Circle, RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE } =
    await import('manim-web');

  // Colorful content: six tall rainbow bars that fill the frame.
  const colors = [RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE];
  const barWidth = 1.7;
  const bars = new VGroup();
  colors.forEach((color, i) => {
    const bar = new Rectangle({
      width: barWidth,
      height: 6,
      color,
      fillOpacity: 1,
      strokeWidth: 0,
    });
    bar.moveTo([(i - (colors.length - 1) / 2) * barWidth, 0, 0]);
    bars.add(bar);
  });

  // The mask shape. Only the part of the bars inside this circle is drawn.
  // The circle itself is never visible; it is consumed as a matte.
  const mask = new Circle({ radius: 1.5 });
  mask.moveTo([-6, 0, 0]);

  // Opt-in clip. The clip updates every frame, so moving the circle re-reveals
  // a different slice of the bars live.
  bars.setMask(mask);
  scene.add(bars);

  // Sweep the circle across to reveal the bars, then sweep it back.
  await scene.play(mask.animate.shift([12, 0, 0]).withDuration(2.5));
  await scene.play(mask.animate.shift([-12, 0, 0]).withDuration(2.5));
  await scene.wait(999999);
}

export default function MaskExample() {
  return <ManimExample animationFn={animate} />;
}
