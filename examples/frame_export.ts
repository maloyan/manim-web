import {
  Scene,
  Circle,
  Square,
  Create,
  Transform,
  Timeline,
  exportAndDownloadPNG,
  exportPNGSequence,
  WebCodecsExporter,
  downloadBlob,
  BLACK,
  BLUE,
  GREEN,
} from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

const status = document.getElementById('status')!;

// Install a short timeline the exporters can seek through. Each exporter seeks
// to a frame time, then captures the canvas.
function installTimeline(): number {
  scene.clear();
  const square = new Square({ sideLength: 2.5, color: BLUE, fillOpacity: 0.5 });
  const circle = new Circle({ radius: 1.25, color: GREEN, fillOpacity: 0.5 });
  scene.add(square);
  const timeline = new Timeline();
  timeline.add(new Create(square, { duration: 1 }), '>');
  timeline.add(new Transform(square, circle, { duration: 1 }), '>');
  scene.setTimeline(timeline);
  return timeline.getDuration();
}

const duration = installTimeline();
scene.seek(duration);

// Download one PNG of the current frame.
document.getElementById('pngBtn')!.addEventListener('click', async () => {
  await exportAndDownloadPNG(scene, 'frame.png', { time: duration });
  status.textContent = 'Saved frame.png';
});

// Render every frame of the timeline to a PNG Blob array.
document.getElementById('seqBtn')!.addEventListener('click', async () => {
  const frames = await exportPNGSequence(scene, {
    fps: 30,
    from: 0,
    to: duration,
    onProgress: (p) => (status.textContent = `Rendering ${Math.round(p * 100)}%`),
  });
  status.textContent = `Rendered ${frames.length} PNG frames`;
});

// Encode an MP4 with the WebCodecs API when the browser supports it.
document.getElementById('mp4Btn')!.addEventListener('click', async () => {
  if (!WebCodecsExporter.isSupported()) {
    status.textContent = 'WebCodecs is not available in this browser';
    return;
  }
  const exporter = new WebCodecsExporter(scene, {
    fps: 30,
    format: 'mp4',
    duration,
    onProgress: (p) => (status.textContent = `Encoding ${Math.round(p * 100)}%`),
  });
  const blob = await exporter.export();
  downloadBlob(blob, 'animation.mp4');
  status.textContent = 'Saved animation.mp4';
});

// Embed mode: strip chrome and fill the viewport.
if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls, #status')
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
