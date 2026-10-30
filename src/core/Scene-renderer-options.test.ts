// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

const setPixelRatio = vi.fn();

// Mock three's WebGLRenderer so Scene can be constructed without real WebGL.
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  const MockWebGLRenderer = vi.fn().mockImplementation(function () {
    return {
      setSize: vi.fn(),
      setPixelRatio,
      setClearColor: vi.fn(),
      domElement: document.createElement('canvas'),
      dispose: vi.fn(),
      render: vi.fn(),
    };
  });
  return { ...actual, WebGLRenderer: MockWebGLRenderer };
});

import { Scene } from './Scene';

describe('Scene renderer quality options', () => {
  beforeEach(() => {
    vi.mocked(THREE.WebGLRenderer).mockClear();
    setPixelRatio.mockClear();
  });

  // MIGRATION: example for the property
  //   ∀ o ⊆ {antialias, powerPreference, preserveDrawingBuffer}: new Scene(el, o) creates its
  //   WebGLRenderer with exactly those values, and with the defaults when omitted.
  it('passes antialias, pixelRatio, powerPreference and preserveDrawingBuffer through', () => {
    new Scene(document.createElement('div'), {
      width: 100,
      height: 100,
      antialias: false,
      pixelRatio: 1,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
    expect(THREE.WebGLRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        antialias: false,
        powerPreference: 'low-power',
        preserveDrawingBuffer: false,
      }),
    );
    expect(setPixelRatio).toHaveBeenCalledWith(1);
  });

  it('keeps the previous defaults when the options are omitted', () => {
    new Scene(document.createElement('div'), { width: 100, height: 100 });
    expect(THREE.WebGLRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      }),
    );
  });
});
