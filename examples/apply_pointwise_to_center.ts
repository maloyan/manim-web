import {
  Scene,
  Circle,
  Square,
  Triangle,
  FadeIn,
  ApplyPointwiseFunctionToCenter,
  BLACK,
  BLUE,
  GREEN_C,
  RED_C,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

async function setupShapes() {
  scene.clear();

  const circle = new Circle({ radius: 0.8, color: BLUE });
  circle.moveTo([-3, 0, 0]);

  const square = new Square({ sideLength: 1.4, color: GREEN_C });
  square.moveTo([0, 0, 0]);

  const triangle = new Triangle({ color: RED_C });
  triangle.scale(0.8);
  triangle.moveTo([3, 0, 0]);

  scene.add(circle, square, triangle);
  await scene.play(
    new FadeIn(circle, { duration: 0.8 }),
    new FadeIn(square, { duration: 0.8 }),
    new FadeIn(triangle, { duration: 0.8 }),
  );
  await scene.wait(0.3);

  return { circle, square, triangle };
}

// Scale each shape around its own center by 1.5x
document.getElementById('playBtn')!.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn')!.setAttribute('disabled', 'true');
  document.getElementById('play2Btn')!.setAttribute('disabled', 'true');

  const { circle, square, triangle } = await setupShapes();

  const scaleFn = (p: number[]) => [p[0] * 1.5, p[1] * 1.5, p[2]];

  await scene.play(
    new ApplyPointwiseFunctionToCenter(circle, scaleFn, { duration: 2 }),
    new ApplyPointwiseFunctionToCenter(square, scaleFn, { duration: 2 }),
    new ApplyPointwiseFunctionToCenter(triangle, scaleFn, { duration: 2 }),
  );
  await scene.wait(1);

  isAnimating = false;
  document.getElementById('playBtn')!.removeAttribute('disabled');
  document.getElementById('play2Btn')!.removeAttribute('disabled');
});

// Rotate each shape around its own center by 45 degrees
document.getElementById('play2Btn')!.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn')!.setAttribute('disabled', 'true');
  document.getElementById('play2Btn')!.setAttribute('disabled', 'true');

  const { circle, square, triangle } = await setupShapes();

  const angle = Math.PI / 4; // 45 degrees
  const rotateFn = (p: number[]) => [
    p[0] * Math.cos(angle) - p[1] * Math.sin(angle),
    p[0] * Math.sin(angle) + p[1] * Math.cos(angle),
    p[2],
  ];

  await scene.play(
    new ApplyPointwiseFunctionToCenter(circle, rotateFn, { duration: 2 }),
    new ApplyPointwiseFunctionToCenter(square, rotateFn, { duration: 2 }),
    new ApplyPointwiseFunctionToCenter(triangle, rotateFn, { duration: 2 }),
  );
  await scene.wait(1);

  isAnimating = false;
  document.getElementById('playBtn')!.removeAttribute('disabled');
  document.getElementById('play2Btn')!.removeAttribute('disabled');
});

document.getElementById('resetBtn')!.addEventListener('click', () => {
  scene.clear();
  isAnimating = false;
  document.getElementById('playBtn')!.removeAttribute('disabled');
  document.getElementById('play2Btn')!.removeAttribute('disabled');
});

// Embed mode: hide controls, auto-play, loop
if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls, .buttons, h1, p, #status')
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
    (svg as SVGElement).style.width = '100%';
    (svg as SVGElement).style.height = '100%';
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  if (cont) {
    new MutationObserver((_, obs) => {
      const s = cont.querySelector('svg');
      if (s) {
        (s as SVGElement).style.width = '100%';
        (s as SVGElement).style.height = '100%';
        s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        obs.disconnect();
      }
    }).observe(cont, { childList: true, subtree: true });
  }
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!playBtn.hasAttribute('disabled')) setTimeout(() => playBtn.click(), 2000);
    }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}
