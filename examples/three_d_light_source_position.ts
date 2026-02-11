import * as THREE from 'three';
import { ThreeDAxes, ThreeDScene, Surface3D, RED_D, RED_E } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
  phi: 75 * (Math.PI / 180),
  theta: 30 * (Math.PI / 180),
  distance: 20,
  fov: 30,
});

async function threeDLightSourcePosition(scene: ThreeDScene) {
  const axes = new ThreeDAxes({
    xRange: [-5, 5, 1],
    yRange: [-5, 5, 1],
    zRange: [-5, 5, 1],
    xLength: 10,
    yLength: 10,
    zLength: 10,
    axisColor: '#ffffff',
    tipLength: 0.2,
    tipRadius: 0.08,
    shaftRadius: 0.01,
  });

  // Parametric sphere: radius 1.5
  // Python Manim convention: u = latitude [-PI/2, PI/2], v = longitude [0, TAU]
  // Manim coords: (x, y, z) where z is up
  // manim-js Surface3D renders in THREE.js space directly
  // THREE.js mapping from Manim: (mx, mz, -my)
  const sphere = new Surface3D({
    func: (u, v) => {
      // Manim coordinates
      const mx = 1.5 * Math.cos(u) * Math.cos(v);
      const my = 1.5 * Math.cos(u) * Math.sin(v);
      const mz = 1.5 * Math.sin(u);
      // Convert to THREE.js: (mx, mz, -my)
      return [mx, mz, -my];
    },
    uRange: [-Math.PI / 2, Math.PI / 2],
    vRange: [0, Math.PI * 2],
    uResolution: 15,
    vResolution: 32,
    checkerboardColors: [RED_D, RED_E],
  });

  // Python Manim: self.renderer.camera.light_source.move_to(3*IN)
  // IN = [0, 0, -1] in Manim 3D (Z-up), so 3*IN = [0, 0, -3]
  // THREE.js mapping: (mx, mz, -my) = (0, -3, 0)
  // Reduce roughness for brighter appearance matching Python Manim
  const threeObj = sphere.getThreeObject();
  threeObj.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshStandardMaterial;
      mat.roughness = 0.6;
    }
  });

  // Python Manim: self.renderer.camera.light_source.move_to(3*IN)
  // IN = [0, 0, -1] in Manim 3D (Z-up), so 3*IN = [0, 0, -3]
  // THREE.js mapping: (mx, mz, -my) = (0, -3, 0)
  scene.lighting.removeAll();
  scene.lighting.addAmbient({ intensity: 1.0 });
  scene.lighting.addDirectional({ position: [0, 5, 3], intensity: 2.5 });
  scene.lighting.addDirectional({ position: [-3, -5, 0], intensity: 0.5 });

  scene.add(axes);
  scene.add(sphere);
  await scene.wait();
}

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  scene.clear();
  await threeDLightSourcePosition(scene);

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
  const svg = cont && cont.querySelector('svg');
  if (svg) {
    (svg as HTMLElement).style.width = '100%';
    (svg as HTMLElement).style.height = '100%';
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  if (cont) {
    new MutationObserver((_, obs) => {
      const s = cont.querySelector('svg');
      if (s) {
        (s as HTMLElement).style.width = '100%';
        (s as HTMLElement).style.height = '100%';
        s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        obs.disconnect();
      }
    }).observe(cont, { childList: true, subtree: true });
  }
  const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!playBtn.disabled) setTimeout(() => playBtn.click(), 2000);
    }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}
