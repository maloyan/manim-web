// eslint-disable
import { Scene, Arrow } from '../src/index.ts';

const log = document.getElementById('log')!;
function print(msg: string) {
  log.textContent += msg + '\n';
  console.log(msg);
}
function arrowInfo(label: string, arrow: Arrow) {
  const [sx, sy] = arrow.getStart() as number[];
  const [ex, ey] = arrow.getEnd() as number[];
  const len = Math.hypot(ex - sx, ey - sy);
  print(
    `${label}: start=(${sx.toFixed(2)},${sy.toFixed(2)}) end=(${ex.toFixed(2)},${ey.toFixed(2)}) len=${len.toFixed(3)}`,
  );
}

const scene = new Scene(document.getElementById('container')!, {
  width: 600,
  height: 400,
  backgroundColor: '#101319',
});

document.getElementById('playBtn')!.addEventListener('click', async () => {
  scene.clear();
  log.textContent = '';

  const arrow = new Arrow({ start: [-1, 0, 0], end: [1, 0, 0], color: '#7dd3fc', strokeWidth: 3 });
  // NOTE: not adding to scene
  arrowInfo('initial', arrow);

  // Inspect what target looks like after copy + scale(0.5)
  const tgt = arrow.copy() as typeof arrow;
  tgt.scale(0.5);
  const [ts, ,] = tgt.getStart() as number[];
  const [te, ,] = tgt.getEnd() as number[];
  print(
    `target after copy+scale: start=${ts.toFixed(3)} end=${te.toFixed(3)} len=${Math.abs(te - ts).toFixed(3)} scaleVec=(${tgt.scaleVector.x},${tgt.scaleVector.y},${tgt.scaleVector.z})`,
  );
  const shaft = tgt.children[0];
  const tip = tgt.children[1];
  print(
    `  shaft.scaleVec=(${shaft.scaleVector.x},${shaft.scaleVector.y},${shaft.scaleVector.z}) tip.scaleVec=(${tip.scaleVector.x},${tip.scaleVector.y},${tip.scaleVector.z})`,
  );

  // Just scale — no GrowArrow, no Transform
  const lenBefore = (() => {
    const [sx, ,] = arrow.getStart() as number[];
    const [ex, ,] = arrow.getEnd() as number[];
    return Math.abs(ex - sx);
  })();
  await scene.play(arrow.animate.scale(0.5).withDuration(0.8));
  arrowInfo('after scale(0.5)', arrow);
  const lenAfter = (() => {
    const [sx, ,] = arrow.getStart() as number[];
    const [ex, ,] = arrow.getEnd() as number[];
    return Math.abs(ex - sx);
  })();
  print(
    `length: ${lenBefore.toFixed(3)} → ${lenAfter.toFixed(3)}  (expected ${(lenBefore * 0.5).toFixed(3)})`,
  );
  print(Math.abs(lenAfter - lenBefore * 0.5) < 0.05 ? 'PASS' : 'FAIL');
});

document.getElementById('resetBtn')!.addEventListener('click', () => {
  scene.clear();
  log.textContent = '';
});
