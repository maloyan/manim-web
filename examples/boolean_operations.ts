import {
  BLUE,
  DOWN,
  Difference,
  Ellipse,
  Exclusion,
  FadeIn,
  GREEN,
  Group,
  Intersection,
  LEFT,
  MarkupText,
  MoveToTarget,
  ORANGE,
  PINK,
  RED,
  RIGHT,
  Scene,
  Text,
  UP,
  Union,
  YELLOW,
  addVec,
  scaleVec,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

async function booleanOperations(scene) {
  const ellipse1 = new Ellipse({
    width: 4.0,
    height: 5.0,
    fillOpacity: 0.5,
    color: BLUE,
    strokeWidth: 3,
  }).moveTo(LEFT);
  const ellipse2 = ellipse1.copy().setColor(RED).moveTo(RIGHT);
  const bool_ops_text = new MarkupText({ text: '<u>Boolean Operation</u>' }).nextTo(
    ellipse1,
    scaleVec(3, UP),
  );
  const ellipse_group = new Group(bool_ops_text, ellipse1, ellipse2).moveTo(scaleVec(3, LEFT));
  await scene.play(new FadeIn(ellipse_group));

  const i = new Intersection(ellipse1, ellipse2, { color: GREEN, fillOpacity: 0.5 });
  i.generateTarget();
  i.targetCopy.scale(0.25).moveTo(addVec(scaleVec(5, RIGHT), scaleVec(2.5, UP)));
  await scene.play(new MoveToTarget(i));
  const intersection_text = new Text({ text: 'Intersection', fontSize: 23 }).nextTo(i, UP);
  await scene.play(new FadeIn(intersection_text));

  const u = new Union(ellipse1, ellipse2, { color: ORANGE, fillOpacity: 0.5 });
  const union_text = new Text({ text: 'Union', fontSize: 23 });
  u.generateTarget();
  u.targetCopy.scale(0.3).nextTo(i, DOWN, union_text.getHeight() * 3);
  await scene.play(new MoveToTarget(u));
  union_text.nextTo(u, UP);
  await scene.play(new FadeIn(union_text));

  const e = new Exclusion(ellipse1, ellipse2, { color: YELLOW, fillOpacity: 0.5 });
  const exclusion_text = new Text({ text: 'Exclusion', fontSize: 23 });
  e.generateTarget();
  e.targetCopy.scale(0.3).nextTo(u, DOWN, exclusion_text.getHeight() * 3.5);
  await scene.play(new MoveToTarget(e));
  exclusion_text.nextTo(e, UP);
  await scene.play(new FadeIn(exclusion_text));

  const d = new Difference(ellipse1, ellipse2, { color: PINK, fillOpacity: 0.5 });
  const difference_text = new Text({ text: 'Difference', fontSize: 23 });
  d.generateTarget();
  d.targetCopy.scale(0.3).nextTo(u, LEFT, difference_text.getHeight() * 3.5);
  await scene.play(new MoveToTarget(d));
  difference_text.nextTo(d, UP);
  await scene.play(new FadeIn(difference_text));
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await booleanOperations(scene);

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
