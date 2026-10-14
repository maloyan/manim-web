// Live example component for the "New in 0.27 and 0.28" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Square, Circle, VGroup, sketch, Create } = await import('manim-web');

  // Build a crisp shape, then sketch() returns a hand-drawn copy. The source is
  // never changed; a fixed seed reproduces the same wobble. One stroke keeps a
  // single rough outline (strokes: 2 overlays a second line for a sketchier look).
  const square = new Square({ sideLength: 2.4, color: '#58c4dd', strokeWidth: 3 });
  square.shift([-2, 0, 0]);
  const circle = new Circle({ radius: 1.2, color: '#ffd166', strokeWidth: 3 });
  circle.shift([2, 0, 0]);
  const shapes = new VGroup(square, circle);

  const rough = sketch(shapes, { roughness: 1.5, bowing: 1.5, strokes: 1, seed: 7 });

  await scene.play(new Create(rough, { duration: 2 }));
  await scene.wait(999999);
}

export default function SketchExample() {
  return <ManimExample animationFn={animate} />;
}
