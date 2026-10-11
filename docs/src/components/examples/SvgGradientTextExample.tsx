// Live example component for the "New in 0.11 and 0.12" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { SVGMobject, Create } = await import('manim-web');

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#58C4DD"/>
          <stop offset="100%" stop-color="#D147BD"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="100" height="40" rx="8" fill="url(#grad)"/>
      <text x="60" y="72" font-size="14" fill="#ffffff" text-anchor="middle">manim-web</text>
    </svg>`;

  const logo = new SVGMobject({ svgString, height: 3 });
  await scene.play(new Create(logo, { duration: 2 }));
}

export default function SvgGradientTextExample() {
  return <ManimExample animationFn={animate} />;
}
