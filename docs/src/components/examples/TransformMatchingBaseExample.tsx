import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Circle, Square, RegularPolygon, Create, Transform, FadeIn, BLUE, RED, GREEN, YELLOW } =
    await import('manim-web');

  // Create shapes
  const circle = new Circle({ radius: 1, color: BLUE, fillOpacity: 0.5 });
  circle.moveTo([-2, 0, 0]);

  const square = new Square({ sideLength: 1.5, color: RED, fillOpacity: 0.5 });
  square.moveTo([0, 0, 0]);

  const triangle = new RegularPolygon({ numSides: 3, radius: 0.8, color: GREEN, fillOpacity: 0.5 });
  triangle.moveTo([2, 0, 0]);

  await scene.play(new Create(circle, { duration: 0.8 }));
  await scene.play(new Create(square, { duration: 0.8 }));
  await scene.play(new Create(triangle, { duration: 0.8 }));
  await scene.wait(0.3);

  // Transform each shape
  const circle2 = new Circle({ radius: 0.7, color: YELLOW, fillOpacity: 0.5 });
  circle2.moveTo([2, 1, 0]);

  const square2 = new Square({ sideLength: 1.2, color: GREEN, fillOpacity: 0.5 });
  square2.moveTo([0, -0.5, 0]);

  const triangle2 = new RegularPolygon({ numSides: 3, radius: 0.5, color: BLUE, fillOpacity: 0.5 });
  triangle2.moveTo([-2, 0.5, 0]);

  await scene.play(new Transform(circle, circle2, { duration: 1.5 }));
  await scene.play(new Transform(square, square2, { duration: 1.5 }));
  await scene.play(new Transform(triangle, triangle2, { duration: 1.5 }));
  await scene.wait(1);
}

export default function TransformMatchingBaseExample() {
  return <ManimExample animationFn={animate} />;
}
