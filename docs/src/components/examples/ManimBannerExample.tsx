import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
    Circle,
    Square,
    RegularPolygon,
    VGroup,
    Text,
    Create,
    FadeIn,
    BLUE,
    GREEN,
    YELLOW,
    WHITE,
  } = await import('manim-web');

  // Recreate the banner shapes directly (simpler than ManimBanner class)
  const triangle = new RegularPolygon({ numSides: 3, radius: 0.5, color: BLUE, fillOpacity: 0.8 });
  triangle.moveTo([-1.5, 0, 0]);

  const circle = new Circle({ radius: 0.4, color: GREEN, fillOpacity: 0.8 });
  circle.moveTo([0, 0, 0]);

  const square = new Square({ sideLength: 0.7, color: YELLOW, fillOpacity: 0.8 });
  square.moveTo([1.5, 0, 0]);

  const shapes = new VGroup();
  shapes.add(triangle);
  shapes.add(circle);
  shapes.add(square);

  await scene.play(new Create(triangle, { duration: 0.8 }));
  await scene.play(new Create(circle, { duration: 0.8 }));
  await scene.play(new Create(square, { duration: 0.8 }));
  await scene.wait(0.3);

  // Show the text
  const text = new Text({ text: 'manim-web', fontSize: 36, color: WHITE });
  text.moveTo([0, -1.5, 0]);
  await scene.play(new FadeIn(text, { duration: 1 }));
  await scene.wait(1.5);
}

export default function ManimBannerExample() {
  return <ManimExample animationFn={animate} />;
}
