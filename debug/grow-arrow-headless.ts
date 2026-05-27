// eslint-disable
// Run with: bun run debug/grow-arrow-headless.ts
import { Scene } from '../src/core/Scene';
import { Arrow } from '../src/index';
import { GrowArrow } from '../src/index';

const scene = Scene.createHeadless();

const arrow = new Arrow({ color: '#e94560' });

const fmt = (v: { x: number; y: number; z: number }) => [v.x, v.y, v.z];

console.log('=== Default Arrow Properties ===');
console.log('arrow.position:', fmt(arrow.position));
console.log('arrow._start:', arrow._start);
console.log('arrow._end:', arrow._end);
console.log('arrow.getCenter():', arrow.getCenter());

console.log('\n--- Children (shaft, tip) ---');
arrow.children.forEach((part, i) => {
  const name = part.constructor.name;
  console.log(`child[${i}] (${name}):`);
  console.log('  position:', fmt(part.position));
  console.log('  getCenter():', part.getCenter());
});

console.log('\n--- After GrowArrow ---');
scene.add(arrow);
await scene.play(new GrowArrow(arrow, { duration: 0.1 }));

console.log('arrow.position:', fmt(arrow.position));
console.log('arrow.getCenter():', arrow.getCenter());
arrow.children.forEach((part, i) => {
  console.log(`child[${i}] position:`, fmt(part.position));
});

scene.dispose();
