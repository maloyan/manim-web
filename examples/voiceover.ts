import {
  VoiceoverScene,
  Circle,
  Square,
  Create,
  Transform,
  BLACK,
  BLUE,
  RED,
} from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new VoiceoverScene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

const narrateBtn = document.getElementById('narrateBtn') as HTMLButtonElement;

narrateBtn.addEventListener('click', async () => {
  narrateBtn.disabled = true;
  scene.clear();

  const circle = new Circle({ radius: 1.5, color: BLUE, fillOpacity: 0.5 });
  const square = new Square({ sideLength: 3, color: RED, fillOpacity: 0.5 });

  // The narration drives the animation. Each bookmark marks the moment the
  // matching beat should play. waitForMark resolves when the voice reaches it.
  await scene.voiceover(
    "First we draw a <bookmark mark='circle'/> circle. " +
      "Then we morph it into a <bookmark mark='square'/> square.",
    async (tracker) => {
      await tracker.waitForMark('circle');
      await scene.play(new Create(circle, { duration: 1 }));

      await tracker.waitForMark('square');
      await scene.play(new Transform(circle, square, { duration: 1 }));
    },
  );

  narrateBtn.disabled = false;
});

// Embed mode: strip chrome and fill the viewport.
if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls')
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
}
