// Live example component for the "New in 0.23, 0.24, and 0.25" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { DomainColoring } = await import('manim-web');

  // A phase portrait of f(z) = (z^2 - 1) / (z^2 + 1). Hue encodes arg(f(z));
  // the banded brightness scheme draws the dark/light contour rings of a Wegert
  // portrait, so zeros read dark and poles read bright.
  const plot = new DomainColoring({
    func: (z: { re: number; im: number }) => {
      // (z^2 - 1) / (z^2 + 1), computed with real arithmetic.
      const z2re = z.re * z.re - z.im * z.im;
      const z2im = 2 * z.re * z.im;
      const nre = z2re - 1;
      const nim = z2im;
      const dre = z2re + 1;
      const dim = z2im;
      const denom = dre * dre + dim * dim;
      return { re: (nre * dre + nim * dim) / denom, im: (nim * dre - nre * dim) / denom };
    },
    reRange: [-3, 3],
    imRange: [-3, 3],
    resolution: 320,
    scheme: 'banded',
  });

  scene.add(plot);
  await scene.wait(999999);
}

// DomainColoring is a flat mesh in the z = 0 plane, so view it from straight above.
function createScene(container: HTMLElement, manim: any) {
  return new manim.ThreeDScene(container, {
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    phi: 0,
    theta: -90 * (Math.PI / 180),
    distance: 9,
    fov: 45,
    orbitControlsUp: 'z',
  });
}

export default function DomainColoringExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
