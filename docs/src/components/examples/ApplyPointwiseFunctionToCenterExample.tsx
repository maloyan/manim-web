import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Circle, Square, Triangle, FadeIn, ApplyPointwiseFunctionToCenter, BLUE, GREEN_C, RED_C } =
    await import('manim-web');

  // Create three shapes at different positions
  const circle = new Circle({ radius: 0.8, color: BLUE });
  circle.moveTo([-3, 0, 0]);

  const square = new Square({ sideLength: 1.4, color: GREEN_C });
  square.moveTo([0, 0, 0]);

  const triangle = new Triangle({ color: RED_C });
  triangle.scale(0.8);
  triangle.moveTo([3, 0, 0]);

  scene.add(circle, square, triangle);
  await scene.play(
    new FadeIn(circle, { duration: 0.8 }),
    new FadeIn(square, { duration: 0.8 }),
    new FadeIn(triangle, { duration: 0.8 }),
  );
  await scene.wait(0.5);

  // Scale each shape by 1.5x around its own center
  const scaleFn = (p: number[]) => [p[0] * 1.5, p[1] * 1.5, p[2]];
  await scene.play(
    new ApplyPointwiseFunctionToCenter(circle, scaleFn, { duration: 2 }),
    new ApplyPointwiseFunctionToCenter(square, scaleFn, { duration: 2 }),
    new ApplyPointwiseFunctionToCenter(triangle, scaleFn, { duration: 2 }),
  );
  await scene.wait(1);
}

export default function ApplyPointwiseFunctionToCenterExample() {
  return <ManimExample animationFn={animate} />;
}
