// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Text } from './Text';

/**
 * Regression for issue #607: a Text whose string grows (e.g. a click counter
 * going "Clicks: 9" -> "Clicks: 10") froze on screen at the shorter value.
 *
 * Root cause: `setText` resizes the backing canvas, but three.js keeps the GPU
 * texture at its first allocated size and re-uploads a resized CanvasTexture
 * with `texSubImage2D`, so the longer text is clipped to the old size. The fix
 * recreates the CanvasTexture when the backing canvas changes size, which forces
 * a fresh allocation. When the size is unchanged, the same texture is kept.
 *
 * These assertions capture that contract at the logic level: the texture the
 * renderer uses is a NEW instance (old one disposed, material re-pointed) after
 * a size change, and the SAME instance when the size does not change.
 */

/** Mock context whose measureText width is proportional to text length. */
function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textBaseline: 'top',
    textAlign: 'center',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((t: string) => ({ width: t.length * 10 })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D;
}

interface TextTextureInternal {
  _canvas: HTMLCanvasElement | null;
  _texture: THREE.Texture | null;
  _mesh: THREE.Mesh | null;
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((id: string) =>
    id === '2d' ? createMockCtx() : null,
  );
});

describe('Text setText texture reallocation (issue #607)', () => {
  it('recreates the texture when a longer string widens the canvas', () => {
    const t = new Text({ text: 'Clicks: 9', fontSize: 22 });
    t.getThreeObject();
    const internal = t as unknown as TextTextureInternal;

    const tex0 = internal._texture!;
    const widthBefore = internal._canvas!.width;
    const disposeSpy = vi.spyOn(tex0, 'dispose');

    t.setText('Clicks: 100000');

    // Canvas actually grew for the longer string.
    expect(internal._canvas!.width).toBeGreaterThan(widthBefore);
    // The texture the renderer uses is a fresh instance at the new size.
    expect(internal._texture).not.toBe(tex0);
    expect(disposeSpy).toHaveBeenCalled();
    // The mesh material points at the new texture.
    const material = internal._mesh!.material as THREE.MeshBasicMaterial;
    expect(material.map).toBe(internal._texture);
  });

  it('recreates the texture when a shorter string narrows the canvas', () => {
    const t = new Text({ text: 'Clicks: 100000', fontSize: 22 });
    t.getThreeObject();
    const internal = t as unknown as TextTextureInternal;

    const tex0 = internal._texture!;
    const widthBefore = internal._canvas!.width;

    t.setText('Clicks: 1');

    expect(internal._canvas!.width).toBeLessThan(widthBefore);
    expect(internal._texture).not.toBe(tex0);
    const material = internal._mesh!.material as THREE.MeshBasicMaterial;
    expect(material.map).toBe(internal._texture);
  });

  it('keeps the same texture when the canvas size does not change', () => {
    const t = new Text({ text: 'AAAA', fontSize: 22 });
    t.getThreeObject();
    const internal = t as unknown as TextTextureInternal;

    const tex0 = internal._texture!;
    const widthBefore = internal._canvas!.width;

    // Same length -> same mock width -> no canvas resize.
    t.setText('BBBB');

    expect(internal._canvas!.width).toBe(widthBefore);
    expect(internal._texture).toBe(tex0);
  });

  it('setFontSize that changes the canvas size also recreates the texture', () => {
    const t = new Text({ text: 'Scale', fontSize: 22 });
    t.getThreeObject();
    const internal = t as unknown as TextTextureInternal;

    const tex0 = internal._texture!;
    t.setFontSize(96);

    expect(internal._texture).not.toBe(tex0);
    const material = internal._mesh!.material as THREE.MeshBasicMaterial;
    expect(material.map).toBe(internal._texture);
  });

  it('does not reallocate before the Three.js object (and texture) exists', () => {
    const t = new Text({ text: 'No mesh yet', fontSize: 22 });
    const internal = t as unknown as TextTextureInternal;
    expect(internal._texture).toBeNull();
    // setText before getThreeObject must not throw and must not create a texture.
    expect(() => t.setText('Still no mesh, but longer')).not.toThrow();
    expect(internal._texture).toBeNull();
  });
});
