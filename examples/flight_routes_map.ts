/**
 * Flight routes on a world map.
 *
 * A ChoroplethMap draws the Natural Earth coastlines (outline only) with the Robinson
 * projection. FlowArc draws curved routes from Yerevan to five cities on the
 * SAME projection, a city dot grows at the end of each route, and a plane
 * (a bright dot) flies along every route with MoveAlongPath.
 */
import {
  Scene,
  ChoroplethMap,
  FlowArc,
  Dot,
  robinson,
  topojsonToGeojson,
  Create,
  FadeOut,
  GrowFromCenter,
  LaggedStart,
  MoveAlongPath,
  type Topology,
  type LatLon,
} from '../src/index.ts';
// The Natural Earth 1:110m land outline as TopoJSON, shared with the docs.
import worldLand from '../docs/src/components/examples/worldLand.json';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

const projection = robinson({ radius: 2.55 });
const land = topojsonToGeojson(worldLand as unknown as Topology, 'land');

const HUB: LatLon = [40.18, 44.51]; // Yerevan
const DESTINATIONS: { to: LatLon; bulge: number }[] = [
  { to: [40.71, -74.0], bulge: 0.25 }, // New York
  { to: [-23.55, -46.63], bulge: -0.25 }, // Sao Paulo
  { to: [-33.92, 18.42], bulge: -0.2 }, // Cape Town
  { to: [-33.87, 151.21], bulge: 0.25 }, // Sydney
  { to: [35.68, 139.69], bulge: 0.2 }, // Tokyo
];
const ROUTE = '#ff9f43';
const PLANE = '#fff3c4';

/** A [lat, lon] point on the map, as a scene point. */
const at = ([lat, lon]: LatLon): [number, number, number] => {
  const [x, y] = projection([lon, lat]);
  return [x, y, 0];
};

async function flightRoutesMap(scene: Scene) {
  const map = new ChoroplethMap({
    geojson: land,
    value: () => 1,
    colorScale: ['#000000', '#000000'],
    domain: [0, 1],
    projection,
    borderColor: '#6fa8d6',
    borderWidth: 1.6,
    // Outline only: a filled land layer currently draws over the routes.
    fillOpacity: 0,
  });
  const hub = new Dot({ point: at(HUB), radius: 0.09, color: '#ffffff' });
  scene.add(map, hub);

  const routes = DESTINATIONS.map(
    (d) =>
      new FlowArc({ from: HUB, to: d.to, projection, bulge: d.bulge, color: ROUTE, lineWidth: 3 }),
  );
  const cities = DESTINATIONS.map((d) => new Dot({ point: at(d.to), radius: 0.07, color: ROUTE }));
  const planes = DESTINATIONS.map(() => new Dot({ point: at(HUB), radius: 0.08, color: PLANE }));

  // The routes draw out of Yerevan one after another, then the cities pop in.
  await scene.play(
    new LaggedStart(
      routes.map((route) => new Create(route, { duration: 0.8 })),
      { lagRatio: 0.2 },
    ),
  );
  await scene.play(...cities.map((c) => new GrowFromCenter(c, { duration: 0.3 })));

  // A plane (a bright dot) flies every route.
  await scene.play(
    ...planes.map((plane, i) => new MoveAlongPath(plane, { path: routes[i], duration: 1.2 })),
  );
  await scene.play(
    ...[...routes, ...cities, ...planes].map((m) => new FadeOut(m, { duration: 0.5 })),
  );
}

let isAnimating = false;

const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
playBtn.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  playBtn.disabled = true;

  scene.clear();
  await flightRoutesMap(scene);

  isAnimating = false;
  playBtn.disabled = false;
});

document.getElementById('resetBtn')!.addEventListener('click', () => {
  scene.clear();
});

// Embed mode: hide controls, autoplay, and loop.
if (new URLSearchParams(window.location.search).has('embed')) {
  setTimeout(() => playBtn.click(), 500);
  new MutationObserver(() => {
    if (!playBtn.disabled) setTimeout(() => playBtn.click(), 300);
  }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
}
