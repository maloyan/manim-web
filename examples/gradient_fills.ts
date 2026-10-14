import { Scene, Circle, RoundedRectangle } from '../src/index.ts';
import type { FillGradientSpec } from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#101020',
});

// Two palettes. Each one is a list of gradient stops.
const palettes = [
  ['#ff5252', '#ffd740', '#40c4ff'],
  ['#e040fb', '#536dfe', '#1de9b6'],
];
let paletteIndex = 0;
let angle = 0;
let flat = false;

// Left: a rounded rectangle with a linear gradient.
const linearShape = new RoundedRectangle({
  width: 3,
  height: 2.2,
  cornerRadius: 0.4,
  color: '#ffffff',
  fillOpacity: 1,
  strokeWidth: 2,
});
linearShape.moveTo([-3.4, 0, 0]);

// Middle: a circle with a radial gradient. The highlight sits up and left.
const radialShape = new Circle({ radius: 1.2, color: '#ffffff', fillOpacity: 1, strokeWidth: 2 });
radialShape.moveTo([0, 0, 0]);

// Right: a blob with a real radial gradient (one shape, no stacked layers).
const blob = new RoundedRectangle({
  width: 2.6,
  height: 2,
  cornerRadius: 0.7,
  color: '#ffffff',
  fillOpacity: 1,
  strokeWidth: 0,
});
blob.moveTo([3.4, 0, 0]);

function specs(): FillGradientSpec[] {
  const [a, b, c] = palettes[paletteIndex];
  return [
    {
      type: 'linear',
      angle,
      stops: [
        { offset: 0, color: a },
        { offset: 0.5, color: b },
        { offset: 1, color: c },
      ],
    },
    {
      type: 'radial',
      center: [0.35, 0.65],
      radius: 0.7,
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 0.4, color: b },
        { offset: 1, color: c },
      ],
    },
    {
      type: 'radial',
      center: [0.4, 0.6],
      radius: 0.75,
      stops: [
        { offset: 0, color: '#ffcdd2' },
        { offset: 1, color: '#b71c1c' },
      ],
    },
  ];
}

function apply(): void {
  const shapes = [linearShape, radialShape, blob];
  const list = specs();
  shapes.forEach((shape, i) => {
    shape.setFillGradient(flat ? null : list[i]);
    shape.fillColor = '#888888';
  });
  scene.render();
}

scene.add(linearShape, radialShape, blob);
apply();

document.getElementById('rotate')?.addEventListener('click', () => {
  angle += Math.PI / 4;
  apply();
});
document.getElementById('palette')?.addEventListener('click', () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  apply();
});
document.getElementById('flat')?.addEventListener('click', () => {
  flat = !flat;
  apply();
});

// Embed mode: strip chrome and fill the viewport.
if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls')
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
}
