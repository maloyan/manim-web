import {
  Scene,
  MathTexSVG,
  Create,
  DrawBorderThenFill,
  FadeIn,
  FadeOut,
  BLACK,
  WHITE,
  RED,
  BLUE,
  GREEN,
  YELLOW,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

async function mathtexSvgDemo(scene: Scene) {
  // Pre-create all equations
  const equation1 = new MathTexSVG({
    latex: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    color: WHITE,
    fontSize: 2,
  });
  const equation2 = new MathTexSVG({
    latex: 'e^{i\\pi} + 1 = 0',
    color: YELLOW,
    fontSize: 2.5,
  });
  const multiPart = new MathTexSVG({
    latex: ['E', '=', 'mc^2'],
    color: WHITE,
    fontSize: 3,
  });
  const equation3 = new MathTexSVG({
    latex: '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}',
    color: GREEN,
    fontSize: 2,
  });
  const matrix = new MathTexSVG({
    latex: 'A = \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}',
    color: WHITE,
    fontSize: 2,
  });

  // Render all SVGs in parallel
  await Promise.all([
    equation1.waitForRender(),
    equation2.waitForRender(),
    multiPart.waitForRender(),
    equation3.waitForRender(),
    matrix.waitForRender(),
  ]);

  // 1. Create animation - stroke-draw reveal (the main feature)
  await scene.play(new Create(equation1, { duration: 3 }));
  await scene.wait(1);
  await scene.play(new FadeOut(equation1));

  // 2. DrawBorderThenFill animation
  await scene.play(new DrawBorderThenFill(equation2, { duration: 2 }));
  await scene.wait(1);
  await scene.play(new FadeOut(equation2));

  // 3. Multi-part with per-part coloring
  multiPart.getPart(0).setColor(RED);
  multiPart.getPart(1).setColor(WHITE);
  multiPart.getPart(2).setColor(BLUE);

  await scene.play(new FadeIn(multiPart));
  await scene.wait(2);
  await scene.play(new FadeOut(multiPart));

  // 4. Another Create with a summation
  await scene.play(new Create(equation3, { duration: 2 }));
  await scene.wait(2);
  await scene.play(new FadeOut(equation3));

  // 5. 2x2 matrix with subscript indices
  await scene.play(new Create(matrix, { duration: 2 }));
  await scene.wait(2);
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await mathtexSvgDemo(scene);

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
    .forEach((el) => ((el as HTMLElement).style.display = 'none'));
  document.documentElement.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000';
  document.body.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center';
  const cont = document.getElementById('container');
  if (cont) {
    cont.style.cssText =
      'border:none;border-radius:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center';
  }
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    setTimeout(() => (playBtn as HTMLButtonElement).click(), 500);
    new MutationObserver(() => {
      if (!(playBtn as HTMLButtonElement).disabled)
        setTimeout(() => (playBtn as HTMLButtonElement).click(), 2000);
    }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}
