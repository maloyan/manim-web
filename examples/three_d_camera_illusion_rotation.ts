import { Circle, ThreeDAxes, ThreeDScene } from '../src/index.ts';

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

async function threeDCameraIllusionRotation(scene: ThreeDScene) {
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

  const circle = new Circle({ radius: 1, color: '#FC6255' });
  // Circle points are in Manim x-y plane but VMobject renders them
  // directly in THREE.js coords. Rotate -90° around X to lay flat
  // on the ground plane (THREE.js x-z = Manim x-y).
  circle.rotation.x = -Math.PI / 2;

  scene.add(circle, axes);

  // Begin 3D illusion camera rotation (theta rotates at 2 rad/s,
  // phi oscillates sinusoidally for a wobbling 3D effect)
  scene.begin3DIllusionCameraRotation(2);
  await scene.wait(Math.PI / 2);

  // Stop illusion rotation
  scene.stop3DIllusionCameraRotation();
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  // Reset camera orientation for replay
  scene.setCameraOrientation(75 * (Math.PI / 180), 30 * (Math.PI / 180));
  await threeDCameraIllusionRotation(scene);

  isAnimating = false;
  document.getElementById('playBtn').disabled = false;
});

document.getElementById('resetBtn').addEventListener('click', () => {
  scene.clear();
  scene.stop3DIllusionCameraRotation();
  scene.setCameraOrientation(75 * (Math.PI / 180), 30 * (Math.PI / 180));
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
