import { Scene, MathTexImage, MathTex, Create, Transform, WHITE } from '../src/index.ts';

const scene = new Scene(document.getElementById('container'), {
  width: 1000,
  height: 500,
  backgroundColor: '#000000',
});

async function run() {
  scene.clear();

  // Left: MathTexImage 48 -> 144
  const imgSmall = new MathTexImage({ latex: '0', fontSize: 48, color: WHITE });
  const imgBig = new MathTexImage({ latex: '0', fontSize: 144, color: WHITE });

  // Right: MathTex 48 -> 144 (same flow)
  const texSmall = new MathTex({
    latex: '0',
    fontSize: 48,
    color: WHITE,
    fillOpacity: 1,
    strokeOpacity: 1,
  });
  const texBig = new MathTex({
    latex: '0',
    fontSize: 144,
    color: WHITE,
    fillOpacity: 1,
    strokeOpacity: 1,
  });

  await Promise.all([
    imgSmall.waitForRender(),
    imgBig.waitForRender(),
    texSmall.waitForRender(),
    texBig.waitForRender(),
  ]);

  imgSmall.moveTo([-2.5, 0, 0]);
  imgBig.moveTo([-2.5, 0, 0]);
  texSmall.moveTo([2.5, 0, 0]);
  texBig.moveTo([2.5, 0, 0]);

  await scene.play(
    new Create(imgSmall, { duration: 1.0 }),
    new Create(texSmall, { duration: 1.0 }),
  );
  // Play transforms in sequence for easier visual comparison
  await scene.play(new Transform(imgSmall, imgBig, { duration: 2.0 }));
  await scene.wait(0.4);
  await scene.play(new Transform(texSmall, texBig, { duration: 2.0 }));
}

document.getElementById('playBtn')?.addEventListener('click', () => {
  void run();
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
  scene.clear();
});
