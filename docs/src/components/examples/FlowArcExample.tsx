// Live example for the 0.38 FlowArc mobject: a row of ChoroplethMap regions
// with orange flow arcs that bow up over the map between region centers, drawn
// with Create over the shared equirectangular projection. 2D, so a regular Scene.
import React from 'react';
import ManimExample from '../ManimExample';

// Four regions in a row. Coords are [lon, lat]; each region is 6deg wide and
// 6deg tall. The `value` ramps left to right so the fill shows a low->high ramp
// under the arcs.
const region = (value: number, lonMin: number): any => ({
  type: 'Feature',
  properties: { value },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [lonMin, -3],
        [lonMin + 6, -3],
        [lonMin + 6, 3],
        [lonMin, 3],
        [lonMin, -3],
      ],
    ],
  },
});

const geojson: any = {
  type: 'FeatureCollection',
  features: [region(1, -14), region(4, -7), region(7, 0), region(10, 7)],
};

// Region centers as [lat, lon] for FlowArc endpoints (FlowArc takes [lat, lon]).
const r1: [number, number] = [0, -11];
const r2: [number, number] = [0, -4];
const r3: [number, number] = [0, 3];
const r4: [number, number] = [0, 10];

async function animate(scene: any) {
  const { ChoroplethMap, FlowArc, equirectangular, Create } = await import('manim-web');

  // One shared projection instance for the map AND every arc, so the arcs land
  // on the regions.
  const projection = equirectangular({ radius: 24 });

  const map = new ChoroplethMap({
    geojson,
    value: (feature: any) => feature.properties.value,
    colorScale: ['#0d1b2a', '#4cc9f0'],
    borderColor: '#1b263b',
    borderWidth: 1,
    projection,
  });
  await scene.play(new Create(map, { duration: 1.5 }));

  // Orange flow arcs between distant region centers. A wide bulge makes each arc
  // bow up over the row of regions, so the flow reads against the background.
  const arc1 = new FlowArc({
    from: r1,
    to: r4,
    projection,
    bulge: 0.4,
    color: '#ff6b35',
    lineWidth: 3,
  });
  const arc2 = new FlowArc({
    from: r1,
    to: r3,
    projection,
    bulge: 0.4,
    color: '#ffa94d',
    lineWidth: 3,
  });
  const arc3 = new FlowArc({
    from: r2,
    to: r4,
    projection,
    bulge: 0.4,
    color: '#ffd23f',
    lineWidth: 3,
  });

  await scene.play(new Create(arc1, { duration: 1 }));
  await scene.play(new Create(arc2, { duration: 1 }));
  await scene.play(new Create(arc3, { duration: 1 }));
}

export default function FlowArcExample() {
  return <ManimExample animationFn={animate} />;
}
