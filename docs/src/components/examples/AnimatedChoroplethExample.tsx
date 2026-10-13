// Live example for the 0.38 animateChoropleth animation: a small ChoroplethMap
// of three rectangular regions that recolors from value set A to value set B
// over two seconds. 2D, so a regular Scene.
import React from 'react';
import ManimExample from '../ManimExample';

// Three rectangular regions in a row. Coords are [lon, lat]; each region is 4deg
// wide and 6deg tall. Each region carries two values: `a` (the start set) and
// `b` (the target set), read by two accessors below.
const geojson: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { a: 2, b: 9 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-6, -3],
            [-2, -3],
            [-2, 3],
            [-6, 3],
            [-6, -3],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { a: 5, b: 1 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-2, -3],
            [2, -3],
            [2, 3],
            [-2, 3],
            [-2, -3],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { a: 8, b: 6 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2, -3],
            [6, -3],
            [6, 3],
            [2, 3],
            [2, -3],
          ],
        ],
      },
    },
  ],
};

async function animate(scene: any) {
  const { ChoroplethMap, animateChoropleth, equirectangular, Create } = await import('manim-web');

  // Value set A colors the map at the start; set B is the target.
  const valueA = (feature: any) => feature.properties.a;
  const valueB = (feature: any) => feature.properties.b;

  const map = new ChoroplethMap({
    geojson,
    value: valueA,
    colorScale: ['#0d1b2a', '#4cc9f0'],
    borderColor: '#1b263b',
    borderWidth: 1,
    // A fixed domain so both value sets share the same low -> high color ramp.
    domain: [0, 10],
    projection: equirectangular({ radius: 24 }),
  });

  await scene.play(new Create(map, { duration: 1.5 }));

  // Recolor every region from set A to set B over two seconds.
  await scene.play(animateChoropleth(map, valueB, { runTime: 2 }));
}

export default function AnimatedChoroplethExample() {
  return <ManimExample animationFn={animate} />;
}
