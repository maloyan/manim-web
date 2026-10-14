import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { MathTex, Write, FadeIn, FadeOut, Indicate, WHITE, BLUE, YELLOW } =
    await import('manim-web');

  const FONT_SIZE = 54;

  // Build every line of the derivation up front and render all of them in
  // parallel. Rendering MathTex is async (it fetches an SVG), so resolving the
  // whole batch before the first animation keeps the playback smooth and keeps
  // each `scene.play` self-contained.
  const line1 = new MathTex({ latex: '(a+b)^{2}', color: WHITE, fontSize: FONT_SIZE });
  const line2 = new MathTex({ latex: '(a+b)(a+b)', color: WHITE, fontSize: FONT_SIZE });
  const line3 = new MathTex({
    latex: 'a^{2}+ab+ab+b^{2}',
    color: WHITE,
    fontSize: FONT_SIZE,
  });
  // The final line is multi-part so each term is addressable with getPart().
  // Part index 2 is the "2ab" middle term, highlighted at the end.
  const line4 = new MathTex({
    latex: ['a^{2}', '+', '2ab', '+', 'b^{2}'],
    color: WHITE,
    fontSize: FONT_SIZE,
  });

  const lines = [line1, line2, line3, line4];
  await Promise.all(lines.map((eq) => eq.waitForRender()));
  for (const eq of lines) {
    eq.moveTo([0, 0, 0]);
  }

  // Title. Rendered as MathTex so the exponent is a true typeset superscript,
  // not a font-dependent Unicode glyph (U+00B2) that can fall back to a
  // baseline "2" on fonts that lack it. This also matches the derivation below.
  const title = new MathTex({ latex: '\\text{Expand } (a+b)^{2}', color: BLUE, fontSize: 38 });
  await title.waitForRender();
  title.moveTo([0, 2.3, 0]);
  scene.add(title);
  await scene.play(new FadeIn(title, { duration: 0.6 }));

  // First line of the derivation: draw it with a stroke-reveal.
  scene.add(line1);
  await scene.play(new Write(line1, { duration: 1.2 }));
  await scene.wait(0.8);

  // Step through the derivation one line at a time. Fading the old line out and
  // the next line in reads clearly as the algebra steps and keeps each line
  // crisp (no glyph-by-glyph morph between expressions of different length).
  const steps = [line2, line3, line4];
  let previous = line1;
  for (const next of steps) {
    scene.add(next);
    await scene.play(new FadeOut(previous, { duration: 0.5 }), new FadeIn(next, { duration: 0.5 }));
    scene.remove(previous);
    previous = next;
    await scene.wait(0.8);
  }

  // Highlight the middle term of the result.
  line4.getPart(2).setColor(YELLOW);
  await scene.play(new Indicate(line4.getPart(2), { color: YELLOW, duration: 0.8 }));
  await scene.wait(1);
}

export default function FormulaTransformExample() {
  return <ManimExample animationFn={animate} />;
}
