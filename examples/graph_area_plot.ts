// Converted from Python Manim → ManimWeb TypeScript
// Review and adjust as needed — automated conversion is approximate.

import { Axes, BLUE, BLUE_C, GRAY, GREEN_B, Scene, YELLOW, BLACK } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 854,
  height: 480,
  backgroundColor: BLACK,
});

let isAnimating = false;

async function graphAreaPlot(scene) {
  const ax = new Axes({
    xRange: [0, 5],
    yRange: [0, 6],
    xAxisConfig: { numbersToInclude: [2, 3] },
    tips: false,
  });
  const labels = ax.getAxisLabels();

  const curve1 = ax.plot((x) => 4 * x - Math.pow(x, 2), { xRange: [0, 4], color: BLUE_C });
  const curve2 = ax.plot((x) => 0.8 * Math.pow(x, 2) - 3 * x + 4, {
    xRange: [0, 4],
    color: GREEN_B,
  });

  const line1 = ax.getVerticalLine(ax.inputToGraphPoint(2, curve1), { color: YELLOW });
  const line2 = ax.getVerticalLine(ax.i2gp(3, curve1), { color: YELLOW });

  const riemannArea = ax.getRiemannRectangles(curve1, {
    xRange: [0.3, 0.6],
    dx: 0.03,
    color: BLUE,
    fillOpacity: 0.5,
  });
  const area = ax.getArea(curve2, [2, 3], { boundedGraph: curve1, color: GRAY, opacity: 0.5 });

  scene.add(ax, labels, curve1, curve2, line1, line2, riemannArea, area);
}

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await graphAreaPlot(scene);

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
  // Also watch for SVG to appear (it may be created after scene init)
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
