import {
  Axes,
  BLUE,
  Dot,
  MoveAlongPath,
  MoveToTarget,
  ORANGE,
  Restore,
  Scene,
  linear,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

async function followingGraphCamera(scene: Scene) {
  // Save camera frame state
  scene.camera.frame.saveState();

  // Create the axes and the curve
  const ax = new Axes({ xRange: [-1, 10], yRange: [-1, 10] });
  const graph = ax.plot((x) => Math.sin(x), { color: BLUE, xRange: [0, 3 * Math.PI] });

  // Create dots based on the graph
  const movingDot = new Dot({ point: ax.i2gp(graph.tMin, graph), color: ORANGE });
  const dot1 = new Dot({ point: ax.i2gp(graph.tMin, graph) });
  const dot2 = new Dot({ point: ax.i2gp(graph.tMax, graph) });

  scene.add(ax, graph, dot1, dot2, movingDot);

  // Zoom camera to 0.5x and center on moving dot
  scene.camera.frame.generateTarget();
  scene.camera.frame.targetCopy.scale(0.5);
  scene.camera.frame.targetCopy.moveTo(movingDot.getCenter());
  await scene.play(new MoveToTarget(scene.camera.frame));

  // Add updater so camera follows the moving dot
  const updateCurve = (mob) => {
    mob.moveTo(movingDot.getCenter());
  };
  scene.camera.frame.addUpdater(updateCurve);

  // Animate dot moving along the graph path
  await scene.play(new MoveAlongPath(movingDot, { path: graph, rateFunc: linear }));

  // Remove updater and restore camera to original state
  scene.camera.frame.removeUpdater(updateCurve);
  await scene.play(new Restore(scene.camera.frame));
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await followingGraphCamera(scene);

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
