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
    getDetText,
    FadeIn,
    FadeOut,
    WHITE,
    YELLOW,
    TEAL_A,
    RED,
  } = await import('manim-web');

  // The matrix entries live in the matrix's column groups, so re-attach the
  // columns to the matrix before display so the cell contents render.
  const showEntries = (m: any) => m.add(...m.getColumns());

  const waitEntries = async (m: any) => {
    const ps: Promise<void>[] = [];
    for (let i = 0; i < m.numRows; i++) {
      for (let j = 0; j < m.numCols; j++) {
        const e = m.getEntry(i, j);
        if (e?.waitForRender) ps.push(e.waitForRender());
      }
    }
    await Promise.all(ps);
  };

  // --- Part 1: four matrix types in a 2x2 grid (like Manim's MatrixExamples) ---
  // The layout runs at construction before the cell images render, so widen the
  // column spacing (hBuff) to keep multi-digit entries from overlapping.
  const m0 = new Matrix(
    [
      ['\\pi', '0'],
      ['-1', '1'],
    ],
    { hBuff: 3 },
  );
  const m1 = new IntegerMatrix(
    [
      [1.5, 0],
      [12, -1.3],
    ],
    { bracketType: '()', hBuff: 3 },
  );
  const m2 = new DecimalMatrix(
    [
      [3.456, 2.122],
      [33.2244, 12.33],
    ],
    { numDecimalPlaces: 2, hBuff: 4 },
  );
  const m3 = new MobjectMatrix([
    [new Circle({ radius: 0.15, color: RED }), new Square({ sideLength: 0.25, color: WHITE })],
    [new MathTex({ latex: '\\pi', color: TEAL_A }), new Circle({ radius: 0.1, color: YELLOW })],
  ]);

  for (const m of [m0, m1, m2, m3]) showEntries(m);
  m0.moveTo([-3, 1.3, 0]);
  m1.moveTo([3, 1.3, 0]);
  m2.moveTo([-3, -1.3, 0]);
  m3.moveTo([3, -1.3, 0]);
  await Promise.all([waitEntries(m0), waitEntries(m1), waitEntries(m2), waitEntries(m3)]);

  await scene.play(new FadeIn(m0, { duration: 0.5 }));
  await scene.play(new FadeIn(m1, { duration: 0.5 }));
  await scene.play(new FadeIn(m2, { duration: 0.5 }));
  await scene.play(new FadeIn(m3, { duration: 0.5 }));
  await scene.wait(3);

  await scene.play(new FadeOut(m0, { duration: 0.3 }));
  await scene.play(new FadeOut(m1, { duration: 0.3 }));
  await scene.play(new FadeOut(m2, { duration: 0.3 }));
  await scene.play(new FadeOut(m3, { duration: 0.3 }));

  // --- Part 2: getDetText adds determinant notation around a Matrix ---
  const matrix = new Matrix([
    [2, 0],
    [-1, 1],
  ]);
  showEntries(matrix);
  matrix.moveTo([-0.8, 0, 0]);
  scene.add(matrix);
  await waitEntries(matrix);

  const det = getDetText(matrix, { determinant: 3, color: YELLOW });
  await scene.play(new FadeIn(det, { duration: 1.2 }));
  await scene.wait(3);
}

export default function MatrixHelpersExample() {
  return <ManimExample animationFn={animate} />;
}
