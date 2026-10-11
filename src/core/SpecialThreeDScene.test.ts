/**
 * Tests for SpecialThreeDScene, ported from Manim CE
 * `manim/scene/three_d_scene.py` (`SpecialThreeDScene`). The scene extends
 * ThreeDScene with CE's higher-resolution sphere, a tick-marked axes config,
 * and a default angled camera position (phi = 70 deg, theta = -110 deg).
 */
import { describe, it, expect } from 'vitest';
import { SpecialThreeDScene } from './SpecialThreeDScene';
import { ThreeDScene } from './ThreeDScene';
import { DEGREES } from '../constants/parity';
import { ThreeDAxes } from '../mobjects/three-d/ThreeDAxes';
import { Sphere } from '../mobjects/three-d/Sphere';

function makeScene(): SpecialThreeDScene {
  return new SpecialThreeDScene(null, { headless: true });
}

describe('SpecialThreeDScene (parity)', () => {
  it('is a ThreeDScene', () => {
    expect(makeScene()).toBeInstanceOf(ThreeDScene);
  });

  it('defaults cutAxesAtRadius to true', () => {
    expect(makeScene().cutAxesAtRadius).toBe(true);
  });

  it('exposes the default sphere config (radius 2, resolution 48)', () => {
    expect(makeScene().getDefaultSphereConfig()).toEqual({ radius: 2, resolution: 48 });
  });

  it('exposes the default axes config with a step-1 range and ticks', () => {
    expect(makeScene().getDefaultAxesConfig()).toEqual({
      xRange: [-6, 6, 1],
      yRange: [-6, 6, 1],
      zRange: [-6, 6, 1],
      showTicks: true,
    });
  });

  it('exposes the default angled camera position (phi 70 deg, theta -110 deg)', () => {
    expect(makeScene().getDefaultCameraPosition()).toEqual({
      phi: 70 * DEGREES,
      theta: -110 * DEGREES,
    });
  });

  it('builds 3D axes from the default config', () => {
    expect(makeScene().getAxes()).toBeInstanceOf(ThreeDAxes);
  });

  it('builds a sphere with the default radius', () => {
    const sphere = makeScene().getSphere();
    expect(sphere).toBeInstanceOf(Sphere);
    expect(sphere.getRadius()).toBe(2);
  });

  it('lets getSphere overrides win over the default config', () => {
    expect(makeScene().getSphere({ radius: 5 }).getRadius()).toBe(5);
  });

  it('honors a custom default angled camera position', () => {
    const scene = new SpecialThreeDScene(null, {
      headless: true,
      defaultAngledCameraPosition: { phi: 1, theta: 2 },
    });
    expect(scene.getDefaultCameraPosition()).toEqual({ phi: 1, theta: 2 });
  });

  it('sets the camera to its default position without throwing', () => {
    const scene = makeScene();
    expect(scene.setCameraToDefaultPosition()).toBe(scene);
  });
});
