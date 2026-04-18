import { Dot3D, MathTex, ThreeDAxes, ThreeDScene, UP, makeDraggable } from '../src/index.ts';

function addVectors(a: number[], b: number[]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scalarMult(a: number[], b: number): [number, number, number] {
  return [a[0] * b, a[1] * b, a[2] * b];
}

const container = document.getElementById('container')!;
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#191919',
  phi: 75 * (Math.PI / 180),
  theta: -45 * (Math.PI / 180),
  distance: 20,
  fov: 30,
  enableOrbitControls: true,
});

const axes = new ThreeDAxes({
  xRange: [-5, 5, 1],
  yRange: [-5, 5, 1],
  zRange: [-5, 5, 1],
  xLength: 10,
  yLength: 10,
  zLength: 10,
  showLabels: true,
});

const dot = new Dot3D({ radius: 0.1 }).moveTo(axes.coordsToPoint(1, 1, 1));
makeDraggable(dot, scene);

const lbl = new MathTex({ latex: 'r', fontSize: 0.2 }).addUpdater((mob) => {
  mob.moveTo(addVectors(dot.getCenter(), scalarMult(UP, 0.15)));
});

scene.add(axes, dot, lbl);
scene.addFixedOrientationMobjects(lbl);

await scene.wait(999999);
