// Live example component for the "New in 0.20, 0.21, and 0.22" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

// KaTeX ships a plain roman font that the docs build can fetch from a CDN.
const FONT_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/fonts/KaTeX_Main-Regular.ttf';

async function animate(scene: any) {
  const { TextOnPath } = await import('manim-web');

  // Font mode: pass a string plus a font URL, then await waitForReady(). Each
  // glyph is placed along the path by arc length and rotated to the tangent.
  // The path here is a function t -> [x, y, z] sampled over t in [0, 1].
  const text = new TextOnPath({
    text: 'manim web',
    fontUrl: FONT_URL,
    path: (t: number) => [(t - 0.5) * 9, Math.sin(t * Math.PI) * 2.2 - 0.6, 0],
    fontSize: 72,
    color: '#58c4dd',
  });
  await text.waitForReady();

  scene.add(text);
  await scene.wait(999999);
}

export default function TextOnPathExample() {
  return <ManimExample animationFn={animate} />;
}
