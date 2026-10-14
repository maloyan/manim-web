// Live example component for the "New in 0.13, 0.14 and 0.15" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Globe, Rotate } = await import('manim-web');

  const globe = new Globe({ radius: 2.2, color: '#2a6f97', resolution: 48 });

  // graticule, plotPoint and arc attach to the globe, so they spin with it.
  globe.graticule({ latStep: 30, lonStep: 30, color: '#8d99ae' });
  globe.plotPoint(48.85, 2.35, { color: '#ffd166' }); // Paris (lat, lon)
  globe.plotPoint(40.71, -74.0, { color: '#ffd166' }); // New York
  // altitude 0 keeps the arc on the sphere surface so it connects the two dots
  // (Line3D carries a depth bias that stops it z-fighting the surface it lies on).
  globe.arc([48.85, 2.35], [40.71, -74.0], { color: '#ef476f' });

  scene.add(globe);
  await scene.play(new Rotate(globe, { angle: Math.PI * 2, duration: 8 }));
}

function createScene(container: HTMLElement, manim: any) {
  return new manim.ThreeDScene(container, {
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    phi: 70 * (Math.PI / 180),
    theta: -45 * (Math.PI / 180),
    distance: 9,
    fov: 45,
  });
}

export default function GlobeExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
