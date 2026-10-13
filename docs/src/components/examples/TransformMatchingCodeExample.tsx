// Live example component for the "New in 0.13, 0.14 and 0.15" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Code, transformMatchingCode } = await import('manim-web');

  const before = new Code({
    code: 'const x = 1;\nconst y = 2;\nconst z = x + y;',
    language: 'javascript',
    fontSize: 26,
  });
  before.moveTo([0, 0, 0]);

  const after = new Code({
    code: 'const x = 1;\nconst y = 20;\nconst z = x * y;',
    language: 'javascript',
    fontSize: 26,
  });
  after.moveTo([0, 0, 0]);

  scene.add(before);

  // Matched tokens move to their new place; changed tokens fade across.
  await scene.play(transformMatchingCode(before, after, { duration: 2.2 }));
}

export default function TransformMatchingCodeExample() {
  return <ManimExample animationFn={animate} />;
}
