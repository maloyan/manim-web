import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
    Circle,
    Square,
    Create,
    Transform,
    FadeIn,
    Text,
    prepareAnimation,
    WHITE,
    BLUE,
    RED,
    GREEN,
  } = await import('manim-web');

  const title = new Text({ text: 'prepareAnimation()', fontSize: 28, color: WHITE });
  title.moveTo([0, 2.5, 0]);
  await scene.play(new FadeIn(title, { duration: 0.5 }));

  // Use prepareAnimation with a direct Animation
  const circle = new Circle({ radius: 1, color: BLUE });
  const anim1 = prepareAnimation(new Create(circle, { duration: 1.5 }));
  await scene.play(anim1);
  await scene.wait(0.3);

  // Use prepareAnimation with a function
  const square = new Square({ sideLength: 2, color: RED });
  const anim2 = prepareAnimation(() => new Transform(circle, square, { duration: 1.5 }));
  await scene.play(anim2);
  await scene.wait(0.3);

  // Another transform
  const circle2 = new Circle({ radius: 1.5, color: GREEN });
  const anim3 = prepareAnimation(new Transform(circle, circle2, { duration: 1.5 }));
  await scene.play(anim3);
  await scene.wait(1);
}

export default function AnimationUtilitiesExample() {
  return <ManimExample animationFn={animate} />;
}
