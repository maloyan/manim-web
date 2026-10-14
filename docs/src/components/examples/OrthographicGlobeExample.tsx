// Live example for the 0.39 geo projections: a rotating globe drawn with the
// `orthographic` projection on a 2D ChoroplethMap. The projection takes a
// `rotate: [centerLon, centerLat]` param; animating centerLon spins the globe.
// ChoroplethMap fixes its projection at construction and has no reprojection
// call, so a holder Group with an updater rebuilds the map each frame from a
// ValueTracker that sweeps the longitude 0 -> 360. The orthographic projection
// returns [NaN, NaN] for the back hemisphere, which ChoroplethMap drops, so the
// circular globe silhouette and the far side hiding come out for free. 2D, so it
// uses a regular Scene. All data is inline.
import React from 'react';
import ManimExample from '../ManimExample';

// A coarse lon/lat grid of 20-degree cells, colored by a "landmass" field: the
// value is 1 at a few continent centers and falls off smoothly, so blue ocean
// cells and green land blobs tile the sphere.
function worldGrid() {
  const centers: [number, number][] = [
    [15, 15], // Africa / Europe
    [100, 35], // Asia
    [-100, 45], // North America
    [-60, -20], // South America
    [135, -25], // Australia
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
        const dLon = ((cLon - clon + 540) % 360) - 180; // wrap to [-180, 180]
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
  const { ChoroplethMap, orthographic, ValueTracker, Group } = await import('manim-web');

  const geojson = worldGrid();
  const value = (feature: any) => feature.properties.land;

  // Build the map for a given center longitude (one orthographic view of the
  // sphere). A fixed domain keeps the color ramp steady while the regions move.
  const buildMap = (lon: number) =>
    new ChoroplethMap({
      geojson,
      value,
      colorScale: ['#0d3b66', '#3a9f5a'], // ocean -> land
      domain: [0, 1],
      projection: orthographic({ radius: 2.6, rotate: [lon, 0] }),
      borderWidth: 0,
    });

  // The longitude at the center of the disc. Animate it to spin the globe east.
  const centerLon = new ValueTracker(0);

  // A holder whose updater swaps in a freshly projected map each frame as the
  // longitude changes (ChoroplethMap cannot reproject in place).
  const holder = new Group();
  let lastLon: number | null = null;
  holder.addUpdater(() => {
    const lon = centerLon.getValue();
    if (lon === lastLon) return;
    lastLon = lon;
    holder.clear();
    holder.add(buildMap(lon));
  });
  holder.add(buildMap(0));
  scene.add(holder);

  // One full turn. The near hemisphere shows; the far side is culled.
  await scene.play(centerLon.animateTo(360, { duration: 10 }));
}

export default function OrthographicGlobeExample() {
  return <ManimExample animationFn={animate} />;
}
