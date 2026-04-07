import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { ConvexHull3D, GREEN_C } = await import('manim-web');

  const points: [number, number, number][] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0.5, 0.5, 0.5],
    [-0.5, -0.5, 0.5],
  ];

  const hull = new ConvexHull3D({
    points,
    color: GREEN_C,
    opacity: 0.7,
    wireframe: true,
  });

  scene.add(hull);
  await scene.wait(5);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 60 * (Math.PI / 180),
    theta: -45 * (Math.PI / 180),
    distance: 8,
    fov: 40,
  });
}

export default function ConvexHull3DExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
