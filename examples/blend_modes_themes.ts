import { Scene, Circle, setTheme, RED, GREEN, BLUE } from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#000000',
});

// Three overlapping circles. Additive blending makes the overlaps glow, the
// way light mixes.
const red = new Circle({ radius: 1.4, color: RED, fillOpacity: 0.9 });
red.moveTo([-0.8, 0.5, 0]);

const green = new Circle({ radius: 1.4, color: GREEN, fillOpacity: 0.9 });
green.moveTo([0.8, 0.5, 0]);

const blue = new Circle({ radius: 1.4, color: BLUE, fillOpacity: 0.9 });
blue.moveTo([0, -0.8, 0]);

for (const circle of [red, green, blue]) {
  circle.setBlendMode('additive');
}

scene.add(red, green, blue);
scene.render();

// Each button re-skins the scene with a built-in theme. Passing { scene }
// recolors every mobject and the background at once.
document.querySelectorAll<HTMLButtonElement>('.controls button').forEach((btn) => {
  btn.addEventListener('click', () => {
    setTheme(btn.dataset.theme ?? 'default', { scene });
    scene.render();
  });
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
