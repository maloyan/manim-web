import {
  Scene,
  Circle,
  Square,
  Transform,
  ReplacementTransform,
  BLACK,
  RED,
  BLUE,
  GREEN,
  YELLOW,
} from '../src/index.ts';

const container = document.getElementById('container') as HTMLElement;
const status = document.getElementById('status') as HTMLPreElement;
const scene = new Scene(container, { width: 800, height: 450, backgroundColor: BLACK });

let busy = false;

function log(msg: string) {
  status.textContent = `${msg}\n${status.textContent}`.slice(0, 4000);
}

function describe(label: string) {
  const names: string[] = [];
  for (const m of scene.mobjects) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    names.push((m as any).constructor.name);
  }
  log(`${label}: scene has ${names.length} mobjects -> [${names.join(', ')}]`);
}

document.getElementById('playBtn')!.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  (document.getElementById('playBtn') as HTMLButtonElement).disabled = true;
  scene.clear();

  // Plain Transform: morphs visuals but the SOURCE stays in the scene.
  const a = new Circle({ radius: 1, color: RED }).shift([-2.5, 0, 0]);
  const aTarget = new Square({ sideLength: 1.5, color: GREEN }).shift([-2.5, 0, 0]);
  scene.add(a);
  describe('before Transform');
  await scene.play(new Transform(a, aTarget));
  describe('after  Transform     ');

  await scene.wait(0.4);

  // ReplacementTransform: source removed, target added (issue #308 fix).
  const b = new Circle({ radius: 1, color: BLUE }).shift([2.5, 0, 0]);
  const bTarget = new Square({ sideLength: 1.5, color: YELLOW }).shift([2.5, 0, 0]);
  scene.add(b);
  describe('before ReplacementTx');
  await scene.play(new ReplacementTransform(b, bTarget));
  describe('after  ReplacementTx');

  await scene.wait(0.6);

  busy = false;
  (document.getElementById('playBtn') as HTMLButtonElement).disabled = false;
});

document.getElementById('resetBtn')!.addEventListener('click', () => {
  scene.clear();
  status.textContent = 'cleared.';
});

if (new URLSearchParams(window.location.search).has('embed')) {
  setTimeout(() => (document.getElementById('playBtn') as HTMLButtonElement).click(), 400);
}
