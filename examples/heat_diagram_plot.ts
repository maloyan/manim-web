// Converted from Python Manim → ManimWeb TypeScript
// Original: HeatDiagramPlot example from Manim Community docs

import { Scene, Axes, Tex, BLACK } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();

  const ax = new Axes({
    xRange: [0, 40, 5],
    yRange: [-8, 32, 5],
    xLength: 9,
    yLength: 6,
    xAxisConfig: { numbersToInclude: [0, 5, 10, 15, 20, 25, 30, 35] },
    yAxisConfig: { numbersToInclude: [-5, 0, 5, 10, 15, 20, 25, 30] },
    tips: false,
  });

  // Create Tex labels and wait for rendering
  const xLabel = new Tex({ latex: '$\\Delta Q$' });
  const yLabel = new Tex({ latex: 'T[$^\\circ C$]' });
  await xLabel.waitForRender();
  await yLabel.waitForRender();

  const labels = ax.getAxisLabels({ xLabel, yLabel });

  const xVals = [0, 8, 38, 39];
  const yVals = [20, 0, 0, -5];
  const graph = ax.plotLineGraph({ xValues: xVals, yValues: yVals });

  scene.add(ax, labels, graph);

  isAnimating = false;
  document.getElementById('playBtn').disabled = false;
});

document.getElementById('resetBtn').addEventListener('click', () => {
  scene.clear();
});

// Auto-play on load
document.getElementById('playBtn').click();

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
