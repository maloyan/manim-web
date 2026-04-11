import { Angle, Line3D, ThreeDAxes, ThreeDScene, WHITE, YELLOW, GREEN } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
  phi: 70 * (Math.PI / 180),
  theta: -45 * (Math.PI / 180),
  distance: 20,
  fov: 30,
  enableOrbitControls: true,
});

async function threeDAngle(scene: ThreeDScene) {
  const axes = new ThreeDAxes({
    xRange: [-4, 4, 1],
    yRange: [-4, 4, 1],
    zRange: [-3, 3, 1],
    axisColor: '#ffffff',
    tipLength: 0.3,
    tipRadius: 0.12,
    shaftRadius: 0.008,
  });

  const origin: [number, number, number] = [0, 0, 0];
  const p1: [number, number, number] = [2, 0, 0];
  const p2: [number, number, number] = [0, 1.5, 2];

  const line1 = new Line3D({ start: origin, end: p1, color: YELLOW });
  const line2 = new Line3D({ start: origin, end: p2, color: GREEN });

  const angle = new Angle({ points: [p1, origin, p2] }, { radius: 0.8, color: WHITE });

  scene.add(axes, line1, line2, angle);
  await scene.wait(Infinity);
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  scene.setCameraOrientation(70 * (Math.PI / 180), -45 * (Math.PI / 180));
  await threeDAngle(scene);

  isAnimating = false;
  document.getElementById('playBtn').disabled = false;
});

document.getElementById('resetBtn').addEventListener('click', () => {
  scene.clear();
  scene.setCameraOrientation(70 * (Math.PI / 180), -45 * (Math.PI / 180));
});

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
