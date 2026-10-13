/**
 * Tests for BindingPocket, a sphere marking a binding site.
 */
import { describe, it, expect } from 'vitest';
import { BindingPocket } from './BindingPocket';
import { Sphere } from '../three-d/Sphere';

describe('BindingPocket', () => {
  it('exposes the center and radius', () => {
    const pocket = new BindingPocket({ center: [2, 0, 1], radius: 4 });
    expect(pocket.getCenter()).toEqual([2, 0, 1]);
    expect(pocket.getRadius()).toBe(4);
  });

  it('defaults to a translucent-surface sphere of radius 3', () => {
    const pocket = new BindingPocket({ center: [0, 0, 0] });
    expect(pocket.getRadius()).toBe(3);
    expect(pocket.getStyle()).toBe('translucent-surface');
    expect(pocket.sphere).toBeInstanceOf(Sphere);
    expect(pocket.sphere.isWireframe()).toBe(false);
  });

  it('wireframe-sphere produces a wireframe sphere', () => {
    const pocket = new BindingPocket({ center: [0, 0, 0], style: 'wireframe-sphere' });
    expect(pocket.sphere.isWireframe()).toBe(true);
  });

  it('applies the opacity to the sphere', () => {
    const pocket = new BindingPocket({ center: [0, 0, 0], opacity: 0.4 });
    expect(pocket.sphere.fillOpacity).toBeCloseTo(0.4, 6);
  });

  it('copy preserves center, radius and style', () => {
    const pocket = new BindingPocket({ center: [1, 2, 3], radius: 5, style: 'wireframe-sphere' });
    const clone = pocket.copy();
    expect(clone).toBeInstanceOf(BindingPocket);
    expect(clone.getCenter()).toEqual([1, 2, 3]);
    expect(clone.getRadius()).toBe(5);
    expect(clone.getStyle()).toBe('wireframe-sphere');
  });
});
