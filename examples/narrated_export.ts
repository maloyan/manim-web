import {
  Scene,
  Circle,
  Square,
  Create,
  Transform,
  narrate,
  registerRender,
  BLUE,
  GREEN,
} from '../src/index.ts';

// Narrated export: two narration clips and a quiet music bed, placed on the
// audio timeline at "now", so a video export holds them in sync with the frames.
// Render it to a file with:
//   node scripts/render-example.mjs narrated_export --width 1080 --height 1080 --fps 30 --out out.mp4

const LINE_1 = './audio/narrated_export_line1.mp3';
const LINE_2 = './audio/narrated_export_line2.mp3';
const MUSIC = './audio/narrated_export_music.mp3';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

async function narratedExport(scene: Scene) {
  scene.clear();
  const audio = scene.audioManager;
  audio.clearTracks();

  // Music bed: a 4 s loop, quiet, for the whole 7 s scene.
  await audio.addSound(MUSIC, {
    time: audio.timelineNow(),
    gain: 0.25,
    loop: true,
    duration: 7,
    fadeIn: 0.5,
    fadeOut: 1,
  });
  await scene.wait(0.5);

  // Line 1 starts at about 0.5 s; the circle draws while it plays.
  const circle = new Circle({ radius: 1.5, color: BLUE, fillOpacity: 0.4 });
  await narrate(scene, LINE_1, { wait: false });
  await scene.play(new Create(circle, { duration: 2 }));
  await scene.wait(0.5);

  // Line 2 starts at about 3 s; the circle turns into a square.
  const square = new Square({ sideLength: 3, color: GREEN, fillOpacity: 0.4 });
  await narrate(scene, LINE_2, { wait: false });
  await scene.play(new Transform(circle, square, { duration: 2 }));
  await scene.wait(2);
}

// Opt in to command-line rendering (scripts/render-example.mjs).
registerRender(scene, { construct: narratedExport });

let isAnimating = false;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;

playBtn.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  playBtn.disabled = true;
  await narratedExport(scene);
  isAnimating = false;
  playBtn.disabled = false;
});

document.getElementById('resetBtn')!.addEventListener('click', () => {
  scene.clear();
  scene.audioManager.clearTracks();
});

// Embed mode: hide controls and start (audio may stay muted until a click).
if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls, h1')
    .forEach((el) => ((el as HTMLElement).style.display = 'none'));
  setTimeout(() => playBtn.click(), 500);
}
