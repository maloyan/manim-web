import {
  BLUE,
  Camera2D,
  Circle,
  Create,
  GREEN,
  MultiCamera,
  ORANGE,
  RED,
  Scene,
  Square,
  Triangle,
  ValueTracker,
  YELLOW,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#1a1a2e',
});

async function quadViewExample(scene: Scene) {
  // Four Camera2D instances framing the same scene at different positions
  // and zoom levels — a "control room" layout. setupQuadView() places them
  // in viewport order [top-left, top-right, bottom-left, bottom-right] on
  // the canvas, so the variable names below describe the on-screen pane,
  // not the world region the camera looks at.
  const overviewPane = new Camera2D({ frameWidth: 14, frameHeight: 8, position: [0, 0, 10] });
  const circlePane = new Camera2D({ frameWidth: 4, frameHeight: 4, position: [-3, 2, 10] });
  const squarePane = new Camera2D({ frameWidth: 4, frameHeight: 4, position: [3, 2, 10] });
  const trianglePane = new Camera2D({ frameWidth: 6, frameHeight: 4, position: [0, -2, 10] });

  const mc = new MultiCamera();
  mc.setupQuadView([overviewPane, circlePane, squarePane, trianglePane]);
  scene.useMultiCamera(mc);

  const circle = new Circle({ radius: 0.9, color: RED, strokeWidth: 4 });
  circle.shift([-3, 2, 0]);
  const square = new Square({ sideLength: 1.4, color: BLUE, strokeWidth: 4 });
  square.shift([3, 2, 0]);
  const triangle = new Triangle({ color: GREEN, strokeWidth: 4 });
  triangle.shift([0, -2, 0]);
  const ball = new Circle({ radius: 0.25, color: YELLOW, strokeWidth: 3 });

  // Animate a "ball" bouncing between the three regions; each quad-view
  // close-up shows the ball passing through its quadrant in detail.
  const t = new ValueTracker(0);
  ball.addUpdater(() => {
    const a = t.getValue();
    const path: Array<[number, number]> = [
      [-3, 2],
      [3, 2],
      [0, -2],
      [-3, 2],
    ];
    const seg = Math.floor(a) % (path.length - 1);
    const f = a - Math.floor(a);
    const [x0, y0] = path[seg];
    const [x1, y1] = path[seg + 1];
    ball.moveTo([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, 0]);
  });
  scene.add(t);

  // Highlight marker that stays at world origin so the overview pane has
  // a visible reference point too.
  const marker = new Circle({ radius: 0.12, color: ORANGE, strokeWidth: 2 });
  scene.add(marker);

  scene.add(circle, square, triangle, ball);
  await scene.play(new Create(circle));
  await scene.play(new Create(square));
  await scene.play(new Create(triangle));
  await scene.play(new Create(ball));
  await scene.play(t.animateTo(3, { duration: 4 }));
  await scene.wait(0.5);
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;
  try {
    scene.useMultiCamera(null);
    scene.clear();
    await quadViewExample(scene);
  } finally {
    isAnimating = false;
    document.getElementById('playBtn').disabled = false;
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  scene.useMultiCamera(null);
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
  if (cont) {
    cont.style.cssText =
      'border:none;border-radius:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center';
  }
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!playBtn.disabled) setTimeout(() => playBtn.click(), 2000);
    }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}
