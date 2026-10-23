// Live example component for the "Scrubbable numbers" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
    Axes,
    Text,
    DecimalNumber,
    DecimalTable,
    makeScrubbable,
    makeScrubbableEntries,
    BLUE,
    YELLOW,
    WHITE,
  } = await import('manim-web');

  // Left: y = a x^2 + b x + c. Drag a, b or c left or right.
  const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-3, 3, 1], xLength: 5, yLength: 4.5 });
  axes.shift([-3.5, -0.9, 0]);

  const coeff = (value: number, x: number) =>
    new DecimalNumber({ value, numDecimalPlaces: 1, fontSize: 30, color: YELLOW }).moveTo([
      x,
      2.9,
      0,
    ]);
  const a = coeff(1, -4.9);
  const b = coeff(0, -3.2);
  const c = coeff(-1, -1.5);
  const terms = [
    new Text({ text: 'y =', fontSize: 30, color: WHITE }).moveTo([-5.9, 2.9, 0]),
    new Text({ text: 'x² +', fontSize: 30, color: WHITE }).moveTo([-4.05, 2.9, 0]),
    new Text({ text: 'x +', fontSize: 30, color: WHITE }).moveTo([-2.4, 2.9, 0]),
  ];

  const parabola = () =>
    axes.plot((x: number) => a.getValue() * x * x + b.getValue() * x + c.getValue(), {
      color: BLUE,
      xRange: [-3, 3],
    });
  const graph = parabola();
  scene.add(axes, graph, a, b, c, ...terms);

  const redraw = () => graph.become(parabola());
  for (const d of [a, b, c]) {
    makeScrubbable(d, scene, { step: 0.1, sensitivity: 0.02, min: -5, max: 5, onChange: redraw });
  }

  // Right: a 2x2 DecimalTable. Drag a cell up or down.
  const table = new DecimalTable({
    data: [
      [1, 2],
      [3, 4],
    ],
    numDecimalPlaces: 0,
    fontSize: 32,
  });
  table.shift([3.2, 0.3, 0]);
  const det = new Text({ text: 'det = -2', fontSize: 28, color: YELLOW }).moveTo([3.2, -2.2, 0]);
  const label = new Text({ text: 'drag the numbers', fontSize: 22, color: WHITE }).moveTo([
    3.2, 2.5, 0,
  ]);
  scene.add(table, det, label);

  const cells = makeScrubbableEntries(table, scene, {
    direction: 'vertical',
    step: 1,
    sensitivity: 0.1,
    onChange: () => {
      const [p, q, r, s] = cells.map((cell: any) => cell.decimal.getValue());
      det.setText(`det = ${p * s - q * r}`);
    },
  });
  scene.render();

  // Hold the scene open so the reader can scrub. Without a wait the
  // ManimExample harness rebuilds the scene every loop and resets the values.
  await scene.wait(999999);
}

export default function ScrubbableNumberExample() {
  return <ManimExample animationFn={animate} />;
}
