import {
  Scene,
  Circle,
  Square,
  Dot,
  Line,
  Text,
  makeDraggable,
  BLUE,
  GREEN,
  RED,
  YELLOW,
  WHITE,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  try {
    scene.clear();

    // Create draggable objects
    const circle = new Circle({ radius: 0.5, color: BLUE, fillOpacity: 0.8 });
    circle.moveTo([-2, 1, 0]);

    const square = new Square({ sideLength: 0.8, color: GREEN, fillOpacity: 0.8 });
    square.moveTo([2, 1, 0]);

    const dot = new Dot({ color: YELLOW, radius: 0.15 });
    dot.moveTo([0, -1, 0]);

    // A line that connects the circle and dot, updating in real time
    const line = new Line({ start: circle.getCenter(), end: dot.getCenter() }).setColor(RED);
    line.addUpdater(() => {
      line.become(new Line({ start: circle.getCenter(), end: dot.getCenter() }));
    });

    // Label
    const label = new Text({ text: 'Drag the shapes!', fontSize: 24, color: WHITE });
    label.moveTo([0, 2.5, 0]);

    scene.add(circle, square, dot, line, label);
    scene.render();

    // Make objects draggable
    makeDraggable(circle, scene);
    makeDraggable(dot, scene);

    // Square is constrained to X axis only
    makeDraggable(square, scene, {
      constrainY: [1, 1],
      snapToGrid: 0.5,
    });
  } catch (e) {
    console.error('ERROR:', e.message, e.stack);
  }

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
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    setTimeout(() => (playBtn as HTMLButtonElement).click(), 500);
  }
}
