import { Scene, Axes, Dot, MAROON, ValueTracker, linspace, BLACK } from '../src/index.ts';

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

  try {
    scene.clear();

    const ax = new Axes({
      xRange: [0, 10],
      yRange: [0, 100, 10],
      axisConfig: { includeTip: false },
    });
    const labels = ax.getAxisLabels({ xLabel: 'x', yLabel: 'f(x)' });

    const t = new ValueTracker(0);

    const func = (x) => {
      return 2 * (x - 5) ** 2;
    };
    const graph = ax.plot(func, { color: MAROON });

    const initialPoint = [ax.coordsToPoint(t.getValue(), func(t.getValue()))];
    const dot = new Dot({ point: initialPoint });

    dot.addUpdater((x) => x.moveTo(ax.coordsToPoint(t.getValue(), func(t.getValue()))));
    const xSpace = linspace(...ax.xRange.slice(0, 2), 200);
    const minimumIndex = xSpace.reduce((mi, _, i, a) => (func(a[i]) < func(a[mi]) ? i : mi), 0);

    scene.add(ax, labels, graph, dot);
    await scene.play(t.animateTo(xSpace[minimumIndex]));
    await scene.wait();
  } catch (e) {
    console.error('ERROR:', e.message, e.stack);
  }

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
