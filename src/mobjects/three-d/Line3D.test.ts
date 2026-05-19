/**
 * Regression tests for Line3D lineWidth (issue #361).
 *
 * Before the fix, Line3D rendered with THREE.LineBasicMaterial, whose
 * `linewidth` property is silently ignored by the WebGL renderer on every
 * desktop platform. lineWidth was effectively a no-op.
 *
 * Fix: render with Line2 + LineMaterial. This test pins the new behavior
 * and the wiring of Scene → renderer-resolution → material.resolution.
 */
import { describe, it, expect } from 'vitest';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { ThreeDScene } from '../../core/ThreeDScene';
import { Group } from '../../core/Group';
import { Line3D } from './Line3D';

function getMaterial(line: Line3D): LineMaterial {
  const l = line.getThreeObject() as Line2;
  return l.material as LineMaterial;
}

describe('Line3D lineWidth (issue #361)', () => {
  it('renders with Line2 so wide lines work cross-platform', () => {
    const line = new Line3D({ end: [1, 1, 1], lineWidth: 12 });
    const obj = line.getThreeObject();
    expect(obj).toBeInstanceOf(Line2);
  });

  it('applies the requested lineWidth to LineMaterial.linewidth', () => {
    const line = new Line3D({ end: [1, 0, 0], lineWidth: 12 });
    expect(getMaterial(line).linewidth).toBe(12);
  });

  it('defaults to lineWidth=2 in pixels', () => {
    const line = new Line3D({ end: [1, 0, 0] });
    expect(line.getLineWidth()).toBe(2);
    expect(getMaterial(line).linewidth).toBe(2);
  });

  it('disables frustum culling to avoid clipping the shader quad', () => {
    const line = new Line3D({ end: [1, 0, 0], lineWidth: 4 });
    const obj = line.getThreeObject() as Line2;
    expect(obj.frustumCulled).toBe(false);
  });

  it('setLineWidth() syncs to the underlying material after a render', () => {
    const scene = ThreeDScene.createHeadless();
    const line = new Line3D({ end: [1, 0, 0], lineWidth: 4 });
    scene.add(line);
    line.setLineWidth(16);
    // Force a render so _syncMaterialToThree runs.
    scene.render();
    expect(getMaterial(line).linewidth).toBe(16);
    scene.dispose();
  });

  it('respects opacity → transparent flag on the material', () => {
    const line = new Line3D({ end: [1, 0, 0], lineWidth: 4, opacity: 0.5 });
    const mat = getMaterial(line);
    expect(mat.opacity).toBe(0.5);
    expect(mat.transparent).toBe(true);
  });

  it('uses inherited strokeWidth as the source of truth so setStyle works', () => {
    const scene = ThreeDScene.createHeadless();
    const line = new Line3D({ end: [1, 0, 0], lineWidth: 4 });
    scene.add(line);
    line.setStyle({ strokeWidth: 20 });
    scene.render();
    expect(line.getLineWidth()).toBe(20);
    expect(getMaterial(line).linewidth).toBe(20);
    scene.dispose();
  });
});

describe('Line3D scene context → LineMaterial.resolution', () => {
  it('Scene.add() propagates renderer dimensions to material.resolution', () => {
    const scene = ThreeDScene.createHeadless({ width: 1024, height: 768 });
    const line = new Line3D({ end: [1, 0, 0], lineWidth: 4 });
    scene.add(line);
    const res = getMaterial(line).resolution;
    expect(res.x).toBe(1024);
    expect(res.y).toBe(768);
    scene.dispose();
  });

  it('Scene.resize() updates material.resolution', () => {
    const scene = ThreeDScene.createHeadless({ width: 800, height: 600 });
    const line = new Line3D({ end: [1, 0, 0], lineWidth: 4 });
    scene.add(line);
    scene.resize(1600, 900);
    const res = getMaterial(line).resolution;
    expect(res.x).toBe(1600);
    expect(res.y).toBe(900);
    scene.dispose();
  });

  it('inherits the global renderer-resolution fallback when added inside a group', () => {
    // A non-default scene size primes the VMobject renderer-size statics, which
    // the Line3D constructor reads as a fallback before _setSceneContext fires.
    const scene = ThreeDScene.createHeadless({ width: 1280, height: 720 });
    const group = new Group();
    scene.add(group);
    const line = new Line3D({ end: [1, 0, 0], lineWidth: 4 });
    group.add(line);
    const res = getMaterial(line).resolution;
    expect(res.x).toBe(1280);
    expect(res.y).toBe(720);
    scene.dispose();
  });
});
