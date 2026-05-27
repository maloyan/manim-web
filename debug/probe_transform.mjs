// Probe the Transform pipeline for ArrowTip alignment
// Run with: node --experimental-vm-modules debug/probe_transform.mjs
// (needs tsx/ts-node or a build step — use tsx instead)

import { Arrow, Transform } from '../src/index.ts';
import { PointMorphStrategy } from '../src/animation/transform/PointMorphStrategy.ts';
import { alignVmobjectPair } from '../src/animation/transform/TransformPairing.ts';

// Replicate the arrow-dance final step for arrow[0]:
// - Arrow originally points right (angle=0)
// - After Rotate(π) and normalizeTransform, it points left but rotation baked in
// - Target: fresh tangential arrow pointing up

const radius = 2.6;
const tipLength = 0.28;
const tipWidth = 0.12;

// Source arrow: radial at angle=0, then scaled 0.5, then rotated π
const source = new Arrow({
  start: [0, 0, 0],
  end: [radius * Math.cos(0), radius * Math.sin(0), 0],
  color: '#7dd3fc',
  strokeWidth: 3,
  tipLength,
  tipWidth,
});

// Replicate scale(0.5)
source.scale(0.5);

// Replicate Rotate(π) - just set rotation directly (Rotate animates, end state = π)
source.rotation.z = Math.PI;

console.log('=== SOURCE (before normalizeTransform) ===');
console.log('Arrow rotation.z:', source.rotation.z.toFixed(4));
const shaft0 = source.children[0];
const tip0 = source.children[1];
console.log('Shaft position:', shaft0.position.toArray().map(v => v.toFixed(4)));
console.log('Tip  position:', tip0.position.toArray().map(v => v.toFixed(4)));
console.log('Tip  points (10):', tip0.getPoints().map(p => `(${p[0].toFixed(3)},${p[1].toFixed(3)})`).join(' '));

// normalizeTransform bakes rotation into children
source.normalizeTransform();

console.log('\n=== SOURCE (after normalizeTransform) ===');
console.log('Arrow rotation.z:', source.rotation.z.toFixed(4));
const shaft1 = source.children[0];
const tip1 = source.children[1];
console.log('Shaft position:', shaft1.position.toArray().map(v => v.toFixed(4)));
console.log('Tip  position:', tip1.position.toArray().map(v => v.toFixed(4)));
console.log('Tip  points (10):', tip1.getPoints().map(p => `(${p[0].toFixed(3)},${p[1].toFixed(3)})`).join(' '));
console.log('Tip  anchors [0,3,6]:', [0,3,6].map(i => { const p = tip1.getPoints()[i]; return `[${i}]=(${p[0].toFixed(3)},${p[1].toFixed(3)})`; }).join('  '));

// Build target: tangential at arrow[0]'s center
const center = source.getCenter();
const angle = Math.atan2(center[1], center[0]);
const tx = -Math.sin(angle);
const ty = Math.cos(angle);
const half = source.getLength() / 2;
const start = [center[0] - tx * half, center[1] - ty * half, 0];
const end = [center[0] + tx * half, center[1] + ty * half, 0];

const target = new Arrow({ start, end, color: '#7dd3fc', strokeWidth: 3, tipLength, tipWidth });

console.log('\n=== TARGET (fresh, tangential) ===');
const tTip = target.children[1];
console.log('Tip  position:', tTip.position.toArray().map(v => v.toFixed(4)));
console.log('Tip  points (10):', tTip.getPoints().map(p => `(${p[0].toFixed(3)},${p[1].toFixed(3)})`).join(' '));
console.log('Tip  anchors [0,3,6]:', [0,3,6].map(i => { const p = tTip.getPoints()[i]; return `[${i}]=(${p[0].toFixed(3)},${p[1].toFixed(3)})`; }).join('  '));

// Now run alignVmobjectPair on just the tip pair (copies of normalized tip1 and tTip)
const srcTipCopy = tip1.copy();
const tgtTipCopy = tTip.copy();

console.log('\n=== alignVmobjectPair(srcTip, tgtTip) ===');
const aligned = alignVmobjectPair(srcTipCopy, tgtTipCopy);
console.log('startPoints anchors [0,3,6]:', [0,3,6].map(i => { const p = aligned.startPoints[i]; return `[${i}]=(${p[0].toFixed(3)},${p[1].toFixed(3)})`; }).join('  '));
console.log('targetPoints anchors [0,3,6]:', [0,3,6].map(i => { const p = aligned.targetPoints[i]; return `[${i}]=(${p[0].toFixed(3)},${p[1].toFixed(3)})`; }).join('  '));

// Check if apex (index 3 = (0,0)) of source maps to apex (0,0) of target
const srcApex = aligned.startPoints[3];
const tgtApex = aligned.targetPoints[3];
console.log('\nSource apex at start:', `(${srcApex[0].toFixed(4)},${srcApex[1].toFixed(4)})`);
console.log('Target apex at end:  ', `(${tgtApex[0].toFixed(4)},${tgtApex[1].toFixed(4)})`);
const buggy = Math.abs(tgtApex[0]) > 0.01 || Math.abs(tgtApex[1]) > 0.01;
console.log(buggy ? '*** BUG: apex morphs to non-apex target ***' : 'OK: apex→apex');

// Also show what target[3] was BEFORE alignment (should be (0,0) for fresh tip)
console.log('\nTarget tip original apex:', `(${tTip.getPoints()[3][0].toFixed(4)},${tTip.getPoints()[3][1].toFixed(4)})`);
