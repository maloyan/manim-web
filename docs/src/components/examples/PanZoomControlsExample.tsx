// Live example component for the "New in 0.20, 0.21, and 0.22" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { NumberPlane, Dot, Text, VGroup, PanZoomControls } = await import('manim-web');

  const plane = new NumberPlane();
  scene.add(plane);

  // A few labeled points to explore once you zoom in.
  const markers = new VGroup();
  const points: Array<[number, number, string]> = [
    [-3, 1, 'A'],
    [2, 2, 'B'],
    [1, -2, 'C'],
    [4, -1, 'D'],
  ];
  for (const [x, y, name] of points) {
    const dot = new Dot({ point: [x, y, 0], color: '#ff3366', radius: 0.08 });
    const label = new Text({ text: name, fontSize: 28 });
    label.moveTo([x + 0.35, y + 0.35, 0]);
    markers.add(dot);
    markers.add(label);
  }
  scene.add(markers);

  // PanZoomControls drives the scene's 2D camera from the mouse. onChange
  // re-renders after each pan or zoom (the static scene does not redraw on
  // its own). Scroll to zoom to the cursor, drag to pan.
  const controls = new PanZoomControls(scene.camera, scene.getCanvas(), {
    onChange: () => {
      try {
        scene.render();
      } catch {
        /* scene disposed while a pan was in flight */
      }
    },
  });

  // wait(999999) resolves only when the scene is disposed; dispose the
  // controls then so their window listeners are removed.
  await scene.wait(999999);
  controls.dispose();
}

export default function PanZoomControlsExample() {
  return <ManimExample animationFn={animate} />;
}
