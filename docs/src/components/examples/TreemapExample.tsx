// Live example component for the "New in 0.26" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Treemap, FadeIn } = await import('manim-web');

  // A squarified treemap. Each node's rectangle is sized in proportion to its
  // value, and children tile their parent's rectangle, so a child sits inside
  // its parent.
  const tree = new Treemap({
    data: {
      name: 'root',
      children: [
        { name: 'TypeScript', value: 42 },
        { name: 'Rust', value: 23 },
        {
          name: 'Python',
          children: [
            { name: 'ml', value: 10 },
            { name: 'web', value: 7 },
          ],
        },
        { name: 'Go', value: 9 },
        { name: 'Other', value: 6 },
      ],
    },
    width: 9,
    height: 5,
  });

  await scene.play(new FadeIn(tree, { duration: 1 }));
  await scene.wait(999999);
}

export default function TreemapExample() {
  return <ManimExample animationFn={animate} />;
}
