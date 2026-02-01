import {
  Scene,
  Text,
  Write,
  FadeIn,
  FadeOut,
  AnimationGroup,
  BLACK,
  WHITE,
  RED,
  DOWN,
  smooth,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();

  const FONT_URL = './fonts/KaTeX_Main-Regular.ttf';
  const firstLine = new Text({
    text: 'Create cool animations',
    fontSize: 48,
    color: WHITE,
    fontUrl: FONT_URL,
  });
  const secondLine = new Text({
    text: 'using Manim',
    fontSize: 48,
    color: WHITE,
    fontUrl: FONT_URL,
  });
  const thirdLine = new Text({ text: 'Try it out yourself.', fontSize: 48, color: RED });

  await Promise.all([firstLine.loadGlyphs(), secondLine.loadGlyphs()]);
  secondLine.nextTo(firstLine, DOWN);

  await scene.wait(1);
  await scene.play(new Write(firstLine), new Write(secondLine));
  await scene.wait(1);

  // Cross-fade: fade out first line while fading in third line at same position
  scene.add(thirdLine);
  thirdLine.opacity = 0;
  await scene.play(
    new AnimationGroup([
      new FadeOut(firstLine, { duration: 1.5, rateFunc: smooth }),
      new FadeIn(thirdLine, { duration: 1.5, rateFunc: smooth }),
      new FadeOut(secondLine, { duration: 1.5, rateFunc: smooth }),
    ]),
  );
  await scene.wait(2);

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
