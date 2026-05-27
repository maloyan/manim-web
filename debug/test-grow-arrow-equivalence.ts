/* eslint-disable */
// Run with: bun run debug/test-grow-arrow-equivalence.ts
import { Scene } from '../src/core/Scene';
import { Arrow } from '../src/index';
import { GrowArrow } from '../src/index';

const scene = Scene.createHeadless();

const fmt = (v: any) => [v.x, v.y, v.z];

// Create default arrow
const arrow1 = new Arrow({ color: '#e94560' });

// Create arrow, apply animation
const arrow2 = new Arrow({ color: '#e94560' });
scene.add(arrow2);
await scene.play(new GrowArrow(arrow2, { duration: 0.1 }));

console.log('=== Comparison ===');
console.log('arrow1 (default):');
console.log('  position:', fmt(arrow1.position));
console.log('  getCenter():', fmt(arrow1.getCenter()));
console.log('  _start:', arrow1._start);
console.log('  _end:', arrow1._end);

console.log('arrow2 (after GrowArrow):');
console.log('  position:', fmt(arrow2.position));
console.log('  getCenter():', fmt(arrow2.getCenter()));
console.log('  _start:', arrow2._start);
console.log('  _end:', arrow2._end);

// Check equivalence
console.log('\n=== Equivalence Check ===');
const positionMatch =
  arrow1.position.x === arrow2.position.x &&
  arrow1.position.y === arrow2.position.y &&
  arrow1.position.z === arrow2.position.z;
const centerMatch =
  arrow1.getCenter().x === arrow2.getCenter().x &&
  arrow1.getCenter().y === arrow2.getCenter().y &&
  arrow1.getCenter().z === arrow2.getCenter().z;

console.log('position matches:', positionMatch);
console.log('getCenter() matches:', centerMatch);

if (!positionMatch || !centerMatch) {
  console.log('\n❌ FAIL: Arrow after GrowArrow is not equivalent to default Arrow');
} else {
  console.log('\n✅ PASS: Arrow after GrowArrow is equivalent to default Arrow');
}

scene.dispose();
