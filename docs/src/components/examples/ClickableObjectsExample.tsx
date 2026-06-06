// Hand-written companion to examples/clickable_objects.ts (not generated).
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
    Circle,
    Square,
    Text,
    makeClickable,
    makeDraggable,
    BLUE,
    GREEN,
    YELLOW,
    RED,
    PURPLE,
    ORANGE,
    TEAL,
    PINK,
    WHITE,
  } = await import('manim-web');

  const PALETTE = [BLUE, GREEN, YELLOW, RED, PURPLE, ORANGE, TEAL, PINK];

  const title = new Text({
    text: 'Click the circle  •  Drag the square',
    fontSize: 26,
    color: WHITE,
  });
  title.moveTo([0, 2.8, 0]);

  // Clickable: a discrete tap action — the circle never moves.
  let colorIndex = 0;
  let clickCount = 0;
  const circle = new Circle({ radius: 0.7, color: BLUE, fillOpacity: 0.9 });
  circle.moveTo([-2.5, 0.3, 0]);
  const counter = new Text({ text: 'Clicks: 0', fontSize: 22, color: WHITE });
  counter.moveTo([-2.5, -1.6, 0]);

  // Draggable: a continuous gesture that repositions the square.
  const square = new Square({ sideLength: 1.3, color: GREEN, fillOpacity: 0.9 });
  square.moveTo([2.5, 0.3, 0]);
  const posLabel = new Text({ text: 'Square: (2.5, 0.3)', fontSize: 22, color: WHITE });
  posLabel.moveTo([2.5, -1.6, 0]);

  const hint = new Text({
    text: 'Double-click the circle to reset',
    fontSize: 18,
    color: '#888888',
  });
  hint.moveTo([0, -2.8, 0]);

  scene.add(title, circle, counter, square, posLabel, hint);

  // Click cycles color + bumps the counter; double-click resets (idempotent
  // because browsers fire `click` before `dblclick`).
  // This scene has no animation loop, so interaction callbacks must call
  // scene.render() to repaint after they mutate a mobject.
  const clickable = makeClickable(circle, scene, {
    onClick: () => {
      clickCount += 1;
      colorIndex = (colorIndex + 1) % PALETTE.length;
      circle.setColor(PALETTE[colorIndex]);
      counter.setText(`Clicks: ${clickCount}`);
      scene.render();
    },
    onDoubleClick: () => {
      clickCount = 0;
      colorIndex = 0;
      circle.setColor(BLUE);
      counter.setText('Clicks: 0');
      scene.render();
    },
  });

  const draggable = makeDraggable(square, scene, {
    onDrag: (_mobject: any, position: [number, number, number]) => {
      posLabel.setText(`Square: (${position[0].toFixed(1)}, ${position[1].toFixed(1)})`);
      scene.render();
    },
  });

  try {
    // Keep the demo interactive for a while before the loop replays.
    await scene.wait(60);
  } finally {
    // Dispose handles so canvas/window listeners don't accumulate across loops.
    clickable.dispose();
    draggable.dispose();
  }
}

export default function ClickableObjectsExample() {
  return <ManimExample animationFn={animate} />;
}
