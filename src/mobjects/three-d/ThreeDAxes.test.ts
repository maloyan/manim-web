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

  it('positions labels just past the arrow tip along each axis', () => {
    const axes = new ThreeDAxes({
      xRange: [-5, 5, 1],
      yRange: [-5, 5, 1],
      zRange: [-5, 5, 1],
      showLabels: true,
      labelBuffer: 0.4,
    });

    // Manim→THREE: (mx, my, mz) → (mx, mz, -my)
    // X at Manim (5.4, 0, 0) → THREE (5.4, 0, 0)
    const xPos = axes.getXLabel()!.position;
    expect(xPos.x).toBeCloseTo(5.4);
    expect(xPos.y).toBeCloseTo(0);
    expect(xPos.z).toBeCloseTo(0);

    // Y at Manim (0, 5.4, 0) → THREE (0, 0, -5.4)
    const yPos = axes.getYLabel()!.position;
    expect(yPos.x).toBeCloseTo(0);
    expect(yPos.y).toBeCloseTo(0);
    expect(yPos.z).toBeCloseTo(-5.4);

    // Z at Manim (0, 0, 5.4) → THREE (0, 5.4, 0)
    const zPos = axes.getZLabel()!.position;
    expect(zPos.x).toBeCloseTo(0);
    expect(zPos.y).toBeCloseTo(5.4);
    expect(zPos.z).toBeCloseTo(0);
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
});
