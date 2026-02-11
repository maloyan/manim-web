import {
  Scene,
  Create,
  FadeIn,
  FadeOut,
  Transform,
  ApplyPointwiseFunction,
  Text,
  MathTex,
  NumberPlane,
  VGroup,
  UP,
  DOWN,
  UL,
  BLACK,
  WHITE,
} from '../src/index.ts';

const FONT_URL = './fonts/KaTeX_Main-Regular.ttf';

const container = document.getElementById('container');
const status = document.getElementById('status');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

function log(msg) {
  status.textContent = msg;
  console.log('[OpeningManim]', msg);
}

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;
  scene.clear();

  try {
    // Part 1: Title and equation (Write title, FadeIn equation from below)
    log('Part 1: Title and equation...');
    const title = new Text({
      text: 'This is some LaTeX',
      fontSize: 48,
      color: WHITE,
      fontUrl: FONT_URL,
    });
    const basel = new MathTex({ latex: '\\sum_{n=1}^\\infty \\frac{1}{n^2} = \\frac{\\pi^2}{6}' });
    await basel.waitForRender?.();

    new VGroup(title, basel).arrange(DOWN);
    scene.add(title, basel);
    await scene.play(new FadeIn(title), new FadeIn(basel, { shift: DOWN }));
    await scene.wait(1);

    // Part 2: Transform title to UL corner, fade out equation downward
    log('Part 2: Transform title...');
    const transformTitle = new Text({
      text: 'That was a transform',
      fontSize: 48,
      color: WHITE,
      fontUrl: FONT_URL,
    });
    await transformTitle.loadGlyphs();
    transformTitle.toCorner(UL);
    await scene.play(new Transform(title, transformTitle), new FadeOut(basel, { shift: DOWN }));
    await scene.wait(1);

    // Part 3: Number plane grid with title
    log('Part 3: Number plane grid...');
    const grid = new NumberPlane();
    const gridTitle = new Text({
      text: 'This is a grid',
      fontSize: 72,
      color: WHITE,
      fontUrl: FONT_URL,
    });
    await gridTitle.loadGlyphs();
    gridTitle.moveTo(transformTitle);

    await scene.play(
      new FadeOut(title),
      new FadeIn(gridTitle, { shift: UP }),
      new Create(grid, { duration: 3, lagRatio: 0.1 }),
    );
    await scene.wait(1);

    // Part 4: Non-linear grid transform (sin warp)
    log('Part 4: Non-linear grid transform...');
    const gridTransformTitle = new Text({
      text: 'That was a non-linear function\napplied to the grid',
      fontSize: 48,
      color: WHITE,
      fontUrl: FONT_URL,
    });
    await gridTransformTitle.loadGlyphs();
    gridTransformTitle.moveTo(gridTitle, UL);
    grid.prepareForNonlinearTransform();
    await scene.play(
      new ApplyPointwiseFunction(
        grid,
        (p) => {
          return [p[0] + Math.sin(p[1]), p[1] + Math.sin(p[0]), p[2]];
        },
        { duration: 3 },
      ),
    );
    await scene.wait(1);

    // Part 5: Transform grid title to explain what happened
    log('Part 5: Grid transform title...');
    await scene.play(new Transform(gridTitle, gridTransformTitle));
    await scene.wait(1);

    log('Done!');
  } catch (err) {
    log('Error: ' + err.message);
    console.error(err);
  }

  isAnimating = false;
  document.getElementById('playBtn').disabled = false;
});

// Auto-play on load
document.getElementById('playBtn').click();

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
