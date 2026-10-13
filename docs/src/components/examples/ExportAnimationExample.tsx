// Hand-maintained (see HAND_MAINTAINED_STEMS in scripts/generate-example-docs.mjs).
// The export demo's source is button-driven; this is a self-contained auto-playing
// version of the same animation so it runs inside the docs <ManimExample> wrapper.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Circle, Square, Create, Transform, FadeOut, BLUE, GREEN } = await import('manim-web');

  // The export demo plays the same three animations that its Play and Export
  // buttons share. Build them against a fresh scene — animations are stateful
  // (begin() snapshots opacities), so reusing instances replays stale state.
  const square = new Square({ sideLength: 2.5, color: BLUE, fillOpacity: 0.5 });
  const circle = new Circle({ radius: 1.25, color: GREEN, fillOpacity: 0.5 });

  await scene.play(new Create(square, { duration: 1 }));
  await scene.play(new Transform(square, circle, { duration: 1 }));
  await scene.play(new FadeOut(square, { duration: 1 }));

  await scene.wait(999999);
}

export default function ExportAnimationExample() {
  return <ManimExample animationFn={animate} />;
}
