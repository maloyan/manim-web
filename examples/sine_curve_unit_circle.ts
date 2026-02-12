import {
  Scene,
  Circle,
  Dot,
  Line,
  VGroup,
  MathTex,
  BLACK,
  BLUE,
  RED,
  YELLOW,
  YELLOW_A,
  YELLOW_D,
  DOWN,
} from '../src/index.ts';

const TAU = 2 * Math.PI;

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

let isAnimating = false;

document.getElementById('playBtn').addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;
  document.getElementById('playBtn').disabled = true;

  try {
    scene.clear();

    // --- Axes ---
    const xAxis = new Line({ start: [-6, 0, 0], end: [6, 0, 0] });
    const yAxis = new Line({ start: [-4, -2, 0], end: [-4, 2, 0] });
    scene.add(xAxis, yAxis);

    // --- X labels ---
    const xLabels = [
      new MathTex({ latex: '\\pi' }),
      new MathTex({ latex: '2\\pi' }),
      new MathTex({ latex: '3\\pi' }),
      new MathTex({ latex: '4\\pi' }),
    ];
    for (let i = 0; i < xLabels.length; i++) {
      xLabels[i].nextTo([-1 + 2 * i, 0, 0], DOWN, 0.4);
      scene.add(xLabels[i]);
    }

    const originPoint = [-4, 0, 0];
    const curveStart = [-3, 0, 0];

    // --- Circle ---
    const circle = new Circle({ radius: 1, center: originPoint, color: RED });
    scene.add(circle);

    // --- Dot orbiting the circle ---
    let tOffset = 0;
    const rate = 0.25;

    const dot = new Dot({
      radius: 0.08,
      color: YELLOW,
      point: circle.pointAtAngle(0),
    });

    const goAroundCircle = (_mob, dt) => {
      tOffset += dt * rate;
      dot.moveTo(circle.pointAtAngle((tOffset % 1) * TAU));
    };
    dot.addUpdater(goAroundCircle);

    // --- Line from origin to dot (always_redraw equivalent) ---
    const originToCircleLine = new Line({
      start: originPoint,
      end: dot.getPoint(),
      color: BLUE,
    });
    originToCircleLine.addUpdater(() => {
      originToCircleLine.setStart(originPoint);
      originToCircleLine.setEnd(dot.getPoint());
    });

    // --- Line from dot to curve (always_redraw equivalent) ---
    const dotToCurveLine = new Line({
      start: dot.getPoint(),
      end: dot.getPoint(),
      color: YELLOW_A,
      strokeWidth: 2,
    });
    dotToCurveLine.addUpdater(() => {
      const x = curveStart[0] + tOffset * 4;
      const y = dot.getPoint()[1];
      dotToCurveLine.setStart(dot.getPoint());
      dotToCurveLine.setEnd([x, y, 0]);
    });

    // --- Growing sine curve ---
    const curve = new VGroup();
    curve.add(new Line({ start: curveStart, end: curveStart, color: YELLOW_D }));
    let lastEnd = [...curveStart];

    curve.addUpdater(() => {
      const x = curveStart[0] + tOffset * 4;
      const y = dot.getPoint()[1];
      const newLine = new Line({
        start: lastEnd,
        end: [x, y, 0],
        color: YELLOW_D,
      });
      curve.add(newLine);
      lastEnd = [x, y, 0];
    });

    // Add in order: dot first so tOffset/position updates before lines read it
    scene.add(dot, originToCircleLine, dotToCurveLine, curve);

    await scene.wait(8.5);

    dot.removeUpdater(goAroundCircle);
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
    .forEach((el) => (el.style.display = 'none'));
  document.documentElement.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000';
  document.body.style.cssText =
    'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center';
  const cont = document.getElementById('container');
  if (cont) {
    cont.style.cssText =
      'border:none;border-radius:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center';
  }
  const svg = cont && cont.querySelector('svg');
  if (svg) {
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  if (cont) {
    new MutationObserver((_, obs) => {
      const s = cont.querySelector('svg');
      if (s) {
        s.style.width = '100%';
        s.style.height = '100%';
        s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        obs.disconnect();
      }
    }).observe(cont, { childList: true, subtree: true });
  }
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    setTimeout(() => playBtn.click(), 500);
    new MutationObserver(() => {
      if (!playBtn.disabled) setTimeout(() => playBtn.click(), 2000);
    }).observe(playBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}
