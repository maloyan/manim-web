import {
  Scene,
  Axes,
  Line,
  DecimalNumber,
  MovablePoint,
  Slider,
  ValueTracker,
  BLUE,
  YELLOW,
  WHITE,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

// Axes for a graph of y = amp * sin(x).
const axes = new Axes({
  xRange: [-5, 5, 1],
  yRange: [-3, 3, 1],
  tips: false,
});

// Bound values that the interactive controls drive.
const ampTracker = new ValueTracker(2); // slider controls the amplitude
const xTracker = new ValueTracker(1); // movable point controls the sample x

const graphFn = (x: number): number => ampTracker.getValue() * Math.sin(x);

// Dependent objects read the trackers through updaters (the existing path).
// A vertical line from the x axis up to the curve at the sampled x.
const stem = new Line({ start: [0, 0, 0], end: [0, 0, 0], color: YELLOW });
stem.addUpdater(() => {
  const x = xTracker.getValue();
  const base = axes.c2p(x, 0);
  const top = axes.c2p(x, graphFn(x));
  stem.setStart(base);
  stem.setEnd(top);
});

// A readout of the current value y = amp * sin(x).
const readout = new DecimalNumber({ value: graphFn(1), numDecimalPlaces: 2, color: WHITE });
readout.addUpdater(() => {
  const x = xTracker.getValue();
  readout.setValue(graphFn(x));
  readout.moveTo([axes.c2p(x, graphFn(x))[0] + 0.6, axes.c2p(x, graphFn(x))[1] + 0.4, 0]);
});

// The curve itself, rebuilt from the amplitude on each change.
const curve = axes.plot(graphFn, { color: BLUE });

// The movable point, constrained to the curve as a function graph.
const point = new MovablePoint(scene, {
  point: axes.c2p(1, graphFn(1)),
  color: YELLOW,
  onChange: (pos) => {
    // Convert the dragged world position back to an x value on the curve.
    const coords = axes.pointToCoords(pos);
    xTracker.setValue(coords[0]);
    syncDependents();
  },
});
point.constrainToFunction((worldX: number) => {
  const coords = axes.pointToCoords([worldX, 0, 0]);
  return axes.c2p(coords[0], graphFn(coords[0]))[1];
});

// The amplitude slider, an in-scene mobject bound to ampTracker.
const slider = new Slider(scene, {
  min: 0,
  max: 3,
  step: 0.1,
  value: 2,
  length: 4,
  center: [0, -2.6, 0],
  tracker: ampTracker,
  showLabel: true,
  color: BLUE,
  onChange: () => {
    rebuildCurve();
    syncDependents();
  },
});

function rebuildCurve(): void {
  const next = axes.plot(graphFn, { color: BLUE });
  curve.become(next);
}

function syncDependents(): void {
  stem.update(0);
  readout.update(0);
  scene.render();
}

scene.add(axes, curve, stem, readout, point, slider);
scene.render();
syncDependents();

// Embed mode: strip chrome and fill the viewport.
if (new URLSearchParams(window.location.search).has('embed')) {
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
