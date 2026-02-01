// Converted from Python Manim → ManimWeb TypeScript
// Review and adjust as needed — automated conversion is approximate.
import {
  Angle,
  FadeToColor,
  LEFT,
  Line,
  MathTex,
  RED,
  RIGHT,
  SMALL_BUFF,
  Scene,
  ValueTracker,
  BLACK,
  WHITE,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

async function movingAngle(scene) {
  scene.clear();

  const rotation_center = LEFT;

  const theta_tracker = new ValueTracker(110);
  const line1 = new Line({ start: LEFT, end: RIGHT });
  const line_moving = new Line({ start: LEFT, end: RIGHT });
  const line_ref = line_moving.copy();
  line_moving.rotate(theta_tracker.getValue() * (Math.PI / 180), { aboutPoint: rotation_center });
  const a = new Angle({ line1: line1, line2: line_moving }, { radius: 0.5, otherAngle: false });
  const tex = new MathTex({ latex: '\\theta', color: WHITE });
  await tex.waitForRender();
  tex.moveTo(
    new Angle(
      { line1: line1, line2: line_moving },
      { radius: 0.5 + 3 * SMALL_BUFF, otherAngle: false },
    ).pointFromProportion(0.5),
  );

  scene.add(line1, line_moving, a, tex);
  await scene.wait(1);

  line_moving.addUpdater((x) => {
    x.become(line_ref.copy());
    x.rotate(theta_tracker.getValue() * (Math.PI / 180), { aboutPoint: rotation_center });
  });

  a.addUpdater((x) =>
    x.become(new Angle({ line1: line1, line2: line_moving }, { radius: 0.5, otherAngle: false })),
  );
  tex.addUpdater((x) =>
    x.moveTo(
      new Angle(
        { line1: line1, line2: line_moving },
        { radius: 0.5 + 3 * SMALL_BUFF, otherAngle: false },
      ).pointFromProportion(0.5),
    ),
  );

  await scene.play(theta_tracker.animateTo(40));
  await scene.play(theta_tracker.animateTo(theta_tracker.getValue() + 140));
  await scene.play(new FadeToColor(tex, { color: RED, duration: 0.5 }));
  await scene.play(theta_tracker.animateTo(350));

  await scene.wait(1);
}

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  await movingAngle(scene);

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
