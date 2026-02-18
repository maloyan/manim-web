import {
  Arrow,
  NumberPlane,
  Scene,
  Text,
  YELLOW,
  GREEN_C,
  RED_C,
  applyMatrix,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

async function applyMatrixArrows(scene: Scene) {
  const plane = new NumberPlane();
  scene.add(plane);

  const arrow1 = new Arrow({ start: [-2, -1, 0], end: [2, 1, 0], color: YELLOW });
  const arrow2 = new Arrow({ start: [0, -2, 0], end: [0, 2, 0], color: GREEN_C });
  const arrow3 = new Arrow({ start: [-1, 1, 0], end: [1, -1, 0], color: RED_C });

  scene.add(arrow1, arrow2, arrow3);

  const label = new Text({ text: 'Before shear', fontSize: 24, color: '#ffffff' });
  label.moveTo([0, 3.2, 0]);
  scene.add(label);

  await scene.wait(1);

  // Shear matrix: x' = x + 0.5*y, y' = y
  const shearMatrix = [
    [1, 0.5, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  // Apply the shear to the plane and arrows simultaneously
  await scene.play(
    applyMatrix(plane, shearMatrix, { duration: 2 }),
    applyMatrix(arrow1, shearMatrix, { duration: 2 }),
    applyMatrix(arrow2, shearMatrix, { duration: 2 }),
    applyMatrix(arrow3, shearMatrix, { duration: 2 }),
  );

  // Update label
  scene.remove(label);
  const label2 = new Text({
    text: 'After shear — tips reconstructed',
    fontSize: 24,
    color: '#ffffff',
  });
  label2.moveTo([0, 3.2, 0]);
  scene.add(label2);

  await scene.wait(2);
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await applyMatrixArrows(scene);

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
