/**
 * Tests that all growing animation classes and factory functions
 * are properly exported from the main index.
 */
import { describe, it, expect } from 'vitest';
import {
  Animation,
  GrowArrow,
  growArrow,
  GrowFromEdge,
  growFromEdge,
  GrowFromPoint,
  growFromPoint,
  SpinInFromNothing,
  spinInFromNothing,
} from '../../index';

describe('Growing animation exports from main index', () => {
  it('GrowArrow class is defined', () => {
    expect(GrowArrow).toBeDefined();
  });

  it('growArrow factory function is defined', () => {
    expect(growArrow).toBeDefined();
  });

  it('GrowArrow extends Animation', () => {
    expect(GrowArrow.prototype instanceof Animation).toBe(true);
  });

  it('GrowFromEdge class is defined', () => {
    expect(GrowFromEdge).toBeDefined();
  });

  it('growFromEdge factory function is defined', () => {
    expect(growFromEdge).toBeDefined();
  });

  it('GrowFromEdge extends Animation', () => {
    expect(GrowFromEdge.prototype instanceof Animation).toBe(true);
  });

  it('GrowFromPoint class is defined', () => {
    expect(GrowFromPoint).toBeDefined();
  });

  it('growFromPoint factory function is defined', () => {
    expect(growFromPoint).toBeDefined();
  });

  it('GrowFromPoint extends Animation', () => {
    expect(GrowFromPoint.prototype instanceof Animation).toBe(true);
  });

  it('SpinInFromNothing class is defined', () => {
    expect(SpinInFromNothing).toBeDefined();
  });

  it('spinInFromNothing factory function is defined', () => {
    expect(spinInFromNothing).toBeDefined();
  });

  it('SpinInFromNothing extends Animation', () => {
    expect(SpinInFromNothing.prototype instanceof Animation).toBe(true);
  });
});
