import {
  BLUE,
  Cube,
  ExplainerTour,
  GOLD,
  Membrane,
  Rotate,
  RED,
  Sphere,
  ThreeDScene,
  Torus,
  type TourTarget,
} from '../src/index.ts';

// A narrated tour over three plain solids, built from the direction layer:
// ExplainerTour composes FocusDim + CameraFocus + CaptionCard per stop, then
// Callout3D / InsetPanel annotations and the author's own animations.

const container = document.getElementById('container')!;
const scene = new ThreeDScene(container, {
  width: 720,
  height: 720,
  frameWidth: 8,
  frameHeight: 8,
  backgroundColor: '#0F1115',
  phi: 1.15,
  theta: -Math.PI / 2,
  distance: 14,
  fov: 35,
  enableOrbitControls: false,
});
scene.lighting.addAmbient({ intensity: 0.5 });

const sphere = new Sphere({ radius: 1, color: BLUE, center: [-2.6, 0, 0] });
const torus = new Torus({ radius: 0.9, tubeRadius: 0.3, color: GOLD, center: [0, 0.4, 0] });
const cube = new Cube({ sideLength: 1.4, color: RED, center: [2.6, 0, 0] }) as Cube & TourTarget;
cube.rotate(0.6, [0, 0, 1]);

// A target can carry its own tour defaults (a 3D kit implements TourTarget).
cube.getCaption = () => ({
  title: 'Cube',
  swatch: RED,
  body: 'Six square faces. Its wall, seen up close, is a lipid bilayer in this toy model.',
});
cube.getFocusFraming = () => ({ fill: 0.38, phi: 1.0, theta: -1.2, screenOffset: [-1.3, 0.6] });

scene.add(sphere, torus, cube);

const tour = new ExplainerTour(scene);

await scene.wait(0.3);
await tour.run([
  {
    caption: { title: 'Three solids', body: 'A short tour in manim style.', style: 'headline' },
    reveal: 'all',
    dim: false,
    hold: 0.8,
  },
  {
    target: sphere,
    framing: { fill: 0.42, screenOffset: [0.8, 0.9], phi: 1.05 },
    caption: {
      title: 'Sphere',
      swatch: BLUE,
      body: 'Every point on the surface is one radius from the centre.',
      footnote: 'Drawn with 32 segments around.',
    },
    emphasis: 'ring',
    hold: 0.6,
  },
  {
    target: torus,
    framing: { fill: 0.45, phi: 0.75, theta: -1.9, screenOffset: [0, 0.8] },
    caption: { title: 'Torus', swatch: GOLD, body: 'A circle swept around an axis.' },
    // The author hook: any animation of your own. The torus tilts, and the
    // callouts, anchored to points on it, follow.
    onEnter: async (_scene, _stop, player) => {
      await player.play(new Rotate(torus, { angle: 0.7, axis: [1, 0, 0], duration: 1.5 }));
    },
    callouts: [
      { label: 'tube', anchor: torus, anchorLocal: [0.9, 0, 0.3], direction: [1, 0.7] },
      {
        label: 'R = 0.9',
        tex: true,
        anchor: torus,
        anchorLocal: [-0.9, 0, 0],
        direction: [-1, 0.8],
        leader: 'elbow',
      },
    ],
    hold: 1,
  },
  {
    target: cube,
    inset: {
      title: 'Close-up',
      anchor: [2.6 + 0.7, 0, 0.3],
      content: [new Membrane({ length: 6, spacing: 0.35 })],
      position: [2.1, 1.6],
      width: 3.2,
      height: 2.2,
    },
    hold: 1.2,
  },
  {
    target: [0, 0, 0],
    framing: { distance: 13, phi: 1.15, theta: -Math.PI / 2 },
    dim: false,
    caption: {
      title: 'Solids',
      rows: [
        { color: BLUE, text: 'Sphere: one radius' },
        { color: GOLD, text: 'Torus: a swept circle' },
        { color: RED, text: 'Cube: six faces' },
      ],
    },
    hold: 1.2,
  },
]);
await tour.finish();
tour.dispose();
