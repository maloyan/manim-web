// Live example for WritingPen and writeWithPen.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Circle, Square, WritingPen, writeWithPen, BLUE, YELLOW } = await import('manim-web');

  const circle = new Circle({ radius: 1.2, color: BLUE });
  circle.moveTo([-2.5, 0, 0]);
  const square = new Square({ sideLength: 2.2, color: YELLOW });
  square.moveTo([2.5, 0, 0]);

  // The default pen is a vector nib. scene.play() adds the pen and removes it
  // at the end of the animation.
  await scene.play(writeWithPen(circle, { duration: 2.5 }));

  // Use Create instead of Write, and a custom pen.
  const pen = new WritingPen({ color: YELLOW, length: 1 });
  await scene.play(writeWithPen(square, { animation: 'create', duration: 2.5, pen }));
  await scene.wait(999999);
}

export default function WritingPenExample() {
  return <ManimExample animationFn={animate} />;
}
