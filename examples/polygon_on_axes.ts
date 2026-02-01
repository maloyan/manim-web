// Converted from Python Manim → ManimWeb TypeScript
// Review and adjust as needed — automated conversion is approximate.

import {
  Axes,
  BLUE,
  Create,
  Dot,
  Polygon,
  Scene,
  ValueTracker,
  YELLOW_B,
  YELLOW_D,
  BLACK,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 854,
  height: 480,
  backgroundColor: BLACK,
});

let isAnimating = false;

function getRectangleCorners(bottomLeft, topRight) {
  return [
    [topRight[0], topRight[1]],
    [bottomLeft[0], topRight[1]],
    [bottomLeft[0], bottomLeft[1]],
    [topRight[0], bottomLeft[1]],
  ];
}

async function polygonOnAxes(scene) {
  const ax = new Axes({
    xRange: [0, 10],
    yRange: [0, 10],
    xLength: 6,
    yLength: 6,
    tips: false,
  });

  const t = new ValueTracker(5);
  const k = 25;

  const graph = ax.plot((x) => k / x, { color: YELLOW_D, xRange: [k / 10, 10.0], numSamples: 750 });

  function makeRectangle() {
    const corners = getRectangleCorners([0, 0], [t.getValue(), k / t.getValue()]);
    const vertices = corners.map(([x, y]) => ax.c2p(x, y));
    const p = new Polygon({ vertices, strokeWidth: 1, color: YELLOW_B, fillOpacity: 0.5 });
    p.fillColor = BLUE;
    return p;
  }

  const polygon = makeRectangle();
  polygon.addUpdater(() => {
    polygon.become(makeRectangle());
  });

  const dot = new Dot();
  dot.addUpdater(() => dot.moveTo(ax.c2p(t.getValue(), k / t.getValue())));

  scene.add(ax, graph);
  await scene.play(new Create(polygon));
  scene.add(dot);
  await scene.play(t.animateTo(10));
  await scene.play(t.animateTo(k / 10));
  await scene.play(t.animateTo(5));
}

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await polygonOnAxes(scene);

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
    .forEach((el) => (el.style.display = 'none'));
  document.documentElement.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000';
  document.body.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center';
  const cont = document.getElementById('container');
  if (cont) {
    cont.style.cssText =
      'border:none;border-radius:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center';
  }
  const svg = cont && cont.querySelector('svg');
  if (svg) {
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  if (cont) {
    new MutationObserver((_, obs) => {
      const s = cont.querySelector('svg');
      if (s) {
        s.style.width = '100%';
        s.style.height = '100%';
        s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        obs.disconnect();
      }
    }).observe(cont, { childList: true, subtree: true });
  }
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!playBtn.disabled) setTimeout(() => playBtn.click(), 2000);
    }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}
