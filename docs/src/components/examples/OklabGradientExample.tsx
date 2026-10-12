// Live example component for the "New in 0.16 and 0.17" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Rectangle, Text, interpolateColor, interpolateColorOklab, WHITE } =
    await import('manim-web');

  const from = '#0000ff'; // blue
  const to = '#ffff00'; // yellow
  const steps = 16;

  // Top row: the default sRGB blend. It dips through a muddy gray midpoint.
  // Bottom row: the Oklab blend. It stays bright across the whole sweep.
  const buildRow = (y: number, blend: (a: string, b: string, t: number) => string) => {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const swatch = new Rectangle({ width: 0.55, height: 1.1, strokeWidth: 0 });
      swatch.setFill(blend(from, to, t), 1);
      swatch.moveTo([(i - (steps - 1) / 2) * 0.55, y, 0]);
      scene.add(swatch);
    }
  };

  buildRow(1.1, interpolateColor);
  buildRow(-0.5, interpolateColorOklab);

  scene.add(new Text({ text: 'sRGB', fontSize: 22, color: WHITE }).moveTo([0, 2.1, 0]));
  scene.add(new Text({ text: 'Oklab', fontSize: 22, color: WHITE }).moveTo([0, 0.5, 0]));
  scene.render();
  await scene.wait(999999);
}

export default function OklabGradientExample() {
  return <ManimExample animationFn={animate} />;
}
