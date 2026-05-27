import { Scene, MathTexImage, Create, Transform, BLACK } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 1280,
  height: 720,
  backgroundColor: BLACK,
});

let isAnimating = false;

async function runBugRepro(scene: Scene) {
  const a = new MathTexImage({ latex: '0', fontSize: 48 });
  const b = new MathTexImage({ latex: '0', fontSize: 144 });

  await Promise.all([a.waitForRender(), b.waitForRender()]);

  await scene.play(new Create(a));
  await scene.play(new Transform(a, b, { duration: 2 }));
}

document.getElementById('playBtn')?.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;

  const playBtn = document.getElementById('playBtn') as HTMLButtonElement | null;
  if (playBtn) playBtn.disabled = true;

  scene.clear();
  await runBugRepro(scene);

  isAnimating = false;
  if (playBtn) playBtn.disabled = false;
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
  scene.clear();
});
