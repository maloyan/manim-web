import { Dot3D, ThreeDAxes, ThreeDScene, makeDraggable } from '../../src/index';

const container = document.getElementById('container') as HTMLElement;
const posLabel = document.getElementById('pos') as HTMLElement;

const scene = new ThreeDScene(container, {
  width: 720,
  height: 540,
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

const dot = new Dot3D({ radius: 0.15, color: '#fb4934' }).moveTo(axes.coordsToPoint(1, 1, 1));

makeDraggable(dot, scene, {
  constrainX: [-3, 3],
  constrainY: [-3, 3],
  constrainZ: [-3, 3],
  onDrag: (_m, pos) => {
    posLabel.textContent = `position: (${pos[0].toFixed(3)}, ${pos[1].toFixed(3)}, ${pos[2].toFixed(3)})`;
  },
});

scene.add(axes, dot);
scene.wait(Infinity);
