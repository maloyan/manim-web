import { Scene, Text, Transform, Write, BLACK, WHITE, TEAL, ORANGE } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

function makeText(text: string, color: string, fontSize: number) {
  return new Text({
    text,
    fontSize,
    color,
  });
}

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();

  const texts = [
    makeText('This is some text', WHITE, 40),
    makeText('Text can morph', TEAL, 40),
    makeText('Text can rotate', ORANGE, 40),
    makeText('Text can rotate', ORANGE, 40),
    makeText('Text can rotate', ORANGE, 40),
    makeText('Text can flip', TEAL, 40),
    makeText('Text can flip', TEAL, 40),
    makeText('Text can scale', ORANGE, 40),
  ];

  const a = texts[0];
  a.getThreeObject();
  await scene.play(new Write(a));
  await scene.wait(0.4);

  for (let i = 1; i < texts.length; i++) {
    const target = texts[i];
    target.moveTo(a.getCenter());

    if (i === 2) target.rotate(20 * (Math.PI / 180));
    if (i === 3) target.rotate(-40 * (Math.PI / 180));
    if (i === 5) target.flip();
    if (i === 7) target.scale(2);

    await scene.play(new Transform(a, target));
    await scene.wait(0.4);
  }

  await scene.wait(0.8);

  isAnimating = false;
  document.getElementById('playBtn').disabled = false;
});

document.getElementById('resetBtn').addEventListener('click', () => {
  scene.clear();
});

if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls, .buttons, h1, #status')
    .forEach((el) => (el.style.display = 'none'));
  document.documentElement.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000';
  document.body.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center';
  const cont = document.getElementById('container');
  if (cont)
    cont.style.cssText =
      'border:none;border-radius:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center';
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!playBtn.disabled) setTimeout(() => playBtn.click(), 2000);
    }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}
