/* eslint-disable */
import * as THREE from 'three';
import { Scene, Arrow, Circle, Transform, GrowArrow } from '../src/index.ts';

const log = document.getElementById('log')!;
function out(s: string) {
  log.textContent += s + '\n';
  console.log(s);
}

const container = document.getElementById('container')!;
const scene = new Scene(container, { width: 800, height: 450, backgroundColor: '#101319' });

const R = 4;
const boundary = new Circle({ radius: R, color: '#334155', strokeWidth: 1 });
scene.add(boundary);

function tipWorldMaxR(arrow: Arrow): number {
  const tip = arrow.children[1];
  const pts = (tip as any).getPoints?.() ?? [];
  const obj = tip.getThreeObject();
  let max = 0;
  for (const p of pts) {
    const v = new THREE.Vector3(p[0], p[1], p[2]);
    obj.localToWorld(v);
    max = Math.max(max, Math.sqrt(v.x * v.x + v.y * v.y));
  }
  return max;
}

const angle = 0;
const radius = 3.3;
const arrow = new Arrow({
  start: [0, 0, 0],
  end: [radius, 0, 0],
  color: '#7dd3fc',
  strokeWidth: 3,
  tipLength: 0.28,
  tipWidth: 0.12,
});

await scene.play(new GrowArrow(arrow, { duration: 0.01 }));
out(
  `after GrowArrow: getEnd()=[${arrow.getEnd().map((v: number) => v.toFixed(3))}] tipMaxR=${tipWorldMaxR(arrow).toFixed(4)}`,
);

out(
  `before copy: arrow.position=[${arrow.position.x.toFixed(3)},${arrow.position.y.toFixed(3)}] scaleVec=${arrow.scaleVector.x.toFixed(3)}`,
);
const target = arrow.copy() as Arrow;
out(
  `target after copy: getEnd()=[${target.getEnd().map((v: number) => v.toFixed(3))}] pos=[${target.position.x.toFixed(3)},${target.position.y.toFixed(3)}] scale=${target.scaleVector.x.toFixed(3)}`,
);
target.putStartAndEndOn(
  [Math.cos(angle), Math.sin(angle), 0],
  [(radius + 0.7) * Math.cos(angle), (radius + 0.7) * Math.sin(angle), 0],
);
await scene.play(new Transform(arrow, target, { duration: 0.01 }));
out(
  `after Transform: getEnd()=[${arrow.getEnd().map((v: number) => v.toFixed(3))}] tipMaxR=${tipWorldMaxR(arrow).toFixed(4)}`,
);
out(`R=${R}`);
