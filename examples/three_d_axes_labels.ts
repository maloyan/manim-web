import { ThreeDAxes, ThreeDScene } from '../src/index.ts';

const container = document.getElementById('container');
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#191919',
  phi: 75 * (Math.PI / 180),
  theta: -45 * (Math.PI / 180),
  distance: 24,
  fov: 35,
  enableOrbitControls: true,
});

const axes = new ThreeDAxes({
  xRange: [-5, 5, 1],
  yRange: [-5, 5, 1],
  zRange: [-5, 5, 1],
  showLabels: true,
  xColor: '#ff6b6b',
  yColor: '#6bcb77',
  zColor: '#4d96ff',
});

scene.add(axes);

// Opt-in Manim CE `shift_onto_screen` equivalent: pull any axis label back
// toward the origin if it would render outside the viewport.
// Called after the first render so MathTex sizes exist and the camera matrix
// is up-to-date.
await scene.wait(0.05);
axes.shiftLabelsOntoScreen(scene.camera3D.getCamera());

await scene.wait(Infinity);
