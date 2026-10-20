// Live example component for the "Live matrix transforms in 2D and 3D" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Polygon, Circle, Line, Dot, makeMatrixTracker, applyMatrixLive, BLUE, GREEN, YELLOW } =
    await import('manim-web');

  // Each shape is mapped in its own local frame. The offsets are in the points
  // (polygon vertices, line start and end), not in moveTo, so all the shapes
  // share the scene origin as the pivot and move together like one plane.
  const square = new Polygon({
    vertices: [
      [-4, -1, 0],
      [-2, -1, 0],
      [-2, 1, 0],
      [-4, 1, 0],
    ],
    color: BLUE,
  });
  const circle = new Circle({ radius: 1, color: GREEN });
  const line = new Line({ start: [2, -1, 0], end: [4, 1, 0], color: YELLOW });
  const head = new Polygon({
    vertices: [
      [4, 1, 0],
      [3.4, 0.9, 0],
      [3.9, 0.4, 0],
    ],
    color: YELLOW,
  });
  const dot = new Dot({ point: [0, 2, 0] });
  scene.add(square, circle, line, head, dot);

  // Bind one tracker to all the shapes. The dot is a dependent point: it moves
  // to the image of its base position but keeps its round shape.
  const tracker = makeMatrixTracker();
  const bindings = [square, circle, line, head].map((m) => applyMatrixLive(m, tracker));
  bindings[0].addDependentPoint(dot, [0, 2, 0]);

  // Sweep a shear, then a squash, and back to the identity.
  const frames = 60;
  const keyframes: Array<[[number, number], [number, number]]> = [
    [
      [1, 0],
      [0, 1],
    ],
    [
      [1, 1],
      [0, 1],
    ],
    [
      [1.5, 0],
      [0, 0.5],
    ],
    [
      [1, 0],
      [0, 1],
    ],
  ];
  for (let k = 0; k + 1 < keyframes.length; k++) {
    const from = keyframes[k];
    const to = keyframes[k + 1];
    for (let i = 1; i <= frames; i++) {
      const t = i / frames;
      tracker.setMatrix([
        [from[0][0] + (to[0][0] - from[0][0]) * t, from[0][1] + (to[0][1] - from[0][1]) * t],
        [from[1][0] + (to[1][0] - from[1][0]) * t, from[1][1] + (to[1][1] - from[1][1]) * t],
      ]);
      bindings.forEach((b) => b.update());
      scene.render();
      await new Promise((resolve) => setTimeout(resolve, 33));
    }
  }
}

export default function ApplyMatrixLive2DExample() {
  return <ManimExample animationFn={animate} />;
}
