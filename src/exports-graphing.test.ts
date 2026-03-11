import { describe, it, expect } from 'vitest';

describe('Issue #131: Missing graphing exports from main index', () => {
  it('should export VectorField from main index', async () => {
    const mod = await import('./index');
    expect(mod.VectorField).toBeDefined();
  });

  it('should export ArrowVectorField from main index', async () => {
    const mod = await import('./index');
    expect(mod.ArrowVectorField).toBeDefined();
  });

  it('should export StreamLines from main index', async () => {
    const mod = await import('./index');
    expect(mod.StreamLines).toBeDefined();
  });

  it('should export ComplexPlane from main index', async () => {
    const mod = await import('./index');
    expect(mod.ComplexPlane).toBeDefined();
  });

  it('should export PolarPlane from main index', async () => {
    const mod = await import('./index');
    expect(mod.PolarPlane).toBeDefined();
  });

  it('should export UnitInterval from main index', async () => {
    const mod = await import('./index');
    expect(mod.UnitInterval).toBeDefined();
  });

  it('should export BarChart from main index', async () => {
    const mod = await import('./index');
    expect(mod.BarChart).toBeDefined();
  });
});
