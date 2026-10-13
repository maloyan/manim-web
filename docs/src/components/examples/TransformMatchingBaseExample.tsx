import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
    VGroup,
    Circle,
    Square,
    Triangle,
    TransformMatchingShapes,
    Create,
    BLUE,
    RED,
    GREEN,
    YELLOW,
  } = await import('manim-web');

  // Source shapes
  const source = new VGroup();
  const sCircle = new Circle({ radius: 0.5, color: BLUE, fillOpacity: 0.5 });
  sCircle.moveTo([-2, 0, 0]);
  const sSquare = new Square({ sideLength: 1, color: RED, fillOpacity: 0.5 });
  const sTriangle = new Triangle({ color: GREEN, fillOpacity: 0.5 });
  sTriangle.moveTo([2, 0, 0]);
  source.add(sCircle);
  source.add(sSquare);
  source.add(sTriangle);
  await scene.play(new Create(source, { duration: 1 }));
  await scene.wait(0.5);

  // Target shapes (recolored and resized)
  const target = new VGroup();
  const tCircle = new Circle({ radius: 0.7, color: YELLOW, fillOpacity: 0.5 });
  tCircle.moveTo([2, 0.5, 0]);
  const tSquare = new Square({ sideLength: 1.2, color: GREEN, fillOpacity: 0.5 });
  const tTriangle = new Triangle({ color: BLUE, fillOpacity: 0.5 });
  tTriangle.scale(0.7);
  tTriangle.moveTo([-2, -0.5, 0]);
  target.add(tCircle);
  target.add(tSquare);
  target.add(tTriangle);

  // TransformMatchingShapes matches sub-shapes and morphs them smoothly.
  await scene.play(new TransformMatchingShapes(source, target, { duration: 2 }));
  await scene.wait(1);
}

export default function TransformMatchingBaseExample() {
  return <ManimExample animationFn={animate} />;
}
