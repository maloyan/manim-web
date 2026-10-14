import { describe, it, expect } from 'vitest';
import { ComplexBlob } from './ComplexBlob';
import { VGroup } from '../../core/VGroup';
import { Text } from '../text/Text';
import { RoundedRectangle } from '../geometry/PolygonExtensions';
import { Ellipse } from '../geometry/Ellipse';
import { hexToRgb } from '../../utils/color';

function luminance(color: string): number {
  const [r, g, b] = hexToRgb(color);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

describe('ComplexBlob', () => {
  it('is a VGroup so animations apply directly', () => {
    expect(new ComplexBlob({ label: 'I' })).toBeInstanceOf(VGroup);
  });

  it('builds the requested number of gradient layers', () => {
    const blob = new ComplexBlob({ label: 'I', layers: 6 });
    expect(blob.getLayers()).toHaveLength(6);
  });

  it('uses rounded rectangles by default and ellipses on request', () => {
    expect(new ComplexBlob({ label: 'I' }).getLayers()[0]).toBeInstanceOf(RoundedRectangle);
    const e = new ComplexBlob({ label: 'Q', shape: 'ellipse' });
    expect(e.getLayers()[0]).toBeInstanceOf(Ellipse);
  });

  it('shrinks the layers and lightens them toward the center', () => {
    const blob = new ComplexBlob({ label: 'I', color: '#3366cc', layers: 5 });
    const layers = blob.getLayers();
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i].getWidth()).toBeLessThan(layers[i - 1].getWidth());
      expect(luminance(layers[i].fillColor as string)).toBeGreaterThan(
        luminance(layers[i - 1].fillColor as string),
      );
    }
  });

  it('keeps the outer layer at the requested size', () => {
    const blob = new ComplexBlob({ label: 'I', width: 2, height: 1.2 });
    expect(blob.getBodyWidth()).toBe(2);
    expect(blob.getBodyHeight()).toBe(1.2);
  });

  it('adds a glow ring behind the body when glow is on', () => {
    const on = new ComplexBlob({ label: 'I', glow: true });
    const off = new ComplexBlob({ label: 'I', glow: false });
    expect(on.glow).not.toBeNull();
    expect(on.glow!.children.length).toBeGreaterThan(0);
    expect(on.glow!.getWidth()).toBeGreaterThan(on.getBodyWidth());
    expect(off.glow).toBeNull();
  });

  it('carries a text label with the given string', () => {
    const blob = new ComplexBlob({ label: 'Complex III' });
    expect(blob.labelText).toBeInstanceOf(Text);
    expect(blob.labelText.getText()).toBe('Complex III');
  });

  it('places the label at the body center by default', () => {
    const blob = new ComplexBlob({ label: 'I', center: [2, 1, 0] });
    const c = blob.labelText.getCenter();
    expect(c[0]).toBeCloseTo(2, 1);
    expect(c[1]).toBeCloseTo(1, 1);
  });

  it('places the label below the body on request', () => {
    const blob = new ComplexBlob({ label: 'I', labelPosition: 'below', height: 1 });
    expect(blob.labelText.getCenter()[1]).toBeLessThan(-0.5);
  });

  it('moves with the center option', () => {
    const blob = new ComplexBlob({ label: 'I', center: [3, -2, 0] });
    const c = blob.getBodyCenter();
    expect(c[0]).toBeCloseTo(3);
    expect(c[1]).toBeCloseTo(-2);
  });

  it('rejects a non-positive size', () => {
    expect(() => new ComplexBlob({ label: 'I', width: 0 })).toThrow();
    expect(() => new ComplexBlob({ label: 'I', layers: 0 })).toThrow();
  });
});
