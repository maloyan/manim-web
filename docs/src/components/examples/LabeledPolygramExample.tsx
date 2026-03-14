import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Polygon, LabeledPolygram, Circle, FadeIn, Create, BLACK, BLUE, WHITE } =
    await import('manim-web');

  // Define an irregular polygon with two holes
  const ring1 = [
    [-3.8, -2.4, 0],
    [-2.4, -2.5, 0],
    [-1.3, -1.6, 0],
    [-0.2, -1.7, 0],
    [1.7, -2.5, 0],
    [2.9, -2.6, 0],
    [3.5, -1.5, 0],
    [4.9, -1.4, 0],
    [4.5, 0.2, 0],
    [4.7, 1.6, 0],
    [3.5, 2.4, 0],
    [1.1, 2.5, 0],
    [-0.1, 0.9, 0],
    [-1.2, 0.5, 0],
    [-1.6, 0.7, 0],
    [-1.4, 1.9, 0],
    [-2.6, 2.6, 0],
    [-4.4, 1.2, 0],
    [-4.9, -0.8, 0],
  ];
  const ring2 = [
    [0.2, -1.2, 0],
    [0.9, -1.2, 0],
    [1.4, -2.0, 0],
    [2.1, -1.6, 0],
    [2.2, -0.5, 0],
    [1.4, 0.0, 0],
    [0.4, -0.2, 0],
  ];
  const ring3 = [
    [-2.7, 1.4, 0],
    [-2.3, 1.7, 0],
    [-2.8, 1.9, 0],
  ];

  // Create polygon shapes
  const outerPoly = new Polygon({
    vertices: ring1,
    color: BLUE,
    fillOpacity: 0.75,
    strokeWidth: 2,
  });
  const hole1 = new Polygon({
    vertices: ring2,
    color: BLACK,
    fillOpacity: 1,
    strokeWidth: 0,
  });
  const hole2 = new Polygon({
    vertices: ring3,
    color: BLACK,
    fillOpacity: 1,
    strokeWidth: 0,
  });

  // Fade in polygon + holes together
  await scene.play(
    new FadeIn(outerPoly, { duration: 0.8 }),
    new FadeIn(hole1, { duration: 0.8 }),
    new FadeIn(hole2, { duration: 0.8 }),
  );

  // Create labeled polygram - computes pole of inaccessibility
  const labeled = new LabeledPolygram({
    vertexGroups: [ring1, ring2, ring3],
    label: 'Pole',
    precision: 0.01,
    labelFontSize: 28,
    labelColor: WHITE,
    color: BLUE,
    fillOpacity: 0,
    strokeWidth: 0,
  });

  // Hide label, add to scene, then fade in
  const label = labeled.getLabel();
  label.opacity = 0;
  scene.add(labeled);
  await scene.play(new FadeIn(label, { duration: 1 }));

  // Draw a reference circle at the pole
  const circle = new Circle({
    radius: labeled.radius,
    color: WHITE,
    center: [labeled.pole[0], labeled.pole[1], 0],
    fillOpacity: 0,
    strokeWidth: 2,
  });
  await scene.play(new Create(circle, { duration: 0.8 }));
  await scene.wait(2);
}

export default function LabeledPolygramExample() {
  return <ManimExample animationFn={animate} />;
}
