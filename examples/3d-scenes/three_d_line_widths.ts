import {
  BLUE,
  GREEN,
  Line3D,
  RED,
  ThreeDAxes,
  ThreeDScene,
  YELLOW,
} from "../../src/index.ts";

// Demo for issue #361: Line3D `lineWidth` now renders correctly on every
// WebGL platform by going through Line2 + LineMaterial.

const container = document.getElementById("container");
const scene = new ThreeDScene(container, {
  width: 800,
  height: 450,
  backgroundColor: "#191919",
  phi: 75 * (Math.PI / 180),
  theta: -45 * (Math.PI / 180),
  distance: 20,
  fov: 30,
  enableOrbitControls: true,
  orbitControlsUp: "z",
});

const axes = new ThreeDAxes({
  xRange: [-5, 5, 1],
  yRange: [-5, 5, 1],
  zRange: [-5, 5, 1],
  xLength: 10,
  yLength: 10,
  zLength: 10,
  showTicks: false,
});

const thin = new Line3D({
  start: [0, 0, 0],
  end: [3, 0, 0],
  color: YELLOW,
  lineWidth: 1,
});
const medium = new Line3D({
  start: [0, 0, 0],
  end: [0, 3, 0],
  color: GREEN,
  lineWidth: 6,
});
const thick = new Line3D({
  start: [0, 0, 0],
  end: [0, 0, 3],
  color: RED,
  lineWidth: 16,
});
const extra = new Line3D({
  start: [0, 0, 0],
  end: [2, 2, 2],
  color: BLUE,
  lineWidth: 32,
});

scene.add(axes, thin, medium, thick, extra);
await scene.wait(Infinity);
