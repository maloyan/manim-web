import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
    TexTemplate,
    TexTemplateLibrary,
    TexFontTemplates,
    MathTex,
    Text,
    Create,
    FadeIn,
    WHITE,
    YELLOW,
    BLUE,
  } = await import('manim-web');

  const title = new Text({ text: 'TeX Templates', fontSize: 32, color: YELLOW });
  title.moveTo([0, 2.5, 0]);
  await scene.play(new FadeIn(title, { duration: 0.5 }));

  // Build a custom template and add a package to its preamble.
  const template = new TexTemplate();
  template.addPackage('physics');
  const addedLine = template.getPreamble().split('\n').pop() ?? '';

  // Read values straight out of the pre-built libraries.
  const defaultLineCount = TexTemplateLibrary.default.getPreamble().split('\n').length;
  const palatino = TexFontTemplates.palatino;

  const info = new Text({
    text: `Custom template adds: ${addedLine}`,
    fontSize: 18,
    color: WHITE,
  });
  info.moveTo([0, 1.3, 0]);
  await scene.play(new FadeIn(info, { duration: 0.4 }));

  const libLine = new Text({
    text: `Library default preamble has ${defaultLineCount} packages`,
    fontSize: 18,
    color: WHITE,
  });
  libLine.moveTo([0, 0.7, 0]);
  await scene.play(new FadeIn(libLine, { duration: 0.4 }));

  const fontLine = new Text({
    text: `Font template: ${palatino.description}`,
    fontSize: 18,
    color: WHITE,
  });
  fontLine.moveTo([0, 0.1, 0]);
  await scene.play(new FadeIn(fontLine, { duration: 0.4 }));

  // Render an equation of the kind these templates configure the preamble for.
  const eq = new MathTex({
    latex: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    color: BLUE,
    fontSize: 40,
  });
  await eq.waitForRender();
  eq.moveTo([0, -1.2, 0]);
  await scene.play(new Create(eq, { duration: 1.5 }));
  await scene.wait(2);
}

export default function TexTemplateExample() {
  return <ManimExample animationFn={animate} />;
}
