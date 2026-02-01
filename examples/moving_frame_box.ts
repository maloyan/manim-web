// Converted from Python Manim → ManimWeb TypeScript
// Review and adjust as needed — automated conversion is approximate.

import {
  Create,
  MathTex,
  ReplacementTransform,
  Scene,
  SurroundingRectangle,
  Write,
} from '../src/index.ts';

export async function movingFrameBox(scene) {
  const text = new MathTex({
    latex: ['\\frac{d}{dx}f(x)g(x)=', 'f(x)\\frac{d}{dx}g(x)', '+', 'g(x)\\frac{d}{dx}f(x)'],
  });
  await text.waitForRender();
  await scene.play(new Write(text));
  const framebox1 = new SurroundingRectangle(text.getPart(1), { buff: 0.1 });
  const framebox2 = new SurroundingRectangle(text.getPart(3), { buff: 0.1 });
  await scene.play(new Create(framebox1));
  await scene.wait();
  await scene.play(new ReplacementTransform(framebox1, framebox2));
  await scene.wait();
}

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

movingFrameBox(scene);

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
