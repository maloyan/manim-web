import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { NumberPlane, Create, ApplyComplexFunction, BLACK } = await import('manim-web');

  // Create a number plane grid
  const grid = new NumberPlane();
  grid.prepareForNonlinearTransform();
  scene.add(grid);
  await scene.play(new Create(grid, { duration: 2, lagRatio: 0.1 }));
  await scene.wait(0.5);

  // Apply z => z^2: squares every complex number
  // This maps the grid non-linearly, bending lines into parabolic curves
  await scene.play(
    new ApplyComplexFunction(grid, {
      func: (z: { re: number; im: number }) => ({
        re: z.re * z.re - z.im * z.im,
        im: 2 * z.re * z.im,
      }),
      duration: 3,
    }),
  );
  await scene.wait(1);
}

export default function ApplyComplexFunctionExample() {
  return <ManimExample animationFn={animate} />;
}
