import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
    Matrix,
    IntegerMatrix,
    DecimalMatrix,
    MobjectMatrix,
    Circle,
    Square,
    MathTex,
    FadeIn,
    FadeOut,
    getDetText,
    YELLOW,
  } = await import('manim-web');

  // --- Part 1: the four Matrix types (like Python Manim's MatrixExamples) ---

  const m0 = new Matrix([
    ['\\pi', '0'],
    ['-1', '1'],
  ]);
  m0.moveTo([-3, 1.3, 0]);

  const m1 = new IntegerMatrix(
    [
      [1.5, 0],
      [12, -1.3],
    ],
    { bracketType: '()' },
  );
  m1.moveTo([3, 1.3, 0]);

  const m2 = new DecimalMatrix(
    [
      [3.456, 2.122],
      [33.2244, 12.33],
    ],
    { numDecimalPlaces: 2, hBuff: 3.2 },
  );
  m2.moveTo([-3, -1.3, 0]);

  const m3 = new MobjectMatrix([
    [new Circle({ radius: 0.15 }), new Square({ sideLength: 0.25 })],
    [new MathTex({ latex: '\\pi' }), new Circle({ radius: 0.1 })],
  ]);
  m3.moveTo([3, -1.3, 0]);

  await scene.play(new FadeIn(m0, { duration: 0.5 }));
  await scene.play(new FadeIn(m1, { duration: 0.5 }));
  await scene.play(new FadeIn(m2, { duration: 0.5 }));
  await scene.play(new FadeIn(m3, { duration: 0.5 }));
  await scene.wait(3);

  // --- Part 2: determinant notation around a matrix (DeterminantOfAMatrix) ---
  await scene.play(new FadeOut(m0, { duration: 0.3 }));
  await scene.play(new FadeOut(m1, { duration: 0.3 }));
  await scene.play(new FadeOut(m2, { duration: 0.3 }));
  await scene.play(new FadeOut(m3, { duration: 0.3 }));

  const matrix = new Matrix([
    [2, 0],
    [-1, 1],
  ]);
  const det = getDetText(matrix, { determinant: 3, color: YELLOW });
  await scene.play(new FadeIn(matrix, { duration: 0.8 }));
  await scene.play(new FadeIn(det, { duration: 0.8 }));
  await scene.wait(3);
}

export default function MatrixHelpersExample() {
  return <ManimExample animationFn={animate} />;
}
