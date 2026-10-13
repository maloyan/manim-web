// Live example component for the "New in 0.16 and 0.17" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { ImplicitSurface, ThreeDAxes } = await import('manim-web');

  const axes = new ThreeDAxes({
    xRange: [-3, 3, 1],
    yRange: [-3, 3, 1],
    zRange: [-3, 3, 1],
    axisColor: '#888888',
  });

  // A torus as the level set of an implicit scalar field f(x, y, z) = 0.2.
  const torus = new ImplicitSurface({
    func: (x: number, y: number, z: number) => {
      const q = Math.sqrt(x * x + y * y) - 1.3;
      return q * q + z * z;
    },
    isoLevel: 0.2,
    xRange: [-2.5, 2.5],
    yRange: [-2.5, 2.5],
    zRange: [-1.5, 1.5],
    resolution: 40,
    color: '#d147bd',
    opacity: 0.85,
  });

  scene.add(axes, torus);
  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any) {
  return new manim.ThreeDScene(container, {
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    phi: 70 * (Math.PI / 180),
    theta: -45 * (Math.PI / 180),
    distance: 12,
    fov: 40,
    orbitControlsUp: 'z',
  });
}

export default function IsosurfaceExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
