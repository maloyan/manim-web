// Live example component for the "New in 0.23, 0.24, and 0.25" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { SankeyDiagram, Create } = await import('manim-web');

  // Nodes are keyed by id; links are directed flows whose ribbon thickness is
  // proportional to value. Columns are placed automatically from the link
  // graph, and each link colors itself from its source node by default.
  const sankey = new SankeyDiagram({
    nodes: [
      { id: 'Budget', color: '#58c4dd' },
      { id: 'Eng', color: '#83c167' },
      { id: 'Sales', color: '#fc6255' },
      { id: 'Salaries' },
      { id: 'Cloud' },
      { id: 'Ads' },
    ],
    links: [
      { source: 'Budget', target: 'Eng', value: 40 },
      { source: 'Budget', target: 'Sales', value: 25 },
      { source: 'Eng', target: 'Salaries', value: 28 },
      { source: 'Eng', target: 'Cloud', value: 12 },
      { source: 'Sales', target: 'Salaries', value: 15 },
      { source: 'Sales', target: 'Ads', value: 10 },
    ],
    height: 4.2,
    layerSpacing: 3.4,
  });
  sankey.center();

  await scene.play(new Create(sankey, { duration: 2 }));
}

export default function SankeyDiagramExample() {
  return <ManimExample animationFn={animate} />;
}
