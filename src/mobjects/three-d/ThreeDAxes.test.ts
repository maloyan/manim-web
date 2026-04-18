/**
 * Regression tests for ThreeDAxes labels (issue #263).
 *
 * Before the fix, `showLabels: true` was accepted by the options type
 * but ignored, so no label mobjects were ever added.
 */
import { describe, expect, it } from 'vitest';
import { Group } from '../../core/Group';
import { Mobject } from '../../core/Mobject';
import { Text } from '../text/Text';
import { ThreeDAxes } from './ThreeDAxes';

describe('ThreeDAxes showLabels', () => {
  it('does not create labels by default', () => {
    const axes = new ThreeDAxes();
    expect(axes.getXLabel()).toBeNull();
    expect(axes.getYLabel()).toBeNull();
    expect(axes.getZLabel()).toBeNull();
    expect(axes.getAxisLabels().children.length).toBe(0);
  });

  it('creates x/y/z labels when showLabels is true', () => {
    const axes = new ThreeDAxes({ showLabels: true });

    const xLabel = axes.getXLabel();
    const yLabel = axes.getYLabel();
    const zLabel = axes.getZLabel();

    expect(xLabel).not.toBeNull();
    expect(yLabel).not.toBeNull();
    expect(zLabel).not.toBeNull();

    expect(xLabel).toBeInstanceOf(Text);
    expect((xLabel as Text).getText()).toBe('x');
    expect((yLabel as Text).getText()).toBe('y');
    expect((zLabel as Text).getText()).toBe('z');
  });

  it('adds label mobjects as children of the axes group', () => {
    const axes = new ThreeDAxes({ showLabels: true });
    const children = axes.children;
    expect(children).toContain(axes.getXLabel());
    expect(children).toContain(axes.getYLabel());
    expect(children).toContain(axes.getZLabel());
  });

  it('positions labels just past the arrow tip along each axis', () => {
    const axes = new ThreeDAxes({
      xRange: [-5, 5, 1],
      yRange: [-5, 5, 1],
      zRange: [-5, 5, 1],
      showLabels: true,
      labelBuffer: 0.4,
    });

    // Manim→THREE mapping: (mx, my, mz) → (mx, mz, -my)
    // X label at Manim (5.4, 0, 0) → THREE (5.4, 0, 0)
    const xPos = axes.getXLabel()!.position;
    expect(xPos.x).toBeCloseTo(5.4);
    expect(xPos.y).toBeCloseTo(0);
    expect(xPos.z).toBeCloseTo(0);

    // Y label at Manim (0, 5.4, 0) → THREE (0, 0, -5.4)
    const yPos = axes.getYLabel()!.position;
    expect(yPos.x).toBeCloseTo(0);
    expect(yPos.y).toBeCloseTo(0);
    expect(yPos.z).toBeCloseTo(-5.4);

    // Z label at Manim (0, 0, 5.4) → THREE (0, 5.4, 0)
    const zPos = axes.getZLabel()!.position;
    expect(zPos.x).toBeCloseTo(0);
    expect(zPos.y).toBeCloseTo(5.4);
    expect(zPos.z).toBeCloseTo(0);
  });

  it('accepts custom label strings per axis', () => {
    const axes = new ThreeDAxes({
      showLabels: true,
      labels: { x: 'time', y: 'depth', z: 'height' },
    });
    expect((axes.getXLabel() as Text).getText()).toBe('time');
    expect((axes.getYLabel() as Text).getText()).toBe('depth');
    expect((axes.getZLabel() as Text).getText()).toBe('height');
  });

  it('accepts pre-built Mobject labels without wrapping them', () => {
    const custom = new Text({ text: 'foo', fontSize: 12 });
    const axes = new ThreeDAxes({
      showLabels: true,
      labels: { x: custom },
    });
    expect(axes.getXLabel()).toBe(custom);
  });

  it('getAxisLabels returns a Group containing all three labels', () => {
    const axes = new ThreeDAxes({ showLabels: true });
    const group = axes.getAxisLabels();
    expect(group).toBeInstanceOf(Group);
    expect(group.children.length).toBe(3);
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
    expect((copy.getXLabel() as Text).getText()).toBe('time');
    expect((copy.getYLabel() as Text).getText()).toBe('y');
  });
});
