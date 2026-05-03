import { Scene, MathTex, FadeIn, WHITE, YELLOW, BLACK, DOWN } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 900,
  height: 500,
  backgroundColor: BLACK,
});

let isAnimating = false;

document.getElementById('playBtn')?.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;

  const playBtn = document.getElementById('playBtn') as HTMLButtonElement | null;
  if (playBtn) playBtn.disabled = true;

  scene.clear();

  const eqStrokeZero = new MathTex({
    latex: '\\text{strokeWidth}=0:\\quad e^{i\\pi}+1=0',
    color: WHITE,
    strokeWidth: 0,
    fillOpacity: 1,
  });

  const eqTinyStroke = new MathTex({
    latex: '\\text{strokeWidth}=0.01:\\quad e^{i\\pi}+1=0',
    color: YELLOW,
    strokeWidth: 0.01,
    fillOpacity: 1,
  });

  await Promise.all([eqStrokeZero.waitForRender(), eqTinyStroke.waitForRender()]);

  eqTinyStroke.nextTo(eqStrokeZero, DOWN, 0.8);

  await scene.play(new FadeIn(eqStrokeZero), new FadeIn(eqTinyStroke));

  isAnimating = false;
  if (playBtn) playBtn.disabled = false;
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
  scene.clear();
});
