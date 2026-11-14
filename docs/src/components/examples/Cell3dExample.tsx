// Hand-maintained (see HAND_MAINTAINED_STEMS in scripts/generate-example-docs.mjs).
// The same build-up and tour as examples/cell_3d.ts, without its URL options
// and its Play button, so it runs inside the docs <ManimExample> loop.
import React from 'react';
import ManimExample from '../ManimExample';

const START = { phi: 0.92, theta: -1.2, distance: 18.5 };

async function animate(scene: any) {
  const { Cell3D, CellTour } = await import('manim-web');

  scene.setCameraOrientation(START.phi, START.theta, START.distance);

  const cell = new Cell3D({ radius: 4, preset: 'animal', detail: 'medium', seed: 3 });
  scene.add(cell);

  // One organelle (or one crowd of a kind) at a time, membrane first.
  await scene.play(cell.buildAnimation({ duration: 12 }));
  await scene.wait(0.5);

  // Each organelle carries its own caption and framing; a callout names an
  // anchor of the organelle. CellTour also clears the free ribosomes in front
  // of each focused organelle.
  const tour = new CellTour(scene, cell);
  await tour.run([
    {
      target: cell.getOrganelle('nucleus'),
      callouts: [{ label: 'nuclear pore', anchor: 'pore', direction: [1, 0.7] }],
      hold: 1.5,
    },
    {
      target: cell.getOrganelle('golgi apparatus'),
      callouts: [{ label: 'entry side', anchor: 'entrySide', direction: [-1, 0.7] }],
      hold: 1.5,
    },
    {
      target: cell.getOrganelle('mitochondrion'),
      callouts: [{ label: 'cristae', anchor: 'cristae', direction: [1, 0.8] }],
      hold: 1.5,
    },
  ]);
  await tour.finish();
  await scene.focusOn([0, 0, 0], { ...START, runTime: 2 });
  tour.dispose();
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  const scene = new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    frameWidth: 14 * (dims.width / dims.height),
    frameHeight: 14,
    backgroundColor: '#11131A',
    phi: START.phi,
    theta: START.theta,
    distance: START.distance,
    fov: 30,
  });
  scene.lighting.addAmbient({ intensity: 0.55 });
  return scene;
}

export default function Cell3dExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
