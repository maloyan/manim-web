// Live example component for the "New in 0.11 and 0.12" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Circle, Text, MovablePoint, Slider, BLUE, YELLOW, WHITE } = await import('manim-web');

  let circle = new Circle({ radius: 1, color: BLUE });
  circle.moveTo([-2.5, 0.5, 0]);

  const readout = new Text({ text: 'point: (2.5, 0.5)', fontSize: 22, color: WHITE });
  readout.moveTo([2.5, 2.2, 0]);

  scene.add(circle, readout);
  scene.render();

  const point = new MovablePoint(scene, {
    point: [2.5, 0.5, 0],
    color: YELLOW,
    onChange: (pos: [number, number, number]) => {
      readout.setText(`point: (${pos[0].toFixed(1)}, ${pos[1].toFixed(1)})`);
      scene.render();
    },
  });

  const slider = new Slider(scene, {
    min: 0.25,
    max: 2,
    step: 0.05,
    value: 1,
    length: 4,
    center: [-2.5, -2.6, 0],
    color: BLUE,
    showLabel: true,
    onChange: (value: number) => {
      circle.become(new Circle({ radius: value, color: BLUE }).moveTo([-2.5, 0.5, 0]));
      scene.render();
    },
  });

  void point;
  void slider;
}

export default function MovablePointSliderExample() {
  return <ManimExample animationFn={animate} />;
}
