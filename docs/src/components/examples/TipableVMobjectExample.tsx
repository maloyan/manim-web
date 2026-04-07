import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Arc, Arrow, Create, FadeIn, WHITE, RED, BLUE, YELLOW, GREEN } = await import('manim-web');

  // Show an arc with a tip added via TipableVMobject API
  const arc = new Arc({
    radius: 2,
    startAngle: 0,
    angle: Math.PI * 1.2,
    color: BLUE,
    addTip: true,
  });
  await scene.play(new Create(arc, { duration: 1 }));

  // Show arrows too (they use a different system)
  const arrow1 = new Arrow({
    start: [-3, -1.5, 0],
    end: [0, 1.5, 0],
    color: RED,
    tipLength: 0.3,
  });
  const arrow2 = new Arrow({
    start: [0, 1.5, 0],
    end: [3, -1.5, 0],
    color: YELLOW,
    tipLength: 0.3,
  });

  await scene.play(new Create(arrow1, { duration: 1 }));
  await scene.play(new Create(arrow2, { duration: 1 }));
  await scene.wait(1.5);
}

export default function TipableVMobjectExample() {
  return <ManimExample animationFn={animate} />;
}
