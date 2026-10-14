// Live example for the 0.39 geo projections: a rotating globe drawn with the
// `orthographic` projection on a 2D ChoroplethMap. The real Natural Earth 1:110m
// land outline (bundled inline as TopoJSON, shared with the Mollweide world-map
// example) is the data, so recognizable continents turn past the limb. The
// projection takes a `rotate: [centerLon, centerLat]` param; animating centerLon
// spins the globe. ChoroplethMap fixes its projection at construction and has no
// reprojection call, so a holder Group with an updater rebuilds the map from a
// ValueTracker that sweeps the longitude 0 -> 360. ChoroplethMap clips each land
// ring to the orthographic limb, so continents end cleanly on the globe edge and
// the far side is hidden; a filled ocean disc behind the land gives the
// silhouette. 2D, so it uses a regular Scene. All data is inline.
import React from 'react';
import type { Topology } from 'manim-web';
import ManimExample from '../ManimExample';
// The Natural Earth 1:110m land outline as a compact TopoJSON topology, bundled
// inline and shared with the Mollweide world-map example. Decoded below.
import worldLand from './worldLand.json';

const worldLandTopology = worldLand as unknown as Topology;

const RADIUS = 2.6;
const OCEAN = '#0d3b66';
const LAND = '#3a9f5a';

async function animate(scene: any) {
  const { ChoroplethMap, orthographic, ValueTracker, Group, Circle, topojsonToGeojson } =
    await import('manim-web');

  // Decode the inline world outline once (one MultiPolygon of the continents).
  const geojson = topojsonToGeojson(worldLandTopology, 'land');

  // A static blue disc the size of the projected globe: the ocean and the globe
  // silhouette. The land turns on top of it.
  const ocean = new Circle({ radius: RADIUS, strokeWidth: 0 });
  ocean.setFill(OCEAN, 1);

  // Build the land for a given center longitude (one orthographic view of the
  // sphere). Every feature is colored as land; the back hemisphere is culled.
  const buildLand = (lon: number) =>
    new ChoroplethMap({
      geojson,
      value: () => 1,
      colorScale: [LAND, LAND],
      domain: [0, 1],
      projection: orthographic({ radius: RADIUS, rotate: [lon, 0] }),
      borderColor: '#0b2a17',
      borderWidth: 0.4,
    });

  // The longitude at the center of the disc. Animate it to spin the globe east.
  const centerLon = new ValueTracker(0);

  // A holder whose updater swaps in a freshly projected land layer as the
  // longitude changes (ChoroplethMap cannot reproject in place). Rebuilds are
  // throttled to 2-degree steps: the turn still looks continuous, but the land
  // (the full-resolution coastline, clipped to the globe limb) is rebuilt at
  // most 180 times over the spin instead of every frame.
  const holder = new Group();
  let lastStep: number | null = null;
  holder.addUpdater(() => {
    const step = Math.round(centerLon.getValue() / 2) * 2;
    if (step === lastStep) return;
    lastStep = step;
    holder.clear();
    holder.add(buildLand(step));
  });
  holder.add(buildLand(0));

  scene.add(ocean);
  scene.add(holder);

  // One full turn. The near hemisphere shows; the far side is culled.
  await scene.play(centerLon.animateTo(360, { duration: 10 }));
}

export default function OrthographicGlobeExample() {
  return <ManimExample animationFn={animate} />;
}
