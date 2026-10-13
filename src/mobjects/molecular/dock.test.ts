/**
 * Tests for dockLigand, the ligand-docking animation composer.
 *
 * dockLigand places the ligand at target + startOffset and returns one
 * Animation that moves it to the target (optionally spinning). The tests drive
 * the animation deterministically with begin / interpolate / finish; no GL
 * scene is needed.
 */
import { describe, it, expect } from 'vitest';
import { dockLigand } from './dock';
import { Molecule3D } from './Molecule3D';
import { Animation } from '../../animation/Animation';
import type { Vector3Tuple } from '../../core/Mobject';

/** A tiny ligand: a 3-atom molecule. */
function makeLigand(): Molecule3D {
  return new Molecule3D({
    atoms: [
      { element: 'C', position: [0, 0, 0] },
      { element: 'O', position: [0.6, 0, 0] },
      { element: 'N', position: [-0.6, 0, 0] },
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
    ],
  });
}

/** Run an animation to completion. */
function runToEnd(anim: Animation): void {
  anim.begin();
  anim.interpolate(1);
  anim.finish();
}

describe('dockLigand', () => {
  it('returns an Animation', () => {
    const anim = dockLigand({ ligand: makeLigand(), target: [0, 0, 0] });
    expect(anim).toBeInstanceOf(Animation);
  });

  it('places the ligand at target + startOffset before playing', () => {
    const ligand = makeLigand();
    dockLigand({ ligand, target: [1, 2, 3], startOffset: [0, 0, 5] });
    const center = ligand.getCenter();
    expect(center[0]).toBeCloseTo(1, 5);
    expect(center[1]).toBeCloseTo(2, 5);
    expect(center[2]).toBeCloseTo(8, 5);
  });

  it('lands the ligand on the target after completion (with spin)', () => {
    const ligand = makeLigand();
    const target: Vector3Tuple = [2, -1, 4];
    const anim = dockLigand({ ligand, target, startOffset: [0, 0, 6], spin: true });
    runToEnd(anim);
    const center = ligand.getCenter();
    expect(center[0]).toBeCloseTo(target[0], 4);
    expect(center[1]).toBeCloseTo(target[1], 4);
    expect(center[2]).toBeCloseTo(target[2], 4);
  });

  it('lands the ligand on the target after completion (no spin)', () => {
    const ligand = makeLigand();
    const target: Vector3Tuple = [-3, 2, 1];
    const anim = dockLigand({ ligand, target, spin: false });
    expect(anim).toBeInstanceOf(Animation);
    runToEnd(anim);
    const center = ligand.getCenter();
    expect(center[0]).toBeCloseTo(target[0], 4);
    expect(center[1]).toBeCloseTo(target[1], 4);
    expect(center[2]).toBeCloseTo(target[2], 4);
  });
});
