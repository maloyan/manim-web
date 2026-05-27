import { Arrow } from '../src/mobjects/geometry/Arrow';
import { alignVmobjectPair } from '../src/animation/transform/TransformPairing';
import type { VMobject } from '../src/core/VMobject';

const radius = 2.6;
const tipLength = 0.28;
const tipWidth = 0.12;
const n = 12;

function anchors(pts: number[][]): string {
  return [0, 3, 6]
    .map((i) => {
      const p = pts[i];
      return `[${i}]=(${p[0].toFixed(3)},${p[1].toFixed(3)})`;
    })
    .join('  ');
}

// Replicate the final transform step for arrow[0]: angle=0, after Rotate(π)
const source = new Arrow({
  start: [0, 0, 0],
  end: [radius, 0, 0],
  color: '#7dd3fc',
  strokeWidth: 3,
  tipLength,
  tipWidth,
});

source.scale(0.5);
source.rotation.z = Math.PI;

const tip0 = source.children[1] as VMobject;
console.log('=== SOURCE before normalizeTransform ===');
console.log('Arrow rotation.z:', source.rotation.z.toFixed(4));
console.log(
  'Arrow position:',
  source.position.toArray().map((v) => +v.toFixed(4)),
);
console.log(
  'Tip  position:',
  tip0.position.toArray().map((v) => +v.toFixed(4)),
);
console.log('Tip  anchors:', anchors(tip0.getPoints()));
console.log(
  'Shaft position:',
  (source.children[0] as VMobject).position.toArray().map((v) => +v.toFixed(4)),
);

source.normalizeTransform();

const tip1 = source.children[1] as VMobject;
const shaft1 = source.children[0] as VMobject;
console.log('\n=== SOURCE after normalizeTransform ===');
console.log('Arrow rotation.z:', source.rotation.z.toFixed(4));
console.log(
  'Arrow position:',
  source.position.toArray().map((v) => +v.toFixed(4)),
);
console.log(
  'Tip  position:',
  tip1.position.toArray().map((v) => +v.toFixed(4)),
);
console.log('Tip  anchors:', anchors(tip1.getPoints()));
console.log(
  'Tip  all pts:',
  tip1
    .getPoints()
    .map((p, i) => `[${i}](${p[0].toFixed(3)},${p[1].toFixed(3)})`)
    .join(' '),
);
console.log(
  'Shaft position:',
  shaft1.position.toArray().map((v) => +v.toFixed(4)),
);
console.log(
  'Arrow center:',
  source.getCenter().map((v) => +v.toFixed(4)),
);
console.log('Arrow length:', source.getLength().toFixed(4));

// Build target: tangential arrow at the current center
const center = source.getCenter();
const angle = Math.atan2(center[1], center[0]);
const tx = -Math.sin(angle);
const ty = Math.cos(angle);
const half = source.getLength() / 2;
const tStart: [number, number, number] = [center[0] - tx * half, center[1] - ty * half, 0];
const tEnd: [number, number, number] = [center[0] + tx * half, center[1] + ty * half, 0];

const target = new Arrow({
  start: tStart,
  end: tEnd,
  color: '#7dd3fc',
  strokeWidth: 3,
  tipLength,
  tipWidth,
});
const tTip = target.children[1] as VMobject;

console.log('\n=== TARGET (fresh tangential) ===');
console.log(
  'start:',
  tStart.map((v) => +v.toFixed(4)),
);
console.log(
  'end:  ',
  tEnd.map((v) => +v.toFixed(4)),
);
console.log(
  'Tip  position:',
  tTip.position.toArray().map((v) => +v.toFixed(4)),
);
console.log('Tip  anchors:', anchors(tTip.getPoints()));
console.log(
  'Tip  all pts:',
  tTip
    .getPoints()
    .map((p, i) => `[${i}](${p[0].toFixed(3)},${p[1].toFixed(3)})`)
    .join(' '),
);

// alignVmobjectPair on tip pair (as the real pipeline does)
const srcCopy = tip1.copy() as VMobject;
const tgtCopy = tTip.copy() as VMobject;
const aligned = alignVmobjectPair(srcCopy, tgtCopy);

console.log('\n=== alignVmobjectPair result ===');
console.log('startPoints  anchors:', anchors(aligned.startPoints));
console.log('targetPoints anchors:', anchors(aligned.targetPoints));

const srcApex = aligned.startPoints[3];
const morphsTo = aligned.targetPoints[3];
console.log('\nSource apex   [3]:', `(${srcApex[0].toFixed(4)}, ${srcApex[1].toFixed(4)})`);
console.log('Morphs to tgt [3]:', `(${morphsTo[0].toFixed(4)}, ${morphsTo[1].toFixed(4)})`);
console.log(
  'Target orig   [3]:',
  `(${tTip.getPoints()[3][0].toFixed(4)}, ${tTip.getPoints()[3][1].toFixed(4)})`,
);

const apexOk =
  Math.abs(morphsTo[0] - tTip.getPoints()[3][0]) < 0.01 &&
  Math.abs(morphsTo[1] - tTip.getPoints()[3][1]) < 0.01;
console.log(apexOk ? '\nOK: apex → apex' : '\n*** BUG: apex morphs to wrong target point ***');

// Check all n arrows by varying initial angle
console.log('\n=== Per-arrow apex mapping (all 12 arrows) ===');
for (let i = 0; i < n; i++) {
  const a = (2 * Math.PI * i) / n;
  const s = new Arrow({
    start: [0, 0, 0],
    end: [radius * Math.cos(a), radius * Math.sin(a), 0],
    color: '#fff',
    strokeWidth: 3,
    tipLength,
    tipWidth,
  });
  s.scale(0.5);
  s.rotation.z = Math.PI;
  s.normalizeTransform();

  const ctr = s.getCenter();
  const ang = Math.atan2(ctr[1], ctr[0]);
  const ttx = -Math.sin(ang);
  const tty = Math.cos(ang);
  const h = s.getLength() / 2;
  const tgt = new Arrow({
    start: [ctr[0] - ttx * h, ctr[1] - tty * h, 0],
    end: [ctr[0] + ttx * h, ctr[1] + tty * h, 0],
    color: '#fff',
    strokeWidth: 3,
    tipLength,
    tipWidth,
  });

  const sc = (s.children[1] as VMobject).copy() as VMobject;
  const tc = (tgt.children[1] as VMobject).copy() as VMobject;
  const al = alignVmobjectPair(sc, tc);

  const tOrig = tgt.children[1] as VMobject;
  const mt = al.targetPoints[3];
  const to = tOrig.getPoints()[3];
  const ok = Math.abs(mt[0] - to[0]) < 0.01 && Math.abs(mt[1] - to[1]) < 0.01;
  console.log(
    `arrow[${i.toString().padStart(2)}] angle=${a.toFixed(2)}: apex→(${mt[0].toFixed(3)},${mt[1].toFixed(3)}) orig=(${to[0].toFixed(3)},${to[1].toFixed(3)}) ${ok ? 'OK' : '*** BUG ***'}`,
  );
}
