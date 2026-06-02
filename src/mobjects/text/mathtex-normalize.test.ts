// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { MathTexImage } from './MathTexImage';
import { VGroup } from '../../core/VGroup';

// happy-dom has no 2D canvas context, so the background LaTeX render rejects.
// These tests only exercise the transform-baking math, not rendering, so we
// stub the async render to a no-op to keep the suite's console.error guard quiet.
beforeEach(() => {
  vi.spyOn(
    MathTexImage.prototype as unknown as { _renderLatex(): Promise<void> },
    '_renderLatex',
  ).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Regression coverage for #417: a TexturedMobject (MathTexImage) must absorb its
 * own scale + in-plane (Z) rotation into the display mesh during
 * normalizeTransform, so the rendered mesh survives `scaleVector`/`rotation`
 * being reset to identity. Without this the logo M rendered tiny and rotated
 * axis labels rendered in a stray row (Bugs B and C).
 */
describe('MathTexImage survives normalizeTransform (#417)', () => {
  // Build a single-part MathTexImage with a known render size, with its mesh
  // created, without depending on async LaTeX rendering.
  const makeSized = (w: number, h: number): MathTexImage => {
    const tex = new MathTexImage({ latex: 'M' });
    const rs = (tex as unknown as { _renderState: { width: number; height: number } })._renderState;
    rs.width = w;
    rs.height = h;
    tex.getThreeObject(); // create the mesh
    tex.applyVisualSize(w, h); // rebuild geometry to match
    return tex;
  };

  const planeSize = (tex: MathTexImage): { w: number; h: number } => {
    const mesh = tex.getDisplayMeshes()[0];
    const params = (mesh.geometry as THREE.PlaneGeometry).parameters;
    return { w: params.width, h: params.height };
  };

  it('bakes scale into the mesh geometry so size persists after scaleVector→1', () => {
    const tex = makeSized(1, 0.5);
    tex.scale(7);
    expect(tex.scaleVector.x).toBeCloseTo(7, 6);

    tex.normalizeTransform();

    // scaleVector is reset to identity...
    expect(tex.scaleVector.x).toBeCloseTo(1, 6);
    expect(tex.scaleVector.y).toBeCloseTo(1, 6);
    // ...but the mesh geometry now reflects the baked 7x size.
    const { w, h } = planeSize(tex);
    expect(w).toBeCloseTo(7, 4);
    expect(h).toBeCloseTo(3.5, 4);
  });

  it('scale baking is idempotent (second normalize does not double-apply)', () => {
    const tex = makeSized(1, 0.5);
    tex.scale(7);
    tex.normalizeTransform();
    const first = planeSize(tex);
    tex.normalizeTransform();
    const second = planeSize(tex);
    expect(second.w).toBeCloseTo(first.w, 6);
    expect(second.h).toBeCloseTo(first.h, 6);
  });

  it('a scaled MathTexImage inside a VGroup keeps its baked size after group normalize', () => {
    const tex = makeSized(1, 0.5);
    tex.scale(3);
    const vg = new VGroup(tex); // constructor normalizes
    vg.normalizeTransform();
    expect(tex.scaleVector.x).toBeCloseTo(1, 6);
    const { w } = planeSize(tex);
    expect(w).toBeCloseTo(3, 4);
  });

  it('a Z-rotated MathTexImage in a group bakes net rotation into the mesh', () => {
    // Group rotated +90°, child counter-rotated -90° => net 0 visual orientation,
    // mirroring the heat-diagram y-axis labels.
    const label = makeSized(0.4, 0.4);
    label.rotate(-Math.PI / 2); // own counter-rotation
    const group = new VGroup(label);
    group.rotate(Math.PI / 2); // container rotation
    group.normalizeTransform();

    // Everything resolves to identity transforms with the orientation baked.
    expect(group.rotation.z).toBeCloseTo(0, 6);
    expect(label.rotation.z).toBeCloseTo(0, 6);

    // Net mesh world rotation is flat (0): the +90 and -90 cancel.
    const mesh = label.getDisplayMeshes()[0];
    group._syncToThree();
    mesh.updateWorldMatrix(true, true);
    const e = new THREE.Euler().setFromQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()));
    expect(Math.abs(e.z) % Math.PI).toBeCloseTo(0, 4);
  });
});
