// Live example component for the "New in 0.29, 0.30 and 0.31" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Square, withDropShadow, Create } = await import('manim-web');

  // A light surface, so the soft black shadow actually reads. The docs scene
  // background is black, where a black drop shadow would be invisible.
  const surface = new Square({ sideLength: 5.2, color: '#e6e6e6', fillOpacity: 1, strokeWidth: 0 });
  surface.center();

  // The source shape stays crisp. withDropShadow returns a VGroup that holds
  // soft shadow copies behind the original; layers fake a blurred edge.
  const card = new Square({ sideLength: 2.6, color: '#58c4dd', fillOpacity: 1, strokeWidth: 4 });
  const shadowed = withDropShadow(card, {
    offset: [0.18, -0.18],
    color: '#000000',
    opacity: 0.45,
    layers: 6,
    blur: 1.2,
  });
  shadowed.center();

  scene.add(surface);
  await scene.play(new Create(shadowed, { duration: 1.5 }));
  await scene.wait(999999);
}

export default function DropShadowExample() {
  return <ManimExample animationFn={animate} />;
}
