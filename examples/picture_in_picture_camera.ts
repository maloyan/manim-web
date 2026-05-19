import {
  Camera2D,
  Circle,
  Create,
  GREEN,
  MultiCamera,
  PURPLE,
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

async function pictureInPictureExample(scene: Scene) {
  // Main camera: wide overview of the whole scene.
  const mainCamera = new Camera2D({ frameWidth: 14, frameHeight: 8, position: [0, 0, 10] });

  // PiP camera: zoomed-in inset that follows a moving target. `contain`
  // keeps the requested 4×4 frame fully visible inside the PiP square
  // viewport instead of letting MultiCamera stretch its width.
  const pipCamera = new Camera2D({
    frameWidth: 4,
    frameHeight: 4,
    position: [0, 0, 10],
    aspectMode: 'contain',
  });

  const mc = new MultiCamera();
  mc.setupPictureInPicture(mainCamera, pipCamera, 'top-right', 0.3);
  // Index 0 is the main viewport, index 1 is the PiP inset (per
  // setupPictureInPicture's add order). Highlight the PiP so users can
  // see where the inset camera is framing.
  mc.setViewportBorder(1, { borderColor: '#ffd54f', borderWidth: 3 });
  scene.useMultiCamera(mc);

  const square = new Square({ sideLength: 1.5, color: PURPLE, strokeWidth: 4 });
  const triangle = new Triangle({ color: GREEN, strokeWidth: 4 });
  triangle.shift([-4, 1, 0]);
  const orbiter = new Circle({ radius: 0.35, color: YELLOW, strokeWidth: 4 });

  // ValueTracker drives the orbiter; the PiP camera follows it via updater.
  const t = new ValueTracker(0);
  orbiter.addUpdater(() => {
    const a = t.getValue();
    orbiter.moveTo([3 * Math.cos(a), 2 * Math.sin(a), 0]);
    const p = orbiter.getCenter();
    pipCamera.position.set(p[0], p[1], 10);
  });
  scene.add(t, square, triangle, orbiter);

  await scene.play(new Create(square));
  await scene.play(new Create(triangle));
  await scene.play(new Create(orbiter));
  await scene.play(t.animateTo(Math.PI * 4, { duration: 4 }));
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
    await pictureInPictureExample(scene);
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
