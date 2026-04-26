import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { MathTex, Create, FadeIn, Indicate, WHITE, RED, BLUE, GREEN, YELLOW } =
    await import('manim-web');

  // Render as a single equation with multi-part coloring
  const equation = new MathTex({
    latex: ['x^2', '+', 'y^2', '=', 'r^2'],
    color: WHITE,
    fontSize: 60,
  });
  await equation.waitForRender();

  // Color individual parts
  equation.getPart(0).setColor(RED);
  equation.getPart(2).setColor(BLUE);
  equation.getPart(4).setColor(GREEN);

  await scene.play(new Create(equation, { duration: 2 }));
  await scene.wait(0.5);

  // Highlight individual parts
  await scene.play(new Indicate(equation.getPart(0), { color: YELLOW, duration: 0.6 }));
  await scene.play(new Indicate(equation.getPart(2), { color: YELLOW, duration: 0.6 }));
  await scene.play(new Indicate(equation.getPart(4), { color: YELLOW, duration: 0.6 }));
  await scene.wait(1);
}

export default function MathTexPartExample() {
  return <ManimExample animationFn={animate} />;
}
