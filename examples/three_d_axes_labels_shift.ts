import { ThreeDAxes, ThreeDScene } from '../src/index.ts';

async function makeScene(id: string, shift: boolean) {
  const container = document.getElementById(id);
  const scene = new ThreeDScene(container, {
    width: 500,
    height: 500,
    backgroundColor: '#191919',
    phi: 75 * (Math.PI / 180),
    theta: -45 * (Math.PI / 180),
    // Deliberately tight: camera close + narrow FOV so default axis tips clip.
    distance: 12,
    fov: 25,
  });

  const axes = new ThreeDAxes({
    xRange: [-5, 5, 1],
    yRange: [-5, 5, 1],
    zRange: [-5, 5, 1],
    showLabels: true,
    xColor: '#ff6b6b',
    yColor: '#6bcb77',
    zColor: '#4d96ff',
  });
  scene.add(axes);

  // Let MathTex finish + camera/matrices update.
  await scene.wait(0.1);
  if (shift) {
    axes.shiftLabelsOntoScreen(scene.camera3D.getCamera(), 0.08);
  }

  // Log positions to console for verification.
  const cam = scene.camera3D.getCamera();
  cam.updateMatrixWorld();
  for (const [name, lbl] of [
    ['x', axes.getXLabel()],
    ['y', axes.getYLabel()],
    ['z', axes.getZLabel()],
  ] as const) {
    const world = lbl!.getThreeObject().getWorldPosition(new (await import('three')).Vector3());
    const ndc = world.clone().project(cam);
    console.log(
      `[${shift ? 'SHIFT' : 'BEFORE'}] ${name}: world=(${world.x.toFixed(2)},${world.y.toFixed(2)},${world.z.toFixed(2)}) ndc=(${ndc.x.toFixed(2)},${ndc.y.toFixed(2)})`,
    );
  }

  await scene.wait(Infinity);
}

await Promise.all([makeScene('c1', false), makeScene('c2', true)]);
