// Live example component for the "New in 0.18 and 0.19" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

const GRID = 18; // GRID x GRID cubes in one draw call

async function animate(scene: any) {
  const { InstancedMobject } = await import('manim-web');

  // One transform per cube. The default template is a unit box, so a small
  // per-instance scale keeps the cubes apart. A height wave drives both the
  // z offset and the per-instance color.
  const spacing = 0.42;
  const offset = ((GRID - 1) * spacing) / 2;
  const instances = Array.from({ length: GRID * GRID }, (_, idx) => {
    const i = idx % GRID;
    const j = Math.floor(idx / GRID);
    const x = i * spacing - offset;
    const y = j * spacing - offset;
    const wave = Math.sin(x * 1.1) * Math.cos(y * 1.1);
    const hue = Math.round(((wave + 1) / 2) * 280);
    return {
      position: [x, y, wave * 0.6] as [number, number, number],
      scale: 0.26,
      color: `hsl(${hue}, 80%, 60%)`,
    };
  });

  // GRID * GRID instanced cubes (324 here) drawn in a single draw call.
  const cubes = new InstancedMobject({ instances });

  scene.add(cubes);
  await scene.wait(999999);
}

// Instanced cubes live in 3D, so use a ThreeDScene. Drag to orbit.
function createScene(container: HTMLElement, manim: any) {
  return new manim.ThreeDScene(container, {
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    phi: 65 * (Math.PI / 180),
    theta: -50 * (Math.PI / 180),
    distance: 14,
    fov: 45,
    orbitControlsUp: 'z',
  });
}

export default function InstancedCubesExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
