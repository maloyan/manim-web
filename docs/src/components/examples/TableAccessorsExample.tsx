// Live example component for the "New in 0.18 and 0.19" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Table, Text } = await import('manim-web');

  const cell = (value: string) => new Text({ text: value, fontSize: 40 });

  const table = new Table({
    data: [
      [cell('12'), cell('7'), cell('31')],
      [cell('4'), cell('19'), cell('8')],
    ],
    rowLabels: [cell('A'), cell('B')],
    colLabels: [cell('Q1'), cell('Q2'), cell('Q3')],
  });

  // setRowColors tints each data row in order.
  table.setRowColors('#58c4dd', '#f5a623');

  // addHighlightedCell inserts a filled rectangle behind one data cell.
  table.addHighlightedCell(1, 2, '#ff3366', 0.5);

  table.scale(1.1);

  // The highlight is a child of the table, so add() shows the whole group.
  scene.add(table);
  await scene.wait(999999);
}

export default function TableAccessorsExample() {
  return <ManimExample animationFn={animate} />;
}
