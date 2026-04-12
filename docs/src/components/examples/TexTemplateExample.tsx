import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { MathTex, Text, Create, FadeIn, WHITE, YELLOW, BLUE } = await import('manim-web');

  const title = new Text({ text: 'TeX Templates', fontSize: 32, color: YELLOW });
  title.moveTo([0, 2.5, 0]);
  await scene.play(new FadeIn(title, { duration: 0.5 }));

  const label1 = new Text({ text: 'Default:', fontSize: 20, color: WHITE });
  label1.moveTo([-3, 1.2, 0]);
  await scene.play(new FadeIn(label1, { duration: 0.3 }));

  const tex1 = new MathTex({
    latex: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    color: WHITE,
    fontSize: 1,
  });
  tex1.moveTo([0.5, 1.2, 0]);
  await scene.play(new Create(tex1, { duration: 1.5 }));

  const label2 = new Text({ text: 'Custom:', fontSize: 20, color: WHITE });
  label2.moveTo([-3, -0.5, 0]);
  await scene.play(new FadeIn(label2, { duration: 0.3 }));

  const tex2 = new MathTex({
    latex: '\\sum_{n=1}^{N} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
    color: BLUE,
    fontSize: 1,
  });
  tex2.moveTo([0.5, -0.5, 0]);
  await scene.play(new Create(tex2, { duration: 1.5 }));
  await scene.wait(1.5);
}

export default function TexTemplateExample() {
  return <ManimExample animationFn={animate} />;
}
