// Live example for the Table includeInnerLines option.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Table, Text, Create, BLUE, YELLOW } = await import('manim-web');

  const cell = (value: string) => new Text({ text: value, fontSize: 32 });
  const makeData = () => [
    [cell('12'), cell('7'), cell('31')],
    [cell('4'), cell('19'), cell('8')],
  ];

  // Left: the default grid. Right: no inner lines, only the outer frame.
  const withLines = new Table({ data: makeData(), lineColor: BLUE });
  const withoutLines = new Table({
    data: makeData(),
    lineColor: YELLOW,
    includeInnerLines: false,
  });
  withLines.moveTo([-3, 0, 0]);
  withoutLines.moveTo([3, 0, 0]);

  await scene.play(new Create(withLines), new Create(withoutLines));
  await scene.wait(999999);
}

export default function TableInnerLinesExample() {
  return <ManimExample animationFn={animate} />;
}
