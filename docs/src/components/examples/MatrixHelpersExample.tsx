import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { MathTex, VGroup, Circle, Square, Star, FadeIn, FadeOut, WHITE, RED, TEAL_A } =
    await import('manim-web');

  // --- Part 1: MatrixExamples - 4 matrix types in a 2x2 grid ---
  // Matching Python Manim's MatrixExamples reference image

  // Top-left: Matrix with square brackets [π, 0; -1, 1]
  const m0 = new MathTex({
    latex: '\\begin{bmatrix} \\pi & 0 \\\\ -1 & 1 \\end{bmatrix}',
    color: WHITE,
    fontSize: 40,
  });
  m0.moveTo([-3, 1.3, 0]);

  // Top-right: IntegerMatrix with parentheses (2, 0; 12, -1)
  const m1 = new MathTex({
    latex: '\\begin{pmatrix} 2 & 0 \\\\ 12 & -1 \\end{pmatrix}',
    color: WHITE,
    fontSize: 40,
  });
  m1.moveTo([3, 1.3, 0]);

  // Bottom-left: DecimalMatrix with curly braces {3.46, 2.12; 33.22, 12.33}
  const m2 = new MathTex({
    latex: '\\left\\{ \\begin{matrix} 3.46 & 2.12 \\\\ 33.22 & 12.33 \\end{matrix} \\right\\}',
    color: WHITE,
    fontSize: 40,
  });
  m2.moveTo([-3, -1.3, 0]);

  // Bottom-right: MobjectMatrix with angle brackets and colored shapes
  // Use MathTex for angle brackets (VMobject auto-closes paths into polygons)
  // and overlay actual geometric Mobjects for the matrix entries
  const spacing = 1.1;
  const cellGroup = new VGroup();

  // Row 0: Circle (red), Square (white)
  const circle = new Circle({ radius: 0.3, color: RED, fillOpacity: 0 });
  circle.moveTo([-spacing / 2, spacing / 2, 0]);
  cellGroup.add(circle);

  const square = new Square({ sideLength: 0.55, color: WHITE, fillOpacity: 0 });
  square.moveTo([spacing / 2, spacing / 2, 0]);
  cellGroup.add(square);

  // Row 1: π (teal), Star (teal)
  const piTex = new MathTex({ latex: '\\pi', color: TEAL_A, fontSize: 80 });
  piTex.moveTo([-spacing / 2, -spacing / 2, 0]);
  cellGroup.add(piTex);

  const star = new Star({
    outerRadius: 0.35,
    innerRadius: 0.14,
    color: TEAL_A,
    fillOpacity: 0,
  });
  star.moveTo([spacing / 2, -spacing / 2, 0]);
  cellGroup.add(star);

  // Angle brackets sized with \Bigg (no phantom content to avoid visible artifacts)
  const leftAngle = new MathTex({
    latex: '\\Bigg\\langle',
    color: WHITE,
    fontSize: 40,
  });
  leftAngle.moveTo([-(spacing / 2 + 0.8), 0, 0]);
  cellGroup.add(leftAngle);

  const rightAngle = new MathTex({
    latex: '\\Bigg\\rangle',
    color: WHITE,
    fontSize: 40,
  });
  rightAngle.moveTo([spacing / 2 + 0.8, 0, 0]);
  cellGroup.add(rightAngle);

  cellGroup.moveTo([3, -1.3, 0]);

  await scene.play(new FadeIn(m0, { duration: 0.5 }));
  await scene.play(new FadeIn(m1, { duration: 0.5 }));
  await scene.play(new FadeIn(m2, { duration: 0.5 }));
  await scene.play(new FadeIn(cellGroup, { duration: 0.5 }));
  await scene.wait(3);

  // --- Part 2: DeterminantOfAMatrix ---
  await scene.play(new FadeOut(m0, { duration: 0.3 }));
  await scene.play(new FadeOut(m1, { duration: 0.3 }));
  await scene.play(new FadeOut(m2, { duration: 0.3 }));
  await scene.play(new FadeOut(cellGroup, { duration: 0.3 }));

  // det([2, 0; -1, 1]) = 3
  const detTex = new MathTex({
    latex: '\\text{det} \\left( \\begin{bmatrix} 2 & 0 \\\\ -1 & 1 \\end{bmatrix} \\right) = 3',
    color: WHITE,
    fontSize: 48,
  });
  detTex.moveTo([0, 0, 0]);
  await scene.play(new FadeIn(detTex, { duration: 1.5 }));
  await scene.wait(3);
}

export default function MatrixHelpersExample() {
  return <ManimExample animationFn={animate} />;
}
