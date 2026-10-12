// Live example component for the "New in 0.20, 0.21, and 0.22" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { ParticleSystem } = await import('manim-web');

  // A seeded fountain: particles emit upward, gravity pulls them back down,
  // and each particle fades from gold to pink over its lifetime. The emitter
  // runs through an updater, so scene.wait() ticks the simulation each frame.
  const fountain = new ParticleSystem({
    spawnRate: 120,
    maxParticles: 600,
    lifetime: 2.2,
    lifetimeSpread: 0.4,
    position: [0, -2.6, 0],
    velocity: [0, 6, 0],
    velocitySpread: [2.2, 1.2, 0],
    forces: { gravity: [0, -9.8, 0] },
    startSize: 10,
    endSize: 0,
    startColor: '#ffd166',
    endColor: '#ef476f',
    useOklab: true,
    seed: 7,
  });

  scene.add(fountain);
  await scene.wait(999999);
}

export default function ParticleSystemExample() {
  return <ManimExample animationFn={animate} />;
}
