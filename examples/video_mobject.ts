import { Scene, VideoMobject, BLACK } from '../src/index.ts';

// Replace this with the URL of your own video. A cross-origin URL must send
// CORS headers so the canvas stays readable for export.
const VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

// VideoMobject draws a <video> onto a plane. It moves, scales, and rotates
// like any other mobject.
const video = new VideoMobject({
  src: VIDEO_URL,
  width: 5,
  loop: true,
  muted: true,
});

scene.add(video);
scene.render();

const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;

playBtn.addEventListener('click', async () => {
  await video.waitForLoad();
  video.play();
});

pauseBtn.addEventListener('click', () => {
  video.pause();
});

// Embed mode: strip chrome, fill the viewport, and autoplay.
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
  video.waitForLoad().then(() => video.play());
}
