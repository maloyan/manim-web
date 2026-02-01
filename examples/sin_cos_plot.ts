// Converted from Python Manim → ManimWeb TypeScript
// Review and adjust as needed — automated conversion is approximate.

import {
  Axes,
  BLUE,
  GREEN,
  Line,
  RED,
  Scene,
  UP,
  UR,
  VGroup,
  WHITE,
  YELLOW,
  scaleVec,
  BLACK,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 854,
  height: 480,
  backgroundColor: BLACK,
});

let isAnimating = false;

async function sinAndCosFunctionPlot(scene) {
  const axes = new Axes({
    xRange: [-10, 10.3, 1],
    yRange: [-1.5, 1.5, 1],
    xLength: 10,
    axisConfig: { color: GREEN },
    xAxisConfig: {
      numbersToInclude: [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10],
      numbersWithElongatedTicks: [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10],
    },
    tips: false,
  });
  const axesLabels = axes.getAxisLabels();
  const sinGraph = axes.plot((x) => Math.sin(x), { color: BLUE });
  const cosGraph = axes.plot((x) => Math.cos(x), { color: RED });

  const sinLabel = axes.getGraphLabel(sinGraph, '\\sin(x)', {
    xVal: -10,
    direction: scaleVec(0.5, UP),
  });
  const cosLabel = axes.getGraphLabel(cosGraph, { label: '\\cos(x)' });

  const vertLine = axes.getVerticalLine(axes.i2gp(2 * Math.PI, cosGraph), {
    color: YELLOW,
    lineFunc: Line,
  });
  const lineLabel = axes.getGraphLabel(cosGraph, 'x=2\\pi', {
    xVal: 2 * Math.PI,
    direction: UR,
    color: WHITE,
  });

  const plot = new VGroup(axes, sinGraph, cosGraph, vertLine);
  const labels = new VGroup(axesLabels, sinLabel, cosLabel, lineLabel);
  scene.add(plot, labels);
}

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await sinAndCosFunctionPlot(scene);

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
