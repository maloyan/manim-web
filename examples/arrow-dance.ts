import {
  Scene,
  Arrow,
  GrowArrow,
  Transform,
  VMobject,
  AnimationGroup,
  Rotate,
} from '../src/index.ts';

const container = document.getElementById('container')!;
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: '#101319',
});

let isAnimating = false;

function makeArrowTo(radius: number, angle: number): Arrow {
  return new Arrow({
    start: [0, 0, 0],
    end: [radius * Math.cos(angle), radius * Math.sin(angle), 0],
    color: '#7dd3fc',
    strokeWidth: 3,
    tipLength: 0.28,
    tipWidth: 0.12,
  });
}

document.getElementById('playBtn')!.addEventListener('click', async () => {
  if (isAnimating) return;
  isAnimating = true;

  scene.clear();

  const n = 12;
  const radius = 2.6;
  const arrows: Arrow[] = [];

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    const arrow = makeArrowTo(radius, angle);
    arrows.push(arrow);
  }

  // Grow one-by-one from center out to a 12-gon.
  // Do not pre-add: GrowArrow/Create pipeline adds to scene.
  for (const arrow of arrows) {
    await scene.play(new GrowArrow(arrow, { duration: 0.32 }));
  }

  await scene.wait(0.25);

  // Shift all arrows outward by +1 unit (together).
  await scene.play(
    ...arrows.map((arrow, i) => {
      const angle = (2 * Math.PI * i) / n;
      const target = arrow.copy() as Arrow;
      target.putStartAndEndOn(
        [Math.cos(angle), Math.sin(angle), 0],
        [(radius + 1) * Math.cos(angle), (radius + 1) * Math.sin(angle), 0],
      );
      return new Transform(arrow, target, { duration: 1.2 });
    }),
  );

  // Scale all arrows down to half (together).
  await scene.play(...arrows.map((arrow) => arrow.animate.scale(0.5).withDuration(0.9)));

  // Change tip color to yellow one after another (staggered).
  const colorAnimations = arrows.map((arrow) => {
    const tip = arrow.children[1] as VMobject;
    return tip.animate.setColor('#ffeb3b').withDuration(0.15);
  });
  await scene.play(new AnimationGroup(colorAnimations, { lagRatio: 0.33 }));

  // Rotate each arrow by 180° staggered.
  const rotateAnimations = arrows.map(
    (arrow) => new Rotate(arrow, { angle: Math.PI, duration: 0.5 }),
  );
  await scene.play(new AnimationGroup(rotateAnimations, { lagRatio: 0.33 }));

  // Final: move each arrow to form circle perimeter (arrows point around the circle).
  await scene.play(
    ...arrows.map((arrow) => {
      const target = arrow.copy() as Arrow;
      console.log({
        start: target.getStart(),
        end: target.getEnd(),
        position: target.position,
        center: target.getCenter(),
      });
      return new Transform(arrow, target, { duration: 0.6 });
    }),
  );

  isAnimating = false;
});

document.getElementById('resetBtn')!.addEventListener('click', () => {
  scene.clear();
});

// Embed mode: hide controls and autoplay.
if (new URLSearchParams(window.location.search).has('embed')) {
  document
    .querySelectorAll('.controls')
    .forEach((el) => ((el as HTMLElement).style.display = 'none'));
  setTimeout(() => document.getElementById('playBtn')?.click(), 300);
}
