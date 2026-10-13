import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { ManimBanner } = await import('manim-web');

  const banner = new ManimBanner({ darkTheme: true });

  // Draw the logo shapes.
  await scene.play(banner.createAnimation({ duration: 2 }));

  // Reveal the text below the logo.
  await scene.play(banner.expandAnimation({ duration: 1.5 }));
  await scene.wait(1.5);
}

export default function ManimBannerExample() {
  return <ManimExample animationFn={animate} />;
}
