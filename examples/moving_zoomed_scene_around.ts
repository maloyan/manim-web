import {
  BackgroundRectangle,
  BLACK,
  Create,
  Dot,
  DOWN,
  FadeIn,
  FadeOut,
  ImageMobject,
  MED_SMALL_BUFF,
  PURPLE,
  RED,
  RIGHT,
  Scale,
  ScaleInPlace,
  Shift,
  smooth,
  Text,
  UL,
  Uncreate,
  UP,
  UpdateFromFunc,
  ZoomedScene,
  scaleVec,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new ZoomedScene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
  zoomFactor: 0.3,
  displayWidth: 6,
  displayHeight: 1,
  cameraFrameStrokeWidth: 3,
  displayFrameStrokeWidth: 3,
  displayFrameColor: RED,
});

async function movingZoomedSceneAround(scene: ZoomedScene) {
  // Grayscale image matching Python: np.uint8([[0, 100, 30, 200], [255, 0, 5, 33]])
  const image = new ImageMobject({
    pixelData: [
      [0, 100, 30, 200],
      [255, 0, 5, 33],
    ],
    height: 7,
  });

  const dot = new Dot().shift(scaleVec(2, UL));

  const frameText = new Text({ text: 'Frame', color: PURPLE, fontSize: 67 });
  const zoomedCameraText = new Text({ text: 'Zoomed camera', color: RED, fontSize: 67 });

  scene.add(image, dot);

  const zoomedCamera = scene.zoomedCamera;
  const zoomedDisplay = scene.zoomedDisplay;
  const frame = zoomedCamera.frame;
  const zoomedDisplayFrame = zoomedDisplay.displayFrame;

  frame.moveTo(dot);
  frame.setColor(PURPLE);
  zoomedDisplayFrame.setColor(RED);
  zoomedDisplay.shift(DOWN);

  const zdRect = new BackgroundRectangle(zoomedDisplay, {
    fillOpacity: 0,
    buff: MED_SMALL_BUFF,
  });
  scene.addForegroundMobject(zdRect);

  const unfoldCamera = new UpdateFromFunc(zdRect, (rect) => {
    rect.replace(zoomedDisplay);
  });

  frameText.nextTo(frame, DOWN);

  await scene.play(new Create(frame), new FadeIn(frameText, { shift: UP }));
  scene.activateZooming();

  // Pop-out animation: display pops from frame position to its shifted position
  await scene.play(scene.getZoomedDisplayPopOutAnimation(), unfoldCamera);

  zoomedCameraText.nextTo(zoomedDisplayFrame, DOWN);
  await scene.play(new FadeIn(zoomedCameraText, { shift: UP }));

  // Scale frame and display non-uniformly
  await scene.play(
    new Scale(frame, { scaleFactor: [0.5, 1.5, 0] }),
    new Scale(zoomedDisplay, { scaleFactor: [0.5, 1.5, 0] }),
    new FadeOut(zoomedCameraText),
    new FadeOut(frameText),
  );
  await scene.wait();

  await scene.play(new ScaleInPlace(zoomedDisplay, { scaleFactor: 2 }));
  await scene.wait();

  await scene.play(new Shift(frame, { direction: scaleVec(2.5, RIGHT) }));
  await scene.wait();

  // Reverse pop-out: move display back to frame
  await scene.play(
    scene.getZoomedDisplayPopOutAnimation({ rateFunc: (t: number) => smooth(1 - t) }),
    unfoldCamera,
  );
  await scene.play(new Uncreate(zoomedDisplayFrame), new FadeOut(frame));
  await scene.wait();
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await movingZoomedSceneAround(scene);

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
