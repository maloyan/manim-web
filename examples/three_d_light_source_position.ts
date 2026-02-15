import * as THREE from 'three';
import { ThreeDAxes, ThreeDScene, Group, RED_D, RED_E } from '../src/index.ts';

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
    axisColor: '#ffffff',
    tipLength: 0.2,
    tipRadius: 0.08,
    shaftRadius: 0.01,
  });

  // Checkerboard sphere using THREE.SphereGeometry for proper topology
  // (no pole/seam artifacts that ParametricGeometry can produce)
  const widthSegs = 32;
  const heightSegs = 16;
  const geom = new THREE.SphereGeometry(1.5, widthSegs, heightSegs);
  // Convert to non-indexed for per-face checkerboard vertex colors
  const nonIndexed = geom.toNonIndexed();
  geom.dispose();

  const posAttr = nonIndexed.getAttribute('position');
  const colors = new Float32Array(posAttr.count * 3);
  const c1 = new THREE.Color(RED_D);
  const c2 = new THREE.Color(RED_E);

  // SphereGeometry: each quad = 2 triangles = 6 verts, except poles = 1 triangle = 3 verts
  // Layout: top cap (widthSegs triangles), then (heightSegs-2) rows of quads, then bottom cap
  let vi = 0;
  // Top cap: widthSegs triangles
  for (let i = 0; i < widthSegs; i++) {
    const c = i % 2 === 0 ? c1 : c2;
    for (let k = 0; k < 3; k++) {
      colors[vi * 3] = c.r;
      colors[vi * 3 + 1] = c.g;
      colors[vi * 3 + 2] = c.b;
      vi++;
    }
  }
  // Middle rows: (heightSegs - 2) rows × widthSegs quads × 6 verts
  for (let row = 0; row < heightSegs - 2; row++) {
    for (let col = 0; col < widthSegs; col++) {
      const c = (row + col) % 2 === 0 ? c1 : c2;
      for (let k = 0; k < 6; k++) {
        colors[vi * 3] = c.r;
        colors[vi * 3 + 1] = c.g;
        colors[vi * 3 + 2] = c.b;
        vi++;
      }
    }
  }
  // Bottom cap: widthSegs triangles
  for (let i = 0; i < widthSegs; i++) {
    const c = (i + (heightSegs - 2)) % 2 === 0 ? c1 : c2;
    for (let k = 0; k < 3; k++) {
      colors[vi * 3] = c.r;
      colors[vi * 3 + 1] = c.g;
      colors[vi * 3 + 2] = c.b;
      vi++;
    }
  }
  nonIndexed.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.FrontSide,
    emissive: new THREE.Color('#883333'),
    emissiveIntensity: 1.0,
  });
  const sphereMesh = new THREE.Mesh(nonIndexed, mat);

  // Wrap in Group so scene.add() works
  const sphere = new Group();
  sphere.getThreeObject().add(sphereMesh);

  // Multi-directional lighting to eliminate dark shadows (matches Python Manim)
  scene.lighting.removeAll();
  scene.lighting.addAmbient({ intensity: 3.0 });
  scene.lighting.addDirectional({ position: [0, 5, 3], intensity: 1.5 });
  scene.lighting.addDirectional({ position: [0, -3, -3], intensity: 1.0 });
  scene.lighting.addDirectional({ position: [-5, 0, 0], intensity: 0.5 });

  scene.add(axes);
  scene.add(sphere);

  // Re-enable depth testing for the 3D sphere mesh.
  // Scene.add() disables depthTest (correct for 2D), but this raw THREE.Mesh
  // needs it for proper 3D occlusion.
  mat.depthTest = true;
  mat.depthWrite = true;

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
