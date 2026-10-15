import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { Circle, Dot, Rectangle, SafeArea, BLUE, YELLOW, GREEN, WHITE } =
    await import('manim-web');

  // The rectangle visible in BOTH 16:9 and 9:16 at a shared reference height.
  const safe = SafeArea.fromAspectRatios([16 / 9, 9 / 16]);

  // Outline the safe area so the reflow is obvious when the aspect switches.
  const safeBox = new Rectangle({
    width: safe.width,
    height: safe.height,
    color: WHITE,
    strokeWidth: 2,
    fillOpacity: 0,
  });
  safeBox.moveTo([0, 0, 0]);

  const badge = new Circle({ radius: 1, color: BLUE, fillOpacity: 0.8 });
  safe.place(badge, 'center');

  const dotTL = new Dot({ color: YELLOW, radius: 0.12 });
  safe.place(dotTL, 'topLeft', 0.25);
  const dotBR = new Dot({ color: GREEN, radius: 0.12 });
  safe.place(dotBR, 'bottomRight', 0.25);

  scene.add(safeBox, badge, dotTL, dotBR);

  // Switch the frame aspect back and forth. Content anchored to the safe area
  // stays on screen in both — portrait reflows instead of clipping.
  for (let i = 0; i < 3; i += 1) {
    await scene.wait(1.4);
    scene.setFrameAspect(450, 800); // 9:16 portrait (Reels / Shorts)
    await scene.wait(1.4);
    scene.setFrameAspect(800, 450); // 16:9 landscape (YouTube)
  }
  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any, dims: { width: number; height: number }) {
  return new manim.Scene(container, {
    width: dims.width,
    height: dims.height,
    backgroundColor: '#1C1C1C',
  });
}

export default function ResponsiveAspectExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
