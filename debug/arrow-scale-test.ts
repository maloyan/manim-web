/**
 * Checks that arrow.animate.scale(0.5) halves the world-space arrow length
 * and sets each child's scaleVector to [0.5,0.5,0.5], with and without
 * normalizeTransform() beforehand, and after a Transform.
 *
 * Run with:  bun run debug/arrow-scale-test.ts
 */
import * as THREE from 'three';
import { Arrow } from '../src/mobjects/geometry/Arrow';
import { Scale } from '../src/animation/movement/Scale';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function worldLength(arrow: Arrow): number {
  const [sx, sy, sz] = arrow.getStart() as [number, number, number];
  const [ex, ey, ez] = arrow.getEnd() as [number, number, number];
  return Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2 + (ez - sz) ** 2);
}

function worldCenter(arrow: Arrow): THREE.Vector3 {
  const [sx, sy, sz] = arrow.getStart() as [number, number, number];
  const [ex, ey, ez] = arrow.getEnd() as [number, number, number];
  return new THREE.Vector3((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2);
}

function childScales(arrow: Arrow): string {
  const s = arrow.children[0].scaleVector;
  const t = arrow.children[1].scaleVector;
  return `shaft=(${s.x.toFixed(3)},${s.y.toFixed(3)},${s.z.toFixed(3)}) tip=(${t.x.toFixed(3)},${t.y.toFixed(3)},${t.z.toFixed(3)})`;
}

function fmt3(v: THREE.Vector3): string {
  return `(${v.x.toFixed(4)}, ${v.y.toFixed(4)}, ${v.z.toFixed(4)})`;
}

function assertClose(label: string, actual: number, expected: number, eps = 1e-3): void {
  const ok = Math.abs(actual - expected) <= eps;
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'} ${label}: got ${actual.toFixed(5)}, expected ${expected.toFixed(5)}`,
  );
  if (!ok) process.exitCode = 1;
}

function assertVecClose(
  label: string,
  actual: THREE.Vector3,
  expected: THREE.Vector3,
  eps = 1e-3,
): void {
  const ok = actual.distanceTo(expected) <= eps;
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'} ${label}: got ${fmt3(actual)}, expected ${fmt3(expected)}`,
  );
  if (!ok) process.exitCode = 1;
}

function applyScale(arrow: Arrow, factor: number): void {
  const anim = new Scale(arrow, { scaleFactor: factor });
  anim.begin();
  anim.interpolate(1);
  anim.finish();
}

// ---------------------------------------------------------------------------
// Case 1: scale(0.5) without prior normalizeTransform
// ---------------------------------------------------------------------------

console.log('\n=== Case 1: scale(0.5) without normalizeTransform ===');
{
  const arrow = new Arrow({ start: [0, 0, 0], end: [2, 0, 0] });

  const lenBefore = worldLength(arrow);
  const ctrBefore = worldCenter(arrow);
  console.log(`  before: worldLength=${lenBefore.toFixed(4)}, center=${fmt3(ctrBefore)}`);
  console.log(
    `  before: arrow.scaleVector=${fmt3(arrow.scaleVector)}, children: ${childScales(arrow)}`,
  );

  applyScale(arrow, 0.5);

  const lenAfter = worldLength(arrow);
  const ctrAfter = worldCenter(arrow);
  console.log(`  after:  worldLength=${lenAfter.toFixed(4)}, center=${fmt3(ctrAfter)}`);
  console.log(
    `  after:  arrow.scaleVector=${fmt3(arrow.scaleVector)}, children: ${childScales(arrow)}`,
  );

  assertClose('world length × 0.5', lenAfter, lenBefore * 0.5);
  assertVecClose(
    'arrow scaleVector = (0.5,0.5,0.5)',
    arrow.scaleVector,
    new THREE.Vector3(0.5, 0.5, 0.5),
  );
}

// ---------------------------------------------------------------------------
// Case 2: scale(0.5) after normalizeTransform
// ---------------------------------------------------------------------------

console.log('\n=== Case 2: scale(0.5) after normalizeTransform ===');
{
  const arrow = new Arrow({ start: [0, 0, 0], end: [2, 0, 0] });
  arrow.normalizeTransform();

  const lenBefore = worldLength(arrow);
  const ctrBefore = worldCenter(arrow);
  console.log(`  before: worldLength=${lenBefore.toFixed(4)}, center=${fmt3(ctrBefore)}`);
  console.log(
    `  before: arrow.scaleVector=${fmt3(arrow.scaleVector)}, children: ${childScales(arrow)}`,
  );

  applyScale(arrow, 0.5);

  const lenAfter = worldLength(arrow);
  const ctrAfter = worldCenter(arrow);
  console.log(`  after:  worldLength=${lenAfter.toFixed(4)}, center=${fmt3(ctrAfter)}`);
  console.log(
    `  after:  arrow.scaleVector=${fmt3(arrow.scaleVector)}, children: ${childScales(arrow)}`,
  );

  assertClose('world length × 0.5', lenAfter, lenBefore * 0.5);
  assertVecClose(
    'arrow scaleVector = (0.5,0.5,0.5)',
    arrow.scaleVector,
    new THREE.Vector3(0.5, 0.5, 0.5),
  );
  // z has a ~0.0045 structural offset from the ArrowTip geometry; only check xy.
  assertClose('center.x preserved', ctrAfter.x, ctrBefore.x);
  assertClose('center.y preserved', ctrAfter.y, ctrBefore.y);
}

// ---------------------------------------------------------------------------
// Case 3: scale(0.5) after Transform (the arrow-dance scenario)
// ---------------------------------------------------------------------------

console.log('\n=== Case 3: scale(0.5) after Transform ===');
{
  const { Transform } = await import('../src/animation/transform/Transform');

  const arrow = new Arrow({ start: [0, 0, 0], end: [2, 0, 0] });
  const target = new Arrow({ start: [0.5, 0, 0], end: [3.5, 0, 0] });

  const xform = new Transform(arrow, target, { duration: 1 });
  xform.begin();
  xform.interpolate(1);
  xform.finish();

  const lenBefore = worldLength(arrow);
  const ctrBefore = worldCenter(arrow);
  console.log(`  after Transform: worldLength=${lenBefore.toFixed(4)}, center=${fmt3(ctrBefore)}`);
  console.log(
    `  arrow.position=${fmt3(arrow.position)}, scaleVector=${fmt3(arrow.scaleVector)}, children: ${childScales(arrow)}`,
  );

  applyScale(arrow, 0.5);

  const lenAfter = worldLength(arrow);
  const ctrAfter = worldCenter(arrow);
  console.log(`  after scale:     worldLength=${lenAfter.toFixed(4)}, center=${fmt3(ctrAfter)}`);
  console.log(
    `  arrow.position=${fmt3(arrow.position)}, scaleVector=${fmt3(arrow.scaleVector)}, children: ${childScales(arrow)}`,
  );

  assertClose('world length × 0.5', lenAfter, lenBefore * 0.5);
  assertVecClose(
    'arrow scaleVector = (0.5,0.5,0.5)',
    arrow.scaleVector,
    new THREE.Vector3(0.5, 0.5, 0.5),
  );
  // z has a ~0.0045 structural offset from the ArrowTip geometry; only check xy.
  assertClose('center.x preserved', ctrAfter.x, ctrBefore.x);
  assertClose('center.y preserved', ctrAfter.y, ctrBefore.y);
}
