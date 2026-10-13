// Live example for the 0.33 feature Text3D: extruded, beveled 3D text.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Text3D } = await import('manim-web');

  // fromUrl loads a typeface.json (a small CDN-hosted font by default), then
  // builds the extruded mesh. The mesh drops into the 3D scene like a Cube, so
  // the 3D camera and the default lighting light its depth and bevel.
  const text = await Text3D.fromUrl('manim', {
    size: 1.6,
    depth: 0.5,
    bevel: { enabled: true, thickness: 0.06, size: 0.04 },
    color: '#58c4dd',
  });
  text.center(); // TextGeometry builds from the left baseline; recenter at origin.

  scene.add(text);

  // Orbit the camera so the extrusion depth and the bevel are visible.
  scene.beginAmbientCameraRotation(0.3);
  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.ThreeDScene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#000000',
    phi: 70 * (Math.PI / 180),
    theta: -20 * (Math.PI / 180),
    distance: 9,
    fov: 45,
  });
}

export default function Text3DExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
