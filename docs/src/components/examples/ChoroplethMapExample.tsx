// Live example component for the "New in 0.13, 0.14 and 0.15" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { ChoroplethMap, equirectangular, Create } = await import('manim-web');

  // A synthetic 4x3 grid of regions. Each cell is 3deg wide and 2deg tall,
  // with a value from 0 to 11 so the color ramp is visible.
  const cols = 4;
  const rows = 3;
  const features: any[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lon0 = -6 + c * 3;
      const lon1 = lon0 + 3;
      const lat0 = -3 + r * 2;
      const lat1 = lat0 + 2;
      features.push({
        type: 'Feature',
        properties: { value: r * cols + c },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lon0, lat0],
              [lon1, lat0],
              [lon1, lat1],
              [lon0, lat1],
              [lon0, lat0],
            ],
          ],
        },
      });
    }
  }

  const map = new ChoroplethMap({
    geojson: { type: 'FeatureCollection', features },
    value: (feature: any) => feature.properties.value,
    colorScale: ['#0d1b2a', '#4cc9f0'],
    borderColor: '#1b263b',
    borderWidth: 1,
    // radius ~57.3 maps one degree to about one scene unit.
    projection: equirectangular({ radius: 57.3 }),
  });

  await scene.play(new Create(map, { duration: 2 }));
}

export default function ChoroplethMapExample() {
  return <ManimExample animationFn={animate} />;
}
