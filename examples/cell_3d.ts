/**
 * A cutaway animal cell from the 3D cell kit.
 *
 * `new Cell3D({ preset: 'animal' })` places the nucleus, rough and smooth ER,
 * Golgi, centrosome, mitochondria, lysosomes, peroxisomes, vesicles and a
 * crowd of free ribosomes inside a cut-open membrane. Drag to orbit.
 * "Build the cell" plays `cell.buildAnimation()` (one organelle at a time),
 * then a short CellTour (an ExplainerTour that clears the free ribosomes in
 * front of each organelle) over three organelles with their default
 * captions and one named callout each.
 *
 * URL options: `?detail=low|medium|high`, `?cutaway=bowl|wedge|none`,
 * `?cytoskeleton`, `?auto` (play on load).
 */
import {
  ThreeDScene,
  Cell3D,
  CellTour,
  registerRender,
  type CellCutaway,
  type CellDetail,
} from '../src/index.ts';

const params = new URLSearchParams(location.search);
const container = document.getElementById('container')!;
const scene = new ThreeDScene(container, {
  width: 1080,
  height: 1080,
  frameWidth: 14,
  frameHeight: 14,
  backgroundColor: '#11131A',
  phi: 0.92,
  theta: -1.2,
  distance: 18.5,
  fov: 30,
  enableOrbitControls: true,
});
scene.lighting.addAmbient({ intensity: 0.55 });

const cell = new Cell3D({
  radius: 4,
  preset: 'animal',
  detail: (params.get('detail') ?? 'medium') as CellDetail,
  cutaway: (params.get('cutaway') ?? 'bowl') as CellCutaway,
  cytoskeleton: params.has('cytoskeleton'),
  seed: 3,
});
scene.add(cell);

const START = { phi: 0.92, theta: -1.2, distance: 18.5 };

async function construct(s: ThreeDScene): Promise<void> {
  s.setCameraOrientation(START.phi, START.theta, START.distance);
  await s.play(cell.buildAnimation({ duration: 12 }));
  await s.wait(0.5);

  const tour = new CellTour(s, cell);
  await tour.run([
    {
      target: cell.getOrganelle('nucleus'),
      callouts: [{ label: 'nuclear pore', anchor: 'pore', direction: [1, 0.7] }],
      hold: 1.5,
    },
    {
      target: cell.getOrganelle('golgi apparatus'),
      callouts: [{ label: 'entry side', anchor: 'entrySide', direction: [-1, 0.7] }],
      hold: 1.5,
    },
    {
      target: cell.getOrganelle('mitochondrion'),
      callouts: [{ label: 'cristae', anchor: 'cristae', direction: [1, 0.8] }],
      hold: 1.5,
    },
  ]);
  await tour.finish();
  await s.focusOn([0, 0, 0], {
    phi: START.phi,
    theta: START.theta,
    distance: START.distance,
    runTime: 2,
  });
}

// Opt in to command-line rendering (scripts/render-example.mjs).
registerRender(scene, { construct });

const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
playBtn.addEventListener('click', async () => {
  playBtn.disabled = true;
  await construct(scene);
  playBtn.disabled = false;
});
if (params.has('auto') || params.has('embed')) setTimeout(() => playBtn.click(), 300);
