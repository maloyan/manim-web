import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { PolarPlane, MathTex } = await import('manim-web');

  // Build MathTex labels for τ-based angles and r₁/r₂/r₃ radii.
  // Wait for LaTeX to render before passing them to PolarPlane so
  // that the plane's positioning math has real glyph bounds.
  const angleLatex = [
    '0',
    '\\tau/12',
    '\\tau/6',
    '\\tau/4',
    '\\tau/3',
    '5\\tau/12',
    '\\tau/2',
    '7\\tau/12',
    '2\\tau/3',
    '3\\tau/4',
    '5\\tau/6',
    '11\\tau/12',
  ];
  const angleLabels = angleLatex.map((latex) => new MathTex({ latex, fontSize: 28 }));
  const radiusLabels = ['r_1', 'r_2', 'r_3'].map((latex) => new MathTex({ latex, fontSize: 24 }));
  await Promise.all([...angleLabels, ...radiusLabels].map((l) => l.waitForRender()));

  const plane = new PolarPlane({
    radius: 3,
    size: 6,
    angularDivisions: 12,
    radialDivisions: 3,
    angleLabels,
    radiusLabels,
  });
  scene.add(plane);
  await scene.wait(1);
}

export default function PolarPlaneCustomLabelsExample() {
  return <ManimExample animationFn={animate} />;
}
