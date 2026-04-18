/**
 * Regression tests for ThreeDAxes labels (issue #263).
 *
 * Before the fix, `showLabels: true` was accepted by the options type
 * but ignored, so no label mobjects were ever added.
 *
 * Label rendering mirrors Manim CE's `ThreeDAxes.get_axis_labels`:
 * - defaults "x", "y", "z" rendered via MathTex (italic math),
 * - Z label rotated PI/2 around X so it stands upright,
 * - `getAxisLabels(x, y, z)` creates labels on demand with overrides.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Group } from '../../core/Group';
import { Mobject } from '../../core/Mobject';
import { MathTexImage } from '../text/MathTexImage';
import { Text } from '../text/Text';
import { ThreeDAxes } from './ThreeDAxes';

describe('ThreeDAxes showLabels', () => {
  it('does not create labels by default', () => {
    const axes = new ThreeDAxes();
    expect(axes.getXLabel()).toBeNull();
    expect(axes.getYLabel()).toBeNull();
    expect(axes.getZLabel()).toBeNull();
  });

  it('creates x/y/z MathTex labels when showLabels is true', () => {
    const axes = new ThreeDAxes({ showLabels: true });

    const xLabel = axes.getXLabel();
    const yLabel = axes.getYLabel();
    const zLabel = axes.getZLabel();

    expect(xLabel).toBeInstanceOf(MathTexImage);
    expect(yLabel).toBeInstanceOf(MathTexImage);
    expect(zLabel).toBeInstanceOf(MathTexImage);

    expect((xLabel as MathTexImage).getLatex()).toBe('x');
    expect((yLabel as MathTexImage).getLatex()).toBe('y');
    expect((zLabel as MathTexImage).getLatex()).toBe('z');
  });

  it('adds label mobjects as descendants of the axes group', () => {
    const axes = new ThreeDAxes({ showLabels: true });
    const labelGroup = axes.getAxisLabels();
    expect(axes.children).toContain(labelGroup);
    expect(labelGroup.children).toContain(axes.getXLabel());
    expect(labelGroup.children).toContain(axes.getYLabel());
    expect(labelGroup.children).toContain(axes.getZLabel());
  });

  it('positions labels just past each arrow tip along the axis direction', () => {
    const axes = new ThreeDAxes({
      xRange: [-5, 5, 1],
      yRange: [-5, 5, 1],
      zRange: [-5, 5, 1],
      showLabels: true,
      labelBuffer: 0.4,
    });

    // Manim→THREE: (mx, my, mz) → (mx, mz, -my)
    const xPos = axes.getXLabel()!.position;
    expect(xPos.x).toBeCloseTo(5.4);
    expect(xPos.y).toBeCloseTo(0);
    expect(xPos.z).toBeCloseTo(0);

    const yPos = axes.getYLabel()!.position;
    expect(yPos.x).toBeCloseTo(0);
    expect(yPos.y).toBeCloseTo(0);
    expect(yPos.z).toBeCloseTo(-5.4);

    // Z label: offset to the side of the tip (Manim CE RIGHT direction)
    // so it doesn't sit directly on the arrow.
    const zPos = axes.getZLabel()!.position;
    expect(zPos.x).toBeCloseTo(0.4);
    expect(zPos.y).toBeCloseTo(5 + 0.4 * 0.3);
    expect(zPos.z).toBeCloseTo(0);
  });

  // Helper: find the Mesh nested inside a MathTexImage-style Group.
  const findMesh = (obj: THREE.Object3D): THREE.Mesh | null => {
    let found: THREE.Mesh | null = null;
    obj.traverse((child) => {
      if (!found && child instanceof THREE.Mesh) found = child;
    });
    return found;
  };

  it('installs an onBeforeRender billboard hook on each label mesh by default', () => {
    const axes = new ThreeDAxes({ showLabels: true });
    for (const label of [axes.getXLabel(), axes.getYLabel(), axes.getZLabel()]) {
      const mesh = findMesh(label!.getThreeObject());
      expect(mesh).not.toBeNull();
      expect(mesh!.onBeforeRender).toBeInstanceOf(Function);
    }
  });

  it('billboard hook aligns mesh world rotation with the camera', () => {
    const axes = new ThreeDAxes({ showLabels: true });
    // Put the axes into a THREE scene so matrixWorld on the mesh resolves.
    const dummyScene = new THREE.Scene();
    dummyScene.add(axes.getThreeObject());

    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    cam.position.set(5, 3, 8);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();

    const mesh = findMesh(axes.getXLabel()!.getThreeObject())!;
    const renderer = {} as THREE.WebGLRenderer;
    mesh.onBeforeRender!(
      renderer,
      dummyScene,
      cam,
      mesh.geometry,
      mesh.material as THREE.Material,
      null,
    );
    const meshWorldQuat = new THREE.Quaternion();
    mesh.getWorldQuaternion(meshWorldQuat);
    expect(meshWorldQuat.angleTo(cam.quaternion)).toBeLessThan(1e-3);
  });

  it('skips billboard hook when billboardLabels is false', () => {
    const axes = new ThreeDAxes({ showLabels: true, billboardLabels: false });
    for (const label of [axes.getXLabel(), axes.getYLabel(), axes.getZLabel()]) {
      const mesh = findMesh(label!.getThreeObject());
      // Default Object3D.onBeforeRender is a reference-shared no-op. It does
      // NOT mention camera.quaternion in its source.
      expect(String(mesh!.onBeforeRender)).not.toContain('camera.quaternion');
    }
  });

  it('leaves labels upright (MathTexImage plane already stands vertical in THREE)', () => {
    // Manim CE rotates its z-label PI/2 around X because its native coord
    // system has Z up and Text lies on XY by default. In THREE, MathTexImage's
    // plane is already vertical (normal +Z), so no axis-specific rotation is
    // applied here. All three labels keep identity rotation.
    const axes = new ThreeDAxes({ showLabels: true });
    expect(axes.getXLabel()!.rotation.x).toBeCloseTo(0);
    expect(axes.getYLabel()!.rotation.x).toBeCloseTo(0);
    expect(axes.getZLabel()!.rotation.x).toBeCloseTo(0);
  });

  it('accepts custom label strings per axis', () => {
    const axes = new ThreeDAxes({
      showLabels: true,
      labels: { x: 'time', y: 'depth', z: '\\theta' },
    });
    expect((axes.getXLabel() as MathTexImage).getLatex()).toBe('time');
    expect((axes.getYLabel() as MathTexImage).getLatex()).toBe('depth');
    expect((axes.getZLabel() as MathTexImage).getLatex()).toBe('\\theta');
  });

  it('accepts pre-built Mobject labels without wrapping them', () => {
    const custom = new Text({ text: 'foo', fontSize: 12 });
    const axes = new ThreeDAxes({
      showLabels: true,
      labels: { x: custom },
    });
    expect(axes.getXLabel()).toBe(custom);
  });

  it('colors labels using each axis color', () => {
    const axes = new ThreeDAxes({
      showLabels: true,
      xColor: '#ff0000',
      yColor: '#00ff00',
      zColor: '#0000ff',
    });
    expect((axes.getXLabel() as Mobject).color).toBe('#ff0000');
    expect((axes.getYLabel() as Mobject).color).toBe('#00ff00');
    expect((axes.getZLabel() as Mobject).color).toBe('#0000ff');
  });

  it('copies preserve showLabels and custom labels', () => {
    const axes = new ThreeDAxes({
      showLabels: true,
      labels: { x: 'time' },
    });
    const copy = axes.copy() as ThreeDAxes;
    expect(copy.getXLabel()).not.toBeNull();
    expect((copy.getXLabel() as MathTexImage).getLatex()).toBe('time');
    expect((copy.getYLabel() as MathTexImage).getLatex()).toBe('y');
  });

  describe('getAxisLabels() on-demand creation (Manim CE parity)', () => {
    it('creates labels on demand when showLabels was false', () => {
      const axes = new ThreeDAxes();
      const group = axes.getAxisLabels();
      expect(group).toBeInstanceOf(Group);
      expect(group.children.length).toBe(3);
      expect(axes.getXLabel()).not.toBeNull();
    });

    it('returns the group of existing labels when already created', () => {
      const axes = new ThreeDAxes({ showLabels: true });
      const firstX = axes.getXLabel();
      const group = axes.getAxisLabels();
      expect(group.children.length).toBe(3);
      // Same underlying label mobject if no overrides passed
      expect(axes.getXLabel()).toBe(firstX);
    });

    it('overrides label strings when arguments are passed', () => {
      const axes = new ThreeDAxes();
      axes.getAxisLabels('\\alpha', '\\beta', '\\gamma');
      expect((axes.getXLabel() as MathTexImage).getLatex()).toBe('\\alpha');
      expect((axes.getYLabel() as MathTexImage).getLatex()).toBe('\\beta');
      expect((axes.getZLabel() as MathTexImage).getLatex()).toBe('\\gamma');
    });

    it('accepts a Mobject for any individual axis', () => {
      const axes = new ThreeDAxes();
      const customY = new Text({ text: 'depth' });
      axes.getAxisLabels(undefined, customY);
      expect(axes.getYLabel()).toBe(customY);
      // x/z still fall back to defaults
      expect((axes.getXLabel() as MathTexImage).getLatex()).toBe('x');
      expect((axes.getZLabel() as MathTexImage).getLatex()).toBe('z');
    });

    it('replaces prior labels in the label group', () => {
      const axes = new ThreeDAxes({ showLabels: true });
      const oldX = axes.getXLabel();
      const group = axes.getAxisLabels('new');
      expect(axes.getXLabel()).not.toBe(oldX);
      expect(group.children).not.toContain(oldX);
      expect(group.children).toContain(axes.getXLabel());
    });
  });

  describe('shiftLabelsOntoScreen (Manim CE shift_onto_screen parity)', () => {
    // Use a tight camera so the far axis tips land outside the viewport.
    const makeTightCamera = () => {
      const cam = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
      cam.position.set(0, 8, 8);
      cam.lookAt(0, 0, 0);
      cam.updateMatrixWorld();
      return cam;
    };

    it('is a no-op when labels already fit the viewport', () => {
      const axes = new ThreeDAxes({
        xRange: [-1, 1, 1],
        yRange: [-1, 1, 1],
        zRange: [-1, 1, 1],
        showLabels: true,
      });
      const cam = new THREE.PerspectiveCamera(80, 1, 0.1, 1000);
      cam.position.set(0, 6, 6);
      cam.lookAt(0, 0, 0);
      cam.updateMatrixWorld();
      const before = axes.getXLabel()!.position.clone();
      axes.shiftLabelsOntoScreen(cam);
      expect(axes.getXLabel()!.position.distanceTo(before)).toBeLessThan(1e-6);
    });

    it('pulls labels back toward the origin when they overflow the viewport', () => {
      const axes = new ThreeDAxes({
        xRange: [-5, 5, 1],
        yRange: [-5, 5, 1],
        zRange: [-5, 5, 1],
        showLabels: true,
      });
      const cam = makeTightCamera();
      const beforeX = axes.getXLabel()!.position.clone();
      axes.shiftLabelsOntoScreen(cam);
      const afterX = axes.getXLabel()!.position;
      // Label moved strictly closer to the origin along the same ray.
      expect(afterX.length()).toBeLessThan(beforeX.length());
      // Direction preserved: dot > 0 means still on the +X-ish ray.
      expect(afterX.dot(beforeX)).toBeGreaterThan(0);
    });

    it('leaves label NDC within [-limit, limit] after shifting', () => {
      const axes = new ThreeDAxes({
        xRange: [-10, 10, 1],
        yRange: [-10, 10, 1],
        zRange: [-10, 10, 1],
        showLabels: true,
      });
      const cam = makeTightCamera();
      const margin = 0.05;
      axes.shiftLabelsOntoScreen(cam, margin);

      const ndcX = axes.getXLabel()!.position.clone().project(cam);
      expect(Math.abs(ndcX.x)).toBeLessThanOrEqual(1 - margin + 1e-3);
      expect(Math.abs(ndcX.y)).toBeLessThanOrEqual(1 - margin + 1e-3);
    });
  });
});
