import { ThreeDAxes, ThreeDScene, Surface3D, ORANGE, BLUE } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
  phi: 75 * (Math.PI / 180),
  theta: -30 * (Math.PI / 180),
  distance: 20,
  fov: 30,
});

async function threeDSurfacePlot(scene: ThreeDScene) {
  const sigma = 0.4;
  const mu = [0.0, 0.0];

  // Gaussian surface: parametric function mapping (u,v) to 3D point
  // Surface3D func returns [x, y, z] used directly as THREE.js coordinates.
  // Manim Z-up -> THREE.js Y-up: return [manimX, manimZ, -manimY]
  const gaussSurface = new Surface3D({
    func: (u: number, v: number) => {
      const x = u;
      const y = v;
      const dx = x - mu[0];
      const dy = y - mu[1];
      const d = Math.sqrt(dx * dx + dy * dy);
      const z = Math.exp(-(d * d) / (2.0 * sigma * sigma));
      // Manim coords (x, y, z) -> THREE.js coords (x, z, -y)
      return [x, z, -y];
    },
    uRange: [-2, 2],
    vRange: [-2, 2],
    uResolution: 24,
    vResolution: 24,
    checkerboardColors: [ORANGE, BLUE],
    opacity: 0.85,
  });

  // Scale by 2 about origin (matches Python: gauss_plane.scale(2, about_point=ORIGIN))
  gaussSurface.scale(2);

  const axes = new ThreeDAxes({
    xRange: [-6, 6, 1],
    yRange: [-5, 5, 1],
    zRange: [-4, 4, 1],
    xLength: 12,
    yLength: 10,
    zLength: 6,
    axisColor: '#ffffff',
    tipLength: 0.3,
    tipRadius: 0.12,
    shaftRadius: 0.008,
  });

  scene.add(axes);
  scene.add(gaussSurface);
  await scene.wait();
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await threeDSurfacePlot(scene);

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
  const cont = document.getElementById('container');
  if (cont) {
    cont.style.cssText =
      'border:none;border-radius:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center';
  }
  const svg = cont && cont.querySelector('svg');
  if (svg) {
    (svg as HTMLElement).style.width = '100%';
    (svg as HTMLElement).style.height = '100%';
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  if (cont) {
    new MutationObserver((_, obs) => {
      const s = cont.querySelector('svg');
      if (s) {
        (s as HTMLElement).style.width = '100%';
        (s as HTMLElement).style.height = '100%';
        s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        obs.disconnect();
      }
    }).observe(cont, { childList: true, subtree: true });
  }
  const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!playBtn.disabled) setTimeout(() => playBtn.click(), 2000);
    }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}
