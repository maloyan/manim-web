import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { MathTex, Create, FadeIn, Indicate, WHITE, RED, BLUE, GREEN, YELLOW } =
    await import('manim-web');

  // Create individually colored equation parts
  const xSq = new MathTex({ latex: 'x^2', color: RED, fontSize: 48 });
  xSq.moveTo([-2.2, 0, 0]);

  const plus = new MathTex({ latex: '+', color: WHITE, fontSize: 48 });
  plus.moveTo([-1, 0, 0]);

  const ySq = new MathTex({ latex: 'y^2', color: BLUE, fontSize: 48 });
  ySq.moveTo([0.2, 0, 0]);

  const eq = new MathTex({ latex: '=', color: WHITE, fontSize: 48 });
  eq.moveTo([1.4, 0, 0]);

  const rSq = new MathTex({ latex: 'r^2', color: GREEN, fontSize: 48 });
  rSq.moveTo([2.6, 0, 0]);

  await scene.play(new Create(xSq, { duration: 0.6 }));
  await scene.play(new FadeIn(plus, { duration: 0.2 }));
  await scene.play(new Create(ySq, { duration: 0.6 }));
  await scene.play(new FadeIn(eq, { duration: 0.2 }));
  await scene.play(new Create(rSq, { duration: 0.6 }));
  await scene.wait(0.3);

  // Highlight individual parts
  await scene.play(new Indicate(xSq, { color: YELLOW, duration: 0.6 }));
  await scene.play(new Indicate(ySq, { color: YELLOW, duration: 0.6 }));
  await scene.play(new Indicate(rSq, { color: YELLOW, duration: 0.6 }));
  await scene.wait(1);
}

export default function MathTexPartExample() {
  return <ManimExample animationFn={animate} />;
}
