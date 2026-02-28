import {
  Scene,
  Dot,
  Text,
  Line,
  Shift,
  AnimationGroup,
  RIGHT,
  BLACK,
  BLUE,
  RED,
  GREEN,
  YELLOW,
  PURPLE,
  ORANGE,
  WHITE,
  smooth,
  easeInOutSine,
  easeInOutBack,
  easeOutElastic,
  easeOutBounce,
  easeInOutCirc,
  smoothstep,
  easeInOutExpo,
  scaleVec,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

// Rate functions to compare, each with a label and color
const rateFunctions: Array<{
  name: string;
  rateFunc: (t: number) => number;
  color: string;
}> = [
  { name: 'smooth', rateFunc: smooth, color: BLUE },
  { name: 'easeInOutSine', rateFunc: easeInOutSine, color: RED },
  { name: 'easeInOutBack', rateFunc: easeInOutBack, color: GREEN },
  { name: 'easeOutElastic', rateFunc: easeOutElastic, color: YELLOW },
  { name: 'easeOutBounce', rateFunc: easeOutBounce, color: PURPLE },
  { name: 'easeInOutCirc', rateFunc: easeInOutCirc, color: ORANGE },
  { name: 'smoothstep', rateFunc: smoothstep, color: '#ff69b4' },
  { name: 'easeInOutExpo', rateFunc: easeInOutExpo, color: '#00ced1' },
];

const ROW_COUNT = rateFunctions.length;
const TOP_Y = 2.5;
const ROW_SPACING = 0.65;
const START_X = -2.2;
const SHIFT_DISTANCE = 5.0;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();

  const dots: Dot[] = [];
  const shiftDirection = scaleVec(SHIFT_DISTANCE, RIGHT) as [number, number, number];

  for (let i = 0; i < ROW_COUNT; i++) {
    const y = TOP_Y - i * ROW_SPACING;
    const { name, color } = rateFunctions[i];

    // Label on the left
    const label = new Text({
      text: name,
      fontSize: 18,
      color: WHITE,
    });
    label.moveTo([START_X - 2.3, y, 0]);

    // Track line (faint guide)
    const trackLine = new Line({
      start: [START_X, y, 0],
      end: [START_X + SHIFT_DISTANCE, y, 0],
      color: '#333333',
      strokeWidth: 1,
    });

    // Dot at the start position
    const dot = new Dot({
      point: [START_X, y, 0],
      radius: 0.1,
      color,
    });

    scene.add(label, trackLine, dot);
    dots.push(dot);
  }

  // Build simultaneous shift animations with different rate functions
  const animations = dots.map(
    (dot, i) =>
      new Shift(dot, {
        direction: shiftDirection,
        duration: 3,
        rateFunc: rateFunctions[i].rateFunc,
      }),
  );

  await scene.play(new AnimationGroup(animations));

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
