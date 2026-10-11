import {
  Scene,
  NumberPlane,
  Arrow,
  Dot,
  MovablePoint,
  MatrixTracker,
  applyMatrixLive,
  GREEN,
  RED,
  YELLOW,
} from '../src/index.ts';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

// A full-frame coordinate grid. Its data space equals world space (1 unit = 1),
// so a dragged world position reads directly as a basis vector.
const plane = new NumberPlane({
  xRange: [-7, 7, 1],
  yRange: [-4, 4, 1],
  backgroundLineStyle: { color: '#3b6ea5', strokeWidth: 1 },
});
scene.add(plane);

// The two draggable basis vectors. Dragging them morphs the whole grid live.
const iPoint = new MovablePoint(scene, { point: [1, 0, 0], color: GREEN, onChange: syncAll });
const jPoint = new MovablePoint(scene, { point: [0, 1, 0], color: RED, onChange: syncAll });

// A live matrix whose columns are the two basis vectors.
const tracker = MatrixTracker.fromBasisVectors(iPoint, jPoint);

// A dependent point that rides the transform: it sits at (2, 1) under the
// identity and lands on the transformed (2, 1) as the grid morphs.
const riderBase: [number, number, number] = [2, 1, 0];
const rider = new Dot({ point: riderBase, color: YELLOW, radius: 0.12 });

// Bind the plane to the live matrix. remap() runs on every re-map and renders.
const binding = applyMatrixLive(plane, tracker, {
  dependents: [{ mobject: rider, base: riderBase }],
});

// Arrows drawn from the origin to each basis vector, rebuilt on each change.
const iArrow = makeBasisArrow(iPoint.getPoint(), GREEN);
const jArrow = makeBasisArrow(jPoint.getPoint(), RED);

scene.add(iArrow, jArrow, rider);
scene.add(iPoint, jPoint);

function makeBasisArrow(end: [number, number, number], color: string): Arrow {
  return new Arrow({
    start: [0, 0, 0],
    end,
    color,
    tipLength: 0.25,
    tipWidth: 0.16,
    strokeWidth: 5,
  });
}

function syncAll(): void {
  // Re-map the grid and the rider from the live basis vectors.
  binding.update();
  // Rebuild the basis arrows to point at the dragged vectors.
  iArrow.become(makeBasisArrow(iPoint.getPoint(), GREEN));
  jArrow.become(makeBasisArrow(jPoint.getPoint(), RED));
  scene.render();
}

syncAll();

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
