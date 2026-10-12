// Live example component for the "New in 0.27 and 0.28" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

// KaTeX ships a plain roman font that the docs build can fetch from a CDN.
const FONT_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/fonts/KaTeX_Main-Regular.ttf';

async function animate(scene: any) {
  const { Text, fadeInByLetter, waveLetters } = await import('manim-web');

  // The presets stagger an effect across a Text's glyph submobjects. A Text has
  // no glyph children until loadGlyphs() builds them from a font file, so load
  // the glyph group and animate it.
  const text = new Text({ text: 'manim web', fontUrl: FONT_URL, fontSize: 96, color: '#58c4dd' });
  const glyphs = await text.loadGlyphs();
  if (!glyphs) return;
  glyphs.center();

  // typewriter-style reveal, then a per-glyph wave emphasis.
  await scene.play(fadeInByLetter(glyphs, { lagRatio: 0.15 }));
  await scene.play(waveLetters(glyphs, { amplitude: 0.3, waves: 2, duration: 2 }));
  await scene.wait(999999);
}

export default function KineticTypographyExample() {
  return <ManimExample animationFn={animate} />;
}
