import {
  BLUE,
  Camera2D,
  Circle,
  Create,
  RED,
  Scene,
  SplitScreenCamera,
  Square,
  YELLOW,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#1a1a2e',
});

async function splitScreenCameraExample(scene: Scene) {
  // Two independent Camera2D instances framing the same scene at
  // different zoom levels. With `aspectMode: 'contain'` the per-camera
  // frameWidth/frameHeight is honoured at render time (the viewport
  // letterboxes if it doesn't match), so the zoom intent — wide
  // overview on the left, tight zoom on the right — actually shows up
  // on screen.
  const leftCamera = new Camera2D({
    frameWidth: 14,
    frameHeight: 8,
    position: [-3, 0, 10],
    aspectMode: 'contain',
  });
  const rightCamera = new Camera2D({
    frameWidth: 4,
    frameHeight: 4,
    position: [3, 0, 10],
    aspectMode: 'contain',
  });

  const split = new SplitScreenCamera({
    leftCamera,
    rightCamera,
    split: 'horizontal',
    splitRatio: 0.5,
  });
  const mc = split.getMultiCamera();
  // Draw a thin border around each pane so the split is visible even
  // when one side renders the scene background edge-to-edge.
  mc.setViewportBorder(0, { borderColor: '#888888', borderWidth: 2 });
  mc.setViewportBorder(1, { borderColor: '#888888', borderWidth: 2 });
  scene.useMultiCamera(mc);

  const circle = new Circle({ radius: 1, color: RED, strokeWidth: 4 });
  circle.shift([-3, 0, 0]);
  const square = new Square({ sideLength: 1.5, color: BLUE, strokeWidth: 4 });
  square.shift([3, 0, 0]);
  const marker = new Circle({ radius: 0.15, color: YELLOW, strokeWidth: 3 });

  scene.add(marker);
  await scene.play(new Create(circle));
  await scene.play(new Create(square));
  await scene.wait(0.8);
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;
  try {
    scene.useMultiCamera(null);
    scene.clear();
    await splitScreenCameraExample(scene);
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
