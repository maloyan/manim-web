import {
  Scene,
  Circle,
  Square,
  Text,
  MathTex,
  Axes,
  FunctionGraph,
  Create,
  Write,
  Transform,
  ReplacementTransform,
  FadeIn,
  FadeOut,
  AnimationGroup,
  BLACK,
  WHITE,
  BLUE,
  RED,
  PINK,
  DOWN,
  RIGHT,
  smooth,
} from '../src/index.ts';

const TAU = Math.PI * 2;
const FONT_URL = './fonts/KaTeX_Main-Regular.ttf';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;
const buttons = document.querySelectorAll('button');

function setAnimating(state) {
  isAnimating = state;
  buttons.forEach((b) => (b.disabled = state));
}

// Demo 1: Square to Circle
document.getElementById('demo1').addEventListener('click', async () => {
  if (isAnimating) return;
  setAnimating(true);
  scene.clear();

  const circle = new Circle({ radius: 1.5 });
  const square = new Square({ sideLength: 3 });

  await scene.play(new Create(square));
  await scene.play(new Transform(square, circle));
  await scene.play(new FadeOut(square));

  setAnimating(false);
});

// Demo 2: Square to Circle with Modifications
document.getElementById('demo2').addEventListener('click', async () => {
  if (isAnimating) return;
  setAnimating(true);
  scene.clear();

  const circle = new Circle({ radius: 1.5, fillColor: PINK, fillOpacity: 0.5 });
  const square = new Square({ sideLength: 3 });

  square.flip(RIGHT);
  square.rotate((-3 * TAU) / 8);

  await scene.play(new Create(square));
  await scene.play(new Transform(square, circle));
  await scene.play(new FadeOut(square));

  setAnimating(false);
});

// Demo 3: Displaying Text
document.getElementById('demo3').addEventListener('click', async () => {
  if (isAnimating) return;
  setAnimating(true);
  scene.clear();

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

  setAnimating(false);
});

// Demo 4: Math Equations
document.getElementById('demo4').addEventListener('click', async () => {
  if (isAnimating) return;
  setAnimating(true);
  scene.clear();

  const firstLine = new Text({
    text: 'Manim also allows you',
    fontSize: 36,
    color: WHITE,
    fontUrl: FONT_URL,
  });
  const secondLine = new Text({
    text: 'to show beautiful math equations',
    fontSize: 36,
    color: WHITE,
    fontUrl: FONT_URL,
  });
  const equation = new MathTex({
    latex: 'd(p, q) = \\sqrt{\\sum_{i=1}^n (q_i - p_i)^2}',
    fontSize: 48,
    color: WHITE,
  });

  await Promise.all([firstLine.loadGlyphs(), secondLine.loadGlyphs()]);
  secondLine.nextTo(firstLine, DOWN);

  await equation.waitForRender();

  await scene.play(new Write(firstLine), new Write(secondLine));
  await scene.wait(1);
  await scene.play(new ReplacementTransform(firstLine, equation), new FadeOut(secondLine));
  await scene.wait(3);

  setAnimating(false);
});

// Demo 5: Function Graph
document.getElementById('demo5').addEventListener('click', async () => {
  if (isAnimating) return;
  setAnimating(true);
  scene.clear();

  const axes = new Axes({
    xRange: [-3, 3, 1],
    yRange: [-5, 5, 1],
    xLength: 8,
    yLength: 6,
    color: BLUE,
    tips: true,
  });

  const graph = new FunctionGraph({
    func: (x) => x * x,
    xRange: [-2.2, 2.2],
    color: WHITE,
    axes: axes,
  });

  const graphLabel = new MathTex({ latex: 'x^2', fontSize: 32, color: WHITE });
  graphLabel.shift([4.5, 2, 0]);

  const graph2 = new FunctionGraph({
    func: (x) => x * x * x,
    xRange: [-1.7, 1.7],
    color: WHITE,
    axes: axes,
  });

  const graphLabel2 = new MathTex({ latex: 'x^3', fontSize: 32, color: WHITE });
  graphLabel2.shift([4.5, 2, 0]);

  await graphLabel.waitForRender();
  await graphLabel2.waitForRender();

  await scene.play(new Create(axes), new Create(graph), new FadeIn(graphLabel));
  await scene.wait(1);
  await scene.play(new Transform(graph, graph2), new Transform(graphLabel, graphLabel2));
  await scene.wait(1);

  setAnimating(false);
});

// Run first demo on load
document.getElementById('demo1').click();

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
