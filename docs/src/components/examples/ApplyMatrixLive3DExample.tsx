// Live example component for the "Live matrix transforms in 2D and 3D" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { ThreeDAxes, Cube, Sphere, Group, MatrixTracker, applyMatrixLive, BLUE, RED } =
    await import('manim-web');

  const axes = new ThreeDAxes({ xRange: [-4, 4, 1], yRange: [-4, 4, 1], zRange: [-3, 3, 1] });
  const cube = new Cube({ sideLength: 1.5, center: [-1.5, 0, 0.75], color: BLUE, opacity: 0.8 });
  const sphere = new Sphere({ radius: 0.8, center: [1.5, 0, 0.8], color: RED, opacity: 0.8 });
  const shapes = new Group();
  shapes.add(cube);
  shapes.add(sphere);
  scene.add(axes, shapes);

  // A 3x3 tracker. Its columns are the images of the x, y and z basis vectors.
  const tracker = new MatrixTracker([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);
  const binding = applyMatrixLive(shapes, tracker);

  // Shear z into x (the shapes lean over), then stretch z, then go back.
  const frames = 60;
  const step = async (matrixAt: (t: number) => number[][]) => {
    for (let i = 1; i <= frames; i++) {
      tracker.setMatrix(matrixAt(i / frames));
      binding.update();
      scene.render();
      await new Promise((resolve) => setTimeout(resolve, 33));
    }
  };
  await step((t) => [
    [1, 0, t],
    [0, 1, 0],
    [0, 0, 1],
  ]);
  await step((t) => [
    [1, 0, 1],
    [0, 1, 0],
    [0, 0, 1 + t],
  ]);
  await step((t) => [
    [1, 0, 1 - t],
    [0, 1, 0],
    [0, 0, 2 - t],
  ]);
}

function createScene(container: HTMLElement, manim: any) {
  return new manim.ThreeDScene(container, {
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    phi: 70 * (Math.PI / 180),
    theta: -60 * (Math.PI / 180),
    distance: 18,
    fov: 30,
  });
}

export default function ApplyMatrixLive3DExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
