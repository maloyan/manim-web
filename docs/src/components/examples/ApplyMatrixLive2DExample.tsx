// Live example component for the "Live matrix transforms in 2D and 3D" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Square, Circle, Arrow, Dot, makeMatrixTracker, applyMatrixLive, BLUE, GREEN, YELLOW } =
    await import('manim-web');

  const square = new Square({ sideLength: 2, color: BLUE }).moveTo([-3, 0, 0]);
  const circle = new Circle({ radius: 1, color: GREEN });
  const arrow = new Arrow({ start: [2, -1, 0], end: [4, 1, 0], color: YELLOW });
  const dot = new Dot({ point: [0, 2, 0] });
  scene.add(square, circle, arrow, dot);

  // Bind one tracker to three shapes. The dot is a dependent point: it moves
  // to the image of its base position but keeps its round shape.
  const tracker = makeMatrixTracker();
  const bindings = [square, circle, arrow].map((m) => applyMatrixLive(m, tracker));
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
