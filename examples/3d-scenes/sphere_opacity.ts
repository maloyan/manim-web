import { PolarPlane, Sphere, ThreeDScene, WHITE } from '../../src/index';

function makeScene(containerId: string, opacity: number, sphereFirst: boolean) {
  const container = document.getElementById(containerId) as HTMLElement;
  const scene = new ThreeDScene(container, {
    width: 280,
    height: 220,
    backgroundColor: '#191919',
    phi: 75 * (Math.PI / 180),
    theta: -45 * (Math.PI / 180),
    distance: 18,
    fov: 30,
    enableOrbitControls: false,
  });

  const plane = new PolarPlane({
    gridStrokeWidth: 2,
    gridOpacity: 0.25,
    gridColor: WHITE,
    includeAngleLabels: false,
  });
  plane.rotation.x = -Math.PI / 2;
  const sphere = new Sphere({ radius: 1.2, color: WHITE, opacity });

  if (sphereFirst) scene.add(sphere, plane);
  else scene.add(plane, sphere);

  // Pin radius labels to face the camera (otherwise the parent's -PI/2 X
  // rotation flips the label quads and the canvas texture reads mirrored).
  plane.billboardLabels();

  scene.wait(Infinity);
}

makeScene('a02', 0.02, true);
makeScene('a30', 0.3, true);
makeScene('a70', 0.7, true);
makeScene('b02', 0.02, false);
makeScene('b30', 0.3, false);
makeScene('b70', 0.7, false);
