import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
    MathTex,
    Text,
    VGroup,
    Write,
    FadeIn,
    Indicate,
    transformMatchingTex,
    WHITE,
    BLUE,
    YELLOW,
  } = await import('manim-web');

  const FONT_SIZE = 54;

  // Build a multi-part MathTex. Each array entry is a part addressable by its
  // LaTeX string, which TransformMatchingTex uses as the match key: parts with
  // the same LaTeX morph into each other, the rest fade.
  async function makeEquation(parts: string[]) {
    const eq = new MathTex({ latex: parts, color: WHITE, fontSize: FONT_SIZE });
    await eq.waitForRender();
    eq.moveTo([0, 0, 0]);
    return eq;
  }

  // Title
  const title = new Text({ text: 'Expand (a + b)²', fontSize: 30, color: BLUE });
  title.moveTo([0, 2.3, 0]);
  scene.add(title);
  await scene.play(new FadeIn(title, { duration: 0.6 }));

  // First line of the derivation.
  let current = await makeEquation(['(', 'a', '+', 'b', ')^{2}']);
  // Keep each equation in its own group so the animation's faded-in parts have a
  // parent in the scene, and so the whole line can be swapped out cleanly.
  let container = new VGroup(current);
  scene.add(container);
  await scene.play(new Write(current, { duration: 1.2 }));
  await scene.wait(0.6);

  // Each state shares symbols with the previous one, so the matching parts morph
  // in place while the new terms fade in. This reads as the algebra steps.
  const steps: string[][] = [
    ['(', 'a', '+', 'b', ')', '(', 'a', '+', 'b', ')'],
    ['a^{2}', '+', 'ab', '+', 'ab', '+', 'b^{2}'],
    ['a^{2}', '+', '2ab', '+', 'b^{2}'],
  ];

  for (const parts of steps) {
    const next = await makeEquation(parts);
    await scene.play(transformMatchingTex(current, next, { duration: 1.6, fadeRatio: 0.3 }));

    // Replace the morphed line with the fresh, correctly-keyed equation so the
    // next step matches on the right LaTeX parts. Both look identical here, so
    // the swap is seamless.
    scene.remove(container);
    container = new VGroup(next);
    scene.add(container);
    current = next;
    await scene.wait(0.6);
  }

  // Highlight the middle term of the result.
  current.getPart(2).setColor(YELLOW);
  await scene.play(new Indicate(current.getPart(2), { color: YELLOW, duration: 0.8 }));
  await scene.wait(1);
}

export default function FormulaTransformExample() {
  return <ManimExample animationFn={animate} />;
}
