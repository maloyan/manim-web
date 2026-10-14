// Live example for the 0.39 geo projections: a whole-world ChoroplethMap drawn
// with the `mollweide` projection, the elliptical equal-area world map. The real
// Natural Earth 1:110m land outline (bundled inline as TopoJSON, shared with the
// rotating-globe example) is projected into Mollweide's ellipse, filled green
// over a blue ocean ellipse, then revealed with Create. `robinson` is the other
// new whole-world projection and is a drop-in swap for `mollweide` here. 2D, so
// it uses a regular Scene. All data is inline, no files, no network.
import React from 'react';
import type { Topology } from 'manim-web';
import ManimExample from '../ManimExample';
// The Natural Earth 1:110m land outline as a compact TopoJSON topology (one
// "land" object, a MultiPolygon of the continents), bundled inline. Shared with
// the orthographic globe example. Decoded to GeoJSON at runtime below.
import worldLand from './worldLand.json';

const worldLandTopology = worldLand as unknown as Topology;

const RADIUS = 1.3;
// Mollweide maps the whole earth into an ellipse with x half-width 2*sqrt(2)*R
// and y half-height sqrt(2)*R. The ocean fills that exact ellipse behind the
// land, so the map reads as sea with continents on top.
const OCEAN_WIDTH = 2 * 2 * Math.SQRT2 * RADIUS;
const OCEAN_HEIGHT = 2 * Math.SQRT2 * RADIUS;

const OCEAN = '#0d3b66';
const LAND = '#3a9f5a';

async function animate(scene: any) {
  const { ChoroplethMap, mollweide, Create, Ellipse, topojsonToGeojson } =
    await import('manim-web');

  // Decode the inline world outline to GeoJSON (one MultiPolygon of the
  // continents) and color every feature as land.
  const geojson = topojsonToGeojson(worldLandTopology, 'land');

  const ocean = new Ellipse({ width: OCEAN_WIDTH, height: OCEAN_HEIGHT, strokeWidth: 0 });
  ocean.setFill(OCEAN, 1);

  const map = new ChoroplethMap({
    geojson,
    value: () => 1,
    colorScale: [LAND, LAND], // every feature is land
    domain: [0, 1],
    // mollweide: the elliptical equal-area world map. Swap for robinson() to get
    // the compromise flat-top world map with the same call shape.
    projection: mollweide({ radius: RADIUS }),
    borderColor: '#0b2a17',
    borderWidth: 0.5,
  });

  scene.add(ocean);
  scene.add(map);
  await scene.play(new Create(map, { duration: 2.5 }));
}

export default function MollweideWorldExample() {
  return <ManimExample animationFn={animate} />;
}
