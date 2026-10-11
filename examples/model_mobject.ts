import { ThreeDScene, ThreeDAxes, ModelMobject, Rotate } from '../src/index.ts';

// Replace this with the URL of your own .glb, .gltf, or .obj file.
const MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb';

const container = document.getElementById('container')!;
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
});

const axes = new ThreeDAxes({
  xRange: [-4, 4, 1],
  yRange: [-4, 4, 1],
  zRange: [-3, 3, 1],
});
scene.add(axes);
scene.render();

const loadBtn = document.getElementById('loadBtn') as HTMLButtonElement;

loadBtn.addEventListener('click', async () => {
  loadBtn.disabled = true;

  // fromUrl picks the loader from the file extension. The default loaders are
  // the Three.js example loaders, imported on demand.
  const model = await ModelMobject.fromUrl(MODEL_URL, {
    scale: 1.5,
    upAxis: 'y',
    center: true,
  });

  scene.add(model);
  await scene.play(new Rotate(model, { angle: Math.PI * 2, duration: 4 }));

  loadBtn.disabled = false;
});

// Embed mode: strip chrome, fill the viewport, and autoload.
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
  setTimeout(() => loadBtn.click(), 500);
}
