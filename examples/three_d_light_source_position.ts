import { ThreeDAxes, ThreeDScene, Surface3D, RED_D, RED_E } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
  phi: 75 * (Math.PI / 180),
  theta: 30 * (Math.PI / 180),
  distance: 20,
  fov: 30,
});

async function threeDLightSourcePosition(scene: ThreeDScene) {
  const axes = new ThreeDAxes({
    xRange: [-5, 5, 1],
    yRange: [-5, 5, 1],
    zRange: [-5, 5, 1],
    axisColor: '#ffffff',
    tipLength: 0.2,
    tipRadius: 0.08,
    shaftRadius: 0.01,
  });

  // Checkerboard sphere matching Python Manim's Surface(..., checkerboard_colors=[RED_D, RED_E])
  const sphere = new Surface3D({
    func: (u: number, v: number) => [
      1.5 * Math.cos(u) * Math.cos(v),
      1.5 * Math.cos(u) * Math.sin(v),
      1.5 * Math.sin(u),
    ],
    uRange: [-Math.PI / 2, Math.PI / 2],
    vRange: [0, 2 * Math.PI],
    uResolution: 15,
    vResolution: 32,
    checkerboardColors: [RED_D, RED_E],
  });

  // Light from above to match Python Manim's default top-lit appearance
  scene.lighting.removeAll();
  scene.lighting.addAmbient({ intensity: 0.3 });
  scene.lighting.addPoint({ position: [0, 5, 0], intensity: 2.5, decay: 0 });

  scene.add(axes);
  scene.add(sphere);

  await scene.wait();
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await threeDLightSourcePosition(scene);

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
