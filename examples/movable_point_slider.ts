import {
  Scene,
  Circle,
  Text,
  MovablePoint,
  Slider,
  BLACK,
  BLUE,
  YELLOW,
  WHITE,
} from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

// A circle whose radius the slider drives.
let circle = new Circle({ radius: 1, color: BLUE });
circle.moveTo([-2.5, 0.5, 0]);

const readout = new Text({ text: 'point: (2.5, 0.5)', fontSize: 22, color: WHITE });
readout.moveTo([2.5, 2.2, 0]);

scene.add(circle, readout);
scene.render();

// A draggable point that reports its own position.
const point = new MovablePoint(scene, {
  point: [2.5, 0.5, 0],
  color: YELLOW,
  onChange: (pos) => {
    readout.setText(`point: (${pos[0].toFixed(1)}, ${pos[1].toFixed(1)})`);
    scene.render();
  },
});

// A slider that rebuilds the circle at the chosen radius.
const slider = new Slider(scene, {
  min: 0.25,
  max: 2,
  step: 0.05,
  value: 1,
  length: 4,
  center: [-2.5, -2.6, 0],
  color: BLUE,
  showLabel: true,
  onChange: (value) => {
    circle.become(new Circle({ radius: value, color: BLUE }).moveTo([-2.5, 0.5, 0]));
    scene.render();
  },
});

// The point and slider add themselves to the scene through their constructors.

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
