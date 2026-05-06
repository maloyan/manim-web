import { Scene, MathTex, Transform, BLACK, WHITE } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 1400,
  height: 720,
  backgroundColor: BLACK,
});

async function numberMorphDemo(scene: Scene) {
  const duration = 2.5;
  const fontSize = 120;
  const spacing = 1.5;

  const pairs: Array<{ start: MathTex; target: MathTex }> = [];
  for (let n = 0; n <= 8; n++) {
    const start = new MathTex({
      latex: String(n),
      color: WHITE,
      fillOpacity: 1,
      fontSize,
    });
    const target = new MathTex({
      latex: String(n + 1),
      color: WHITE,
      fillOpacity: 1,
      fontSize,
    });
    pairs.push({ start, target });
  }

  await Promise.all(
    pairs.flatMap(({ start, target }) => [start.waitForRender(), target.waitForRender()]),
  );

  const cols = 3;
  const xStart = -spacing;
  const yStart = spacing;

  pairs.forEach(({ start, target }, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const pos: [number, number, number] = [xStart + col * spacing, yStart - row * spacing, 0];
    start.moveTo(pos);
    target.moveTo(pos);
    scene.add(start);
  });

  for (const { start, target } of pairs) {
    await scene.play(new Transform(start, target, { duration }));
  }
}

let isAnimating = false;

document.getElementById('playBtn')?.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;

  const playBtn = document.getElementById('playBtn') as HTMLButtonElement | null;
  if (playBtn) playBtn.disabled = true;

  scene.clear();
  await numberMorphDemo(scene);

  isAnimating = false;
  if (playBtn) playBtn.disabled = false;
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
  scene.clear();
});

// Embed mode: hide controls, auto-play, loop
if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls, .buttons, h1, #status')
    .forEach((el) => ((el as HTMLElement).style.display = 'none'));

  const playBtn = document.getElementById('playBtn') as HTMLButtonElement | null;
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!playBtn.disabled) setTimeout(() => playBtn.click(), 1500);
    }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}
