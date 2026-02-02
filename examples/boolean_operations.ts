import {
  BLUE,
  Difference,
  Ellipse,
  Exclusion,
  FadeIn,
  GREEN,
  Group,
  Intersection,
  LEFT,
  MoveToTarget,
  ORANGE,
  PINK,
  RED,
  RIGHT,
  Scene,
  Text,
  Underline,
  UP,
  Union,
  WHITE,
  YELLOW,
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
  // Large italic underlined title matching Python Manim reference
  const bool_ops_text = new Text({
    text: 'Boolean Operation',
    fontFamily: 'serif',
    fontSize: 48,
  }).nextTo(ellipse1, UP);
  const ellipse_group = new Group(bool_ops_text, ellipse1, ellipse2).moveTo(
    scaleVec(3, LEFT),
  );
  // Create underline AFTER group is positioned so it uses the text's final position
  const underline = new Underline(bool_ops_text, { color: WHITE, strokeWidth: 2 });
  ellipse_group.add(underline);
  await scene.play(new FadeIn(ellipse_group));

  // Layout matching Python Manim reference:
  //        Intersection
  //  Difference    Union
  //        Exclusion
  // Intersection, Union, Exclusion are vertically aligned on the right.
  // Difference is offset to the left at the same row as Union.
  const rightX = 5.5;
  const diffX = 3.5;
  const shapeScale = 0.25;

  const i = new Intersection(ellipse1, ellipse2, { color: GREEN, fillOpacity: 0.5 });
  i.generateTarget();
  i.targetCopy.scale(shapeScale).moveTo([rightX, 2.5, 0]);
  await scene.play(new MoveToTarget(i));
  const intersection_text = new Text({ text: 'Intersection', fontSize: 23 }).nextTo(i, UP);
  await scene.play(new FadeIn(intersection_text));

  const u = new Union(ellipse1, ellipse2, { color: ORANGE, fillOpacity: 0.5 });
  u.generateTarget();
  u.targetCopy.scale(shapeScale).moveTo([rightX, 0, 0]);
  await scene.play(new MoveToTarget(u));
  const union_text = new Text({ text: 'Union', fontSize: 23 }).nextTo(u, UP);
  await scene.play(new FadeIn(union_text));

  const e = new Exclusion(ellipse1, ellipse2, { color: YELLOW, fillOpacity: 0.5 });
  e.generateTarget();
  e.targetCopy.scale(shapeScale).moveTo([rightX, -2.5, 0]);
  await scene.play(new MoveToTarget(e));
  const exclusion_text = new Text({ text: 'Exclusion', fontSize: 23 }).nextTo(e, UP);
  await scene.play(new FadeIn(exclusion_text));

  const d = new Difference(ellipse1, ellipse2, { color: PINK, fillOpacity: 0.5 });
  d.generateTarget();
  d.targetCopy.scale(shapeScale).moveTo([diffX, 0, 0]);
  await scene.play(new MoveToTarget(d));
  const difference_text = new Text({ text: 'Difference', fontSize: 23 }).nextTo(d, UP);
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
