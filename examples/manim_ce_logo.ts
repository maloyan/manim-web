import {
  Circle,
  LEFT,
  MathTex,
  ORIGIN,
  RIGHT,
  Scene,
  Square,
  Triangle,
  UP,
  VGroup,
  addVec,
  scaleVec,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#ece6e2',
});

async function manimCELogo(scene: Scene) {
  const logoGreen = '#87c2a5';
  const logoBlue = '#525893';
  const logoRed = '#e07a5f';
  const logoBlack = '#343434';
  const dsM = new MathTex({ latex: '\\mathbb{M}', fillColor: logoBlack });
  await dsM.waitForRender();
  dsM.scale(7);
  dsM.shift(addVec(scaleVec(2.25, LEFT), scaleVec(1.5, UP)));
  const circle = new Circle({ color: logoGreen, fillOpacity: 1 }).shift(LEFT);
  const square = new Square({ color: logoBlue, fillOpacity: 1 }).shift(UP);
  const triangle = new Triangle({ color: logoRed, fillOpacity: 1 }).shift(RIGHT);
  const logo = new VGroup(triangle, square, circle, dsM);
  logo.moveTo(ORIGIN);
  scene.add(logo);
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await manimCELogo(scene);

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
