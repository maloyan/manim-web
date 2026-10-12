// Live example component for the "New in 0.27 and 0.28" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { pendulum, Dot, Line } = await import('manim-web');

  const pivot: [number, number] = [0, 2];

  // The pendulum() builder returns a ready PhysicsWorld: a bob body pinned to a
  // fixed pivot by a rigid distance constraint. Pass a bob mobject so it renders.
  const bob = new Dot({ point: [0, 0, 0], radius: 0.18, color: '#fc6255' });
  const world = pendulum({ pivot, length: 3, angle: Math.PI / 2.2, radius: 0.18, bob });

  // A rod from the pivot to the bob, kept in sync by an updater each frame.
  const body = world.getBody(0)!;
  const rod = new Line({ start: [pivot[0], pivot[1], 0], end: [0, 0, 0], color: '#bbbbbb' });
  rod.addUpdater(() => {
    rod.setStart([pivot[0], pivot[1], 0]).setEnd([body.position[0], body.position[1], 0]);
  });

  const anchor = new Dot({ point: [pivot[0], pivot[1], 0], radius: 0.08, color: '#ffffff' });

  // Adding the world to the scene ticks the simulation on every frame.
  scene.add(rod);
  scene.add(anchor);
  scene.add(world);
  await scene.wait(999999);
}

export default function PendulumExample() {
  return <ManimExample animationFn={animate} />;
}
