/**
 * Tests for MappingCamera and SplitScreenCamera.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Camera2D } from './Camera';
import { MappingCamera, SplitScreenCamera } from './CameraExtensions';
import { Vector3Tuple } from './Mobject';

// ============================================================
// MappingCamera
// ============================================================

describe('MappingCamera', () => {
  let camera: MappingCamera;

  beforeEach(() => {
    camera = new MappingCamera();
  });

  it('constructs with default options (no mapping)', () => {
    expect(camera).toBeDefined();
    expect(camera.getMappingFunction()).toBeNull();
  });

  it('is instance of Camera2D', () => {
    expect(camera).toBeInstanceOf(Camera2D);
  });

  it('accepts Camera2D options in constructor', () => {
    const cam = new MappingCamera({ frameWidth: 20, frameHeight: 10 });
    expect(cam.frameWidth).toBe(20);
    expect(cam.frameHeight).toBe(10);
  });

  it('accepts a mapping function in constructor', () => {
    const fn = (p: Vector3Tuple): Vector3Tuple => [p[0] * 2, p[1] * 2, p[2]];
    const cam = new MappingCamera({ mappingFunction: fn });
    expect(cam.getMappingFunction()).toBe(fn);
  });

  it('setMappingFunction sets the transform and returns this', () => {
    const fn = (p: Vector3Tuple): Vector3Tuple => [p[0] + 1, p[1], p[2]];
    const result = camera.setMappingFunction(fn);
    expect(result).toBe(camera);
    expect(camera.getMappingFunction()).toBe(fn);
  });

  it('getMappingFunction returns null when no mapping set', () => {
    expect(camera.getMappingFunction()).toBeNull();
  });

  it('mapPoint applies the mapping to a point', () => {
    const fn = (p: Vector3Tuple): Vector3Tuple => [p[0] * 3, p[1] - 1, p[2] + 5];
    camera.setMappingFunction(fn);
    const result = camera.mapPoint([2, 4, 0]);
    expect(result).toEqual([6, 3, 5]);
  });

  it('mapPoint returns identity when no mapping set', () => {
    const point: Vector3Tuple = [3, 7, 1];
    const result = camera.mapPoint(point);
    expect(result).toEqual([3, 7, 1]);
  });

  it('resetMapping clears the mapping and returns this', () => {
    const fn = (p: Vector3Tuple): Vector3Tuple => [p[0] * 2, p[1], p[2]];
    camera.setMappingFunction(fn);
    const result = camera.resetMapping();
    expect(result).toBe(camera);
    expect(camera.getMappingFunction()).toBeNull();
    // After reset, mapPoint should be identity
    expect(camera.mapPoint([5, 6, 7])).toEqual([5, 6, 7]);
  });

  it('mapPoint works with non-linear mapping', () => {
    const fn = (p: Vector3Tuple): Vector3Tuple => [Math.sin(p[0]), Math.cos(p[1]), p[2]];
    camera.setMappingFunction(fn);
    const result = camera.mapPoint([Math.PI / 2, 0, 0]);
    expect(result[0]).toBeCloseTo(1, 5);
    expect(result[1]).toBeCloseTo(1, 5);
    expect(result[2]).toBe(0);
  });
});

// ============================================================
// SplitScreenCamera
// ============================================================

describe('SplitScreenCamera', () => {
  let splitCam: SplitScreenCamera;

  beforeEach(() => {
    splitCam = new SplitScreenCamera();
  });

  it('constructs with default horizontal split', () => {
    expect(splitCam).toBeDefined();
    expect(splitCam.getSplitDirection()).toBe('horizontal');
  });

  it('has leftCamera and rightCamera that are Camera2D instances', () => {
    const left = splitCam.getLeftCamera();
    const right = splitCam.getRightCamera();
    expect(left).toBeInstanceOf(Camera2D);
    expect(right).toBeInstanceOf(Camera2D);
    expect(left).not.toBe(right);
  });

  it('setSplit horizontal sets horizontal layout and returns this', () => {
    splitCam.setSplit('vertical'); // change first
    const result = splitCam.setSplit('horizontal');
    expect(result).toBe(splitCam);
    expect(splitCam.getSplitDirection()).toBe('horizontal');
  });

  it('setSplit vertical sets vertical layout and returns this', () => {
    const result = splitCam.setSplit('vertical');
    expect(result).toBe(splitCam);
    expect(splitCam.getSplitDirection()).toBe('vertical');
  });

  it('setSplitRatio changes the split position and returns this', () => {
    const result = splitCam.setSplitRatio(0.3);
    expect(result).toBe(splitCam);
    expect(splitCam.getSplitRatio()).toBeCloseTo(0.3);
  });

  it('setSplitRatio clamps to valid range', () => {
    splitCam.setSplitRatio(0);
    expect(splitCam.getSplitRatio()).toBeCloseTo(0.01);
    splitCam.setSplitRatio(1);
    expect(splitCam.getSplitRatio()).toBeCloseTo(0.99);
    splitCam.setSplitRatio(-0.5);
    expect(splitCam.getSplitRatio()).toBeCloseTo(0.01);
    splitCam.setSplitRatio(1.5);
    expect(splitCam.getSplitRatio()).toBeCloseTo(0.99);
  });

  it('getLeftCamera and getRightCamera return stable references', () => {
    const left1 = splitCam.getLeftCamera();
    const left2 = splitCam.getLeftCamera();
    expect(left1).toBe(left2);
    const right1 = splitCam.getRightCamera();
    const right2 = splitCam.getRightCamera();
    expect(right1).toBe(right2);
  });

  it('getMultiCamera returns the underlying MultiCamera', () => {
    const mc = splitCam.getMultiCamera();
    expect(mc).toBeDefined();
    // Should have 2 cameras
    expect(mc.count).toBe(2);
  });

  it('horizontal split viewports are correct for default 0.5 ratio', () => {
    splitCam.setSplit('horizontal');
    const mc = splitCam.getMultiCamera();
    const left = mc.getCamera(0);
    const right = mc.getCamera(1);
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    // Left: x=0, width=0.5
    expect(left!.viewport.x).toBeCloseTo(0);
    expect(left!.viewport.width).toBeCloseTo(0.5);
    expect(left!.viewport.y).toBeCloseTo(0);
    expect(left!.viewport.height).toBeCloseTo(1);
    // Right: x=0.5, width=0.5
    expect(right!.viewport.x).toBeCloseTo(0.5);
    expect(right!.viewport.width).toBeCloseTo(0.5);
  });

  it('vertical split viewports are correct for default 0.5 ratio', () => {
    splitCam.setSplit('vertical');
    const mc = splitCam.getMultiCamera();
    const top = mc.getCamera(0);
    const bottom = mc.getCamera(1);
    expect(top).not.toBeNull();
    expect(bottom).not.toBeNull();
    // Top: y=0.5, height=0.5
    expect(top!.viewport.x).toBeCloseTo(0);
    expect(top!.viewport.width).toBeCloseTo(1);
    expect(top!.viewport.y).toBeCloseTo(0.5);
    expect(top!.viewport.height).toBeCloseTo(0.5);
    // Bottom: y=0, height=0.5
    expect(bottom!.viewport.y).toBeCloseTo(0);
    expect(bottom!.viewport.height).toBeCloseTo(0.5);
  });

  it('custom split ratio updates viewports correctly', () => {
    splitCam.setSplit('horizontal');
    splitCam.setSplitRatio(0.3);
    const mc = splitCam.getMultiCamera();
    const left = mc.getCamera(0);
    const right = mc.getCamera(1);
    expect(left!.viewport.width).toBeCloseTo(0.3);
    expect(right!.viewport.x).toBeCloseTo(0.3);
    expect(right!.viewport.width).toBeCloseTo(0.7);
  });

  it('accepts custom cameras in constructor', () => {
    const leftCam = new Camera2D({ frameWidth: 10, frameHeight: 5 });
    const rightCam = new Camera2D({ frameWidth: 20, frameHeight: 10 });
    const sc = new SplitScreenCamera({
      leftCamera: leftCam,
      rightCamera: rightCam,
    });
    expect(sc.getLeftCamera()).toBe(leftCam);
    expect(sc.getRightCamera()).toBe(rightCam);
  });

  it('accepts split direction and ratio in constructor', () => {
    const sc = new SplitScreenCamera({
      split: 'vertical',
      splitRatio: 0.7,
    });
    expect(sc.getSplitDirection()).toBe('vertical');
    expect(sc.getSplitRatio()).toBeCloseTo(0.7);
  });
});
