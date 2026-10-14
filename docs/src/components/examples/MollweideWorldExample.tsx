// Live example for the 0.39 geo projections: a whole-world ChoroplethMap drawn
// with the `mollweide` projection, the elliptical equal-area world map. The same
// inline lon/lat "landmass" grid used by the rotating-globe example is projected
// into Mollweide's ellipse, then revealed with Create. `robinson` is the other
// new whole-world projection and is a drop-in swap for `mollweide` here. 2D, so
// it uses a regular Scene. All data is inline, no files, no network.
import React from 'react';
import ManimExample from '../ManimExample';

// A coarse lon/lat grid of 20-degree cells, colored by a "landmass" field (see
// the rotating-globe example): blue ocean, green land blobs at a few continent
// centers.
function worldGrid() {
  const centers: [number, number][] = [
    [15, 15],
    [100, 35],
    [-100, 45],
    [-60, -20],
    [135, -25],
  ];
  const lonStep = 20;
  const latStep = 20;
  const features: any[] = [];
  for (let lon = -180; lon < 180; lon += lonStep) {
    for (let lat = -80; lat < 80; lat += latStep) {
      const cLon = lon + lonStep / 2;
      const cLat = lat + latStep / 2;
      let land = 0;
      for (const [clon, clat] of centers) {
        const dLon = ((cLon - clon + 540) % 360) - 180;
        const dLat = cLat - clat;
        const g = Math.exp(-(dLon * dLon + dLat * dLat) / (2 * 28 * 28));
        if (g > land) land = g;
      }
      features.push({
        type: 'Feature',
        properties: { land },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lon, lat],
              [lon + lonStep, lat],
              [lon + lonStep, lat + latStep],
              [lon, lat + latStep],
              [lon, lat],
            ],
          ],
        },
      });
    }
  }
  return { type: 'FeatureCollection' as const, features };
}

async function animate(scene: any) {
  const { ChoroplethMap, mollweide, Create } = await import('manim-web');

  const map = new ChoroplethMap({
    geojson: worldGrid(),
    value: (feature: any) => feature.properties.land,
    colorScale: ['#0d3b66', '#3a9f5a'], // ocean -> land
    domain: [0, 1],
    // mollweide: the elliptical equal-area world map. Swap for robinson() to get
    // the compromise flat-top world map with the same call shape.
    projection: mollweide({ radius: 1.3 }),
    borderColor: '#0b1b2a',
    borderWidth: 0.5,
  });

  scene.add(map);
  await scene.play(new Create(map, { duration: 2.5 }));
}

export default function MollweideWorldExample() {
  return <ManimExample animationFn={animate} />;
}
