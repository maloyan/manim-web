import { ThreeDScene, Globe, ChoroplethMap, type GeoFeatureCollection } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#05080f',
  phi: 70 * (Math.PI / 180),
  theta: -45 * (Math.PI / 180),
  distance: 8,
  fov: 35,
  orbitControlsUp: 'z',
});

// Tiny inline GeoJSON so the example needs no asset. Two square "countries".
const sampleGeo: GeoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'West', value: 12 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-40, -10],
            [-10, -10],
            [-10, 20],
            [-40, 20],
            [-40, -10],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'East', value: 48 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [10, -10],
            [40, -10],
            [40, 20],
            [10, 20],
            [10, -10],
          ],
        ],
      },
    },
  ],
};

async function geoMaps(scene: ThreeDScene) {
  // 3D globe with a graticule, two plotted cities, and a great-circle arc.
  const globe = new Globe({ radius: 2, color: '#2a6f97', opacity: 0.95 });
  globe.graticule({ latStep: 30, lonStep: 30, color: '#8d99ae', lineWidth: 1 });

  const paris: [number, number] = [48.85, 2.35];
  const newYork: [number, number] = [40.71, -74.0];
  globe.plotPoint(paris[0], paris[1], { color: '#ffd166' });
  globe.plotPoint(newYork[0], newYork[1], { color: '#ffd166' });
  globe.arc(paris, newYork, { color: '#ef476f', lineWidth: 3, altitude: 0.02 });

  scene.add(globe);

  // The same data as a flat choropleth (built here to show the 2D API; it is
  // projected with the default equirectangular projection and scaled to fit).
  const choropleth = new ChoroplethMap({
    geojson: sampleGeo,
    value: (feature) => feature.properties?.value as number,
    colorScale: ['#0d1b2a', '#4cc9f0'],
    borderColor: '#1b263b',
    borderWidth: 2,
  });
  choropleth.scale(1.5);
  choropleth.shift([0, 0, -3]);
  scene.add(choropleth);

  await scene.wait(999999);
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await geoMaps(scene);

  isAnimating = false;
  document.getElementById('playBtn').disabled = false;
});

document.getElementById('resetBtn').addEventListener('click', () => {
  scene.clear();
});

// Embed mode: hide controls, auto-play, loop
if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls, .buttons, h1, #status')
    .forEach((el) => ((el as HTMLElement).style.display = 'none'));
  document.documentElement.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000';
  document.body.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center';
  const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
  }
}
