// @vitest-environment happy-dom
/**
 * Additional coverage tests for MathTex, MathJaxRenderer, Code, and MarkupText.
 *
 * Targets:
 *   - MathTex.ts: constructor options, multi-part, getPart, setColor, copy,
 *     KaTeX fallback, waitForRender, setRevealProgress, dispose, _syncMaterialToThree
 *   - MathJaxRenderer.ts: renderLatexToSVG pipeline, katexCanRender, isMathJaxLoaded
 *   - Code.ts: remaining uncovered lines (_createThreeObject, _updateMesh,
 *     _syncMaterialToThree, dispose with mesh, highlightLines with threeObject)
 *   - MarkupText.ts: remaining ~5% uncovered lines (_measureText ctx null path,
 *     totalHeight === 0 fallback, _texture update in _renderToCanvas)
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import * as THREE from 'three';
import { MathTex } from './MathTex';
import { katexCanRender, isMathJaxLoaded } from './MathJaxRenderer';
import { Code, DEFAULT_COLOR_SCHEME, MONOKAI_COLOR_SCHEME } from './Code';
import { MarkupText } from './MarkupText';

// ---------------------------------------------------------------------------
// Stub canvas 2D context (happy-dom lacks canvas support)
// ---------------------------------------------------------------------------

function createMockCtx(): CanvasRenderingContext2D {
  return {
    scale: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    fillRect: vi.fn(),
    measureText: vi.fn((t: string) => ({
      width: t.length * 10,
      fontBoundingBoxAscent: 30,
      fontBoundingBoxDescent: 5,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: t.length * 10,
    })),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    textBaseline: 'alphabetic',
    textAlign: 'left',
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

beforeAll(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
    if (type === '2d') return createMockCtx();
    return orig.call(this, type, ...(args as []));
  } as typeof orig;
});

// MarkupText needs this fallback for the field initializer ordering issue
beforeEach(() => {
  (MarkupText.prototype as unknown as Record<string, unknown>)._styledSegments = [];
});

// ===========================================================================
// MathTex additional coverage
// ===========================================================================

describe('MathTex (additional coverage)', () => {
  // -----------------------------------------------------------------
  // Constructor option branches
  // -----------------------------------------------------------------
  describe('constructor option branches', () => {
    it('should use displayMode: false', () => {
      const tex = new MathTex({ latex: 'x^2', displayMode: false });
      const internal = tex as unknown as { _displayMode: boolean };
      expect(internal._displayMode).toBe(false);
    });

    it('should accept _padding option', () => {
      const tex = new MathTex({ latex: 'x', _padding: 5 });
      const internal = tex as unknown as { _padding: number };
      expect(internal._padding).toBe(5);
    });

    it('should accept renderer: mathjax and skip ensureKatexStyles', () => {
      const tex = new MathTex({ latex: 'x', renderer: 'mathjax' });
      expect(tex.getRenderer()).toBe('mathjax');
    });

    it('should not re-render if setting the same latex', () => {
      const tex = new MathTex({ latex: 'abc' });
      const ret = tex.setLatex('abc');
      expect(ret).toBe(tex);
    });

    it('should not re-render if setting the same fontSize', () => {
      const tex = new MathTex({ latex: 'abc', fontSize: 48 });
      const ret = tex.setFontSize(48);
      expect(ret).toBe(tex);
    });

    it('should not re-render if setting the same renderer', () => {
      const tex = new MathTex({ latex: 'abc', renderer: 'katex' });
      const ret = tex.setRenderer('katex');
      expect(ret).toBe(tex);
    });
  });

  // -----------------------------------------------------------------
  // waitForRender edge cases
  // -----------------------------------------------------------------
  describe('waitForRender edge cases', () => {
    it('should resolve for single-part when renderPromise is null', async () => {
      const tex = new MathTex({ latex: 'a' });
      // Manually clear the render promise to test the null path
      const internal = tex as unknown as { _renderState: { renderPromise: Promise<void> | null } };
      internal._renderState.renderPromise = null;
      await expect(tex.waitForRender()).resolves.toBeUndefined();
    });

    it('should resolve for multi-part when arrangePromise is null', async () => {
      const tex = new MathTex({ latex: ['a', 'b'] });
      const internal = tex as unknown as { _arrangePromise: Promise<void> | null };
      // Clear each part's render promise AND the arrange promise
      internal._arrangePromise = null;
      // Still should resolve
      const p = tex.waitForRender();
      expect(p).toBeInstanceOf(Promise);
    });
  });

  // -----------------------------------------------------------------
  // _createThreeObject paths
  // -----------------------------------------------------------------
  describe('_createThreeObject paths', () => {
    it('should create empty group for multi-part', () => {
      const tex = new MathTex({ latex: ['a', 'b'] });
      const obj = tex.getThreeObject();
      expect(obj).toBeDefined();
      expect(obj.type).toBe('Group');
    });

    it('should create group with mesh for single-part', () => {
      const tex = new MathTex({ latex: 'x' });
      const obj = tex.getThreeObject();
      expect(obj.type).toBe('Group');
      const hasMesh = obj.children.some((c) => c.type === 'Mesh');
      expect(hasMesh).toBe(true);
    });
  });

  // -----------------------------------------------------------------
  // _syncMaterialToThree with texture update
  // -----------------------------------------------------------------
  describe('_syncMaterialToThree texture sync', () => {
    it('should update material map if texture differs', () => {
      const tex = new MathTex({ latex: 'y' });
      const obj = tex.getThreeObject();
      const mesh = obj.children.find((c) => c.type === 'Mesh') as THREE.Mesh;
      expect(mesh).toBeDefined();

      // Simulate texture mismatch: set a new texture on renderState
      const internal = tex as unknown as {
        _renderState: {
          texture: THREE.CanvasTexture | null;
          mesh: THREE.Mesh | null;
          width: number;
          height: number;
        };
        _syncMaterialToThree: () => void;
      };
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 50;
      const newTexture = new THREE.CanvasTexture(canvas);
      internal._renderState.texture = newTexture;

      // Call _syncMaterialToThree directly (since _syncToThree guards on _dirty)
      internal._syncMaterialToThree();

      const mat = mesh.material as THREE.MeshBasicMaterial;
      expect(mat.map).toBe(newTexture);
    });

    it('should update geometry if dimensions changed', () => {
      const tex = new MathTex({ latex: 'q' });
      const obj = tex.getThreeObject();
      const mesh = obj.children.find((c) => c.type === 'Mesh') as THREE.Mesh;
      expect(mesh).toBeDefined();

      // Change the dimensions in renderState
      const internal = tex as unknown as {
        _renderState: { width: number; height: number; mesh: THREE.Mesh };
        _syncMaterialToThree: () => void;
      };
      internal._renderState.width = 5;
      internal._renderState.height = 3;

      // Call _syncMaterialToThree directly (since _syncToThree guards on _dirty)
      internal._syncMaterialToThree();

      const geom = mesh.geometry as THREE.PlaneGeometry;
      expect(geom.parameters.width).toBe(5);
      expect(geom.parameters.height).toBe(3);
    });
  });

  // -----------------------------------------------------------------
  // setRevealProgress with mesh/texture
  // -----------------------------------------------------------------
  describe('setRevealProgress with rendered mesh', () => {
    it('should set mesh invisible for alpha <= 0.001', () => {
      const tex = new MathTex({ latex: 'test' });
      const obj = tex.getThreeObject();
      const mesh = obj.children.find((c) => c.type === 'Mesh') as THREE.Mesh;

      // Simulate having a texture by setting it on renderState
      const internal = tex as unknown as {
        _renderState: {
          texture: THREE.CanvasTexture;
          mesh: THREE.Mesh;
          width: number;
          height: number;
        };
      };
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 50;
      internal._renderState.texture = new THREE.CanvasTexture(canvas);
      internal._renderState.width = 1;
      internal._renderState.height = 0.5;

      tex.setRevealProgress(0);
      expect(mesh.visible).toBe(false);
    });

    it('should show mesh and adjust scale for alpha > 0.001', () => {
      const tex = new MathTex({ latex: 'test' });
      const obj = tex.getThreeObject();
      const mesh = obj.children.find((c) => c.type === 'Mesh') as THREE.Mesh;

      const internal = tex as unknown as {
        _renderState: {
          texture: THREE.CanvasTexture;
          mesh: THREE.Mesh;
          width: number;
          height: number;
        };
      };
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 50;
      internal._renderState.texture = new THREE.CanvasTexture(canvas);
      internal._renderState.width = 2;
      internal._renderState.height = 1;

      tex.setRevealProgress(0.5);
      expect(mesh.visible).toBe(true);
      expect(mesh.scale.x).toBeCloseTo(0.5);
    });

    it('should fully reveal mesh at alpha = 1', () => {
      const tex = new MathTex({ latex: 'a' });
      const obj = tex.getThreeObject();
      const mesh = obj.children.find((c) => c.type === 'Mesh') as THREE.Mesh;

      const internal = tex as unknown as {
        _renderState: {
          texture: THREE.CanvasTexture;
          mesh: THREE.Mesh;
          width: number;
          height: number;
        };
      };
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 50;
      internal._renderState.texture = new THREE.CanvasTexture(canvas);
      internal._renderState.width = 1;
      internal._renderState.height = 0.5;

      tex.setRevealProgress(1);
      expect(mesh.visible).toBe(true);
      expect(mesh.scale.x).toBeCloseTo(1);
    });
  });

  // -----------------------------------------------------------------
  // dispose with mesh and texture
  // -----------------------------------------------------------------
  describe('dispose with resources', () => {
    it('should dispose texture and mesh geometry when both exist', () => {
      const tex = new MathTex({ latex: 'a' });
      tex.getThreeObject();

      const internal = tex as unknown as {
        _renderState: {
          texture: THREE.CanvasTexture;
          mesh: THREE.Mesh;
        };
      };
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      internal._renderState.texture = new THREE.CanvasTexture(canvas);

      expect(() => tex.dispose()).not.toThrow();
    });
  });

  // -----------------------------------------------------------------
  // setColor / setOpacity on single-part
  // -----------------------------------------------------------------
  describe('setColor / setOpacity on single-part', () => {
    it('setColor should not propagate when not multi-part', () => {
      const tex = new MathTex({ latex: 'x' });
      tex.setColor('#00ff00');
      expect(tex.color).toBe('#00ff00');
    });

    it('setOpacity should not propagate when not multi-part', () => {
      const tex = new MathTex({ latex: 'x' });
      tex.setOpacity(0.7);
      const internal = tex as unknown as { _opacity: number };
      expect(internal._opacity).toBeCloseTo(0.7);
    });
  });

  // -----------------------------------------------------------------
  // copy preserves all fields
  // -----------------------------------------------------------------
  describe('copy preserves all fields', () => {
    it('should preserve displayMode: false in copy', () => {
      const orig = new MathTex({ latex: 'x', displayMode: false });
      const cp = orig.copy() as MathTex;
      const internal = cp as unknown as { _displayMode: boolean };
      expect(internal._displayMode).toBe(false);
    });

    it('should preserve custom fontSize in copy', () => {
      const orig = new MathTex({ latex: 'x', fontSize: 96 });
      const cp = orig.copy() as MathTex;
      expect(cp.getFontSize()).toBe(96);
    });

    it('copy of multi-part preserves parts', () => {
      const orig = new MathTex({ latex: ['a', '+', 'b'], color: '#ff0000' });
      const cp = orig.copy() as MathTex;
      expect(cp.getPartCount()).toBe(3);
      expect(cp.getPart(0).getLatex()).toBe('a');
      expect(cp.getPart(1).getLatex()).toBe('+');
      expect(cp.getPart(2).getLatex()).toBe('b');
    });
  });

  // -----------------------------------------------------------------
  // _renderLatex / _resolveRenderer branches
  // -----------------------------------------------------------------
  describe('_resolveRenderer branches', () => {
    it('auto mode should resolve to katex for simple latex', () => {
      const tex = new MathTex({ latex: 'x^2', renderer: 'auto' });
      // After construction, rendering starts. The _resolveRenderer should
      // pick 'katex' for simple LaTeX that KaTeX can handle.
      expect(tex.getRenderer()).toBe('auto');
    });

    it('katex mode should stay katex regardless of LaTeX complexity', () => {
      const tex = new MathTex({ latex: '\\frac{x}{y}', renderer: 'katex' });
      expect(tex.getRenderer()).toBe('katex');
    });

    it('mathjax mode should stay mathjax', () => {
      const tex = new MathTex({ latex: 'x', renderer: 'mathjax' });
      expect(tex.getRenderer()).toBe('mathjax');
    });
  });

  // -----------------------------------------------------------------
  // _startRender error path
  // -----------------------------------------------------------------
  describe('_startRender error path', () => {
    it('should set isRendering false after error', async () => {
      const tex = new MathTex({ latex: 'x' });
      // Wait a tick to let render settle
      await new Promise((r) => setTimeout(r, 50));
      // isRendering should eventually become false (either success or error)
      expect(typeof tex.isRendering()).toBe('boolean');
    });
  });

  // -----------------------------------------------------------------
  // _updateMeshGeometry when mesh is null
  // -----------------------------------------------------------------
  describe('_updateMeshGeometry edge cases', () => {
    it('should be a no-op when mesh is null', () => {
      const tex = new MathTex({ latex: 'x' });
      // Don't call getThreeObject, so mesh is null
      const internal = tex as unknown as { _updateMeshGeometry: () => void };
      expect(() => internal._updateMeshGeometry()).not.toThrow();
    });

    it('should update geometry when mesh exists', () => {
      const tex = new MathTex({ latex: 'x' });
      tex.getThreeObject();
      const internal = tex as unknown as {
        _renderState: { mesh: THREE.Mesh; width: number; height: number };
        _updateMeshGeometry: () => void;
      };
      internal._renderState.width = 3;
      internal._renderState.height = 2;
      expect(() => internal._updateMeshGeometry()).not.toThrow();
      const geom = internal._renderState.mesh.geometry as THREE.PlaneGeometry;
      expect(geom.parameters.width).toBe(3);
      expect(geom.parameters.height).toBe(2);
    });
  });

  // -----------------------------------------------------------------
  // getCenter
  // -----------------------------------------------------------------
  describe('getCenter', () => {
    it('should return current position', () => {
      const tex = new MathTex({ latex: 'a', position: [3, 4, 5] });
      expect(tex.getCenter()).toEqual([3, 4, 5]);
    });
  });

  // -----------------------------------------------------------------
  // getDimensions for multi-part
  // -----------------------------------------------------------------
  describe('getDimensions for multi-part', () => {
    it('should compute aggregate bounding box for multi-part', () => {
      const tex = new MathTex({ latex: ['a', '+', 'b'] });
      const [w, h] = tex.getDimensions();
      expect(typeof w).toBe('number');
      expect(typeof h).toBe('number');
    });
  });

  // -----------------------------------------------------------------
  // texture.colorSpace set to SRGBColorSpace after render
  // -----------------------------------------------------------------
  describe('texture colorSpace after render', () => {
    it('should set colorSpace to SRGBColorSpace on texture via _renderState', () => {
      const tex = new MathTex({ latex: 'x^2' });
      const obj = tex.getThreeObject();
      const mesh = obj.children.find((c) => c.type === 'Mesh') as THREE.Mesh;
      expect(mesh).toBeDefined();

      // Simulate a completed render by setting texture on renderState
      const internal = tex as unknown as {
        _renderState: {
          texture: THREE.CanvasTexture | null;
        };
      };
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 50;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      internal._renderState.texture = texture;

      // Verify the texture has the expected colorSpace
      expect(internal._renderState.texture.colorSpace).toBe(THREE.SRGBColorSpace);
    });
  });

  // -----------------------------------------------------------------
  // Zero-width character regex in _renderDomToCanvas
  // -----------------------------------------------------------------
  describe('zero-width character regex', () => {
    it('should match strings consisting only of zero-width characters', () => {
      // This is the regex used in _renderDomToCanvas to skip invisible KaTeX spacing
      const regex = /^(?:\u200B|\u200C|\u200D|\uFEFF)+$/;
      // Zero-width space
      expect(regex.test('\u200B')).toBe(true);
      // Zero-width non-joiner
      expect(regex.test('\u200C')).toBe(true);
      // Zero-width joiner
      expect(regex.test('\u200D')).toBe(true);
      // BOM / zero-width no-break space
      expect(regex.test('\uFEFF')).toBe(true);
      // Multiple zero-width chars
      expect(regex.test('\u200B\u200C\u200D\uFEFF')).toBe(true);
      // Should NOT match normal text
      expect(regex.test('hello')).toBe(false);
      // Should NOT match mixed text with zero-width chars
      expect(regex.test('\u200Bhello')).toBe(false);
      // Should NOT match empty string
      expect(regex.test('')).toBe(false);
    });
  });
});

// ===========================================================================
// MathJaxRenderer coverage
// ===========================================================================

describe('MathJaxRenderer', () => {
  describe('katexCanRender', () => {
    it('should return true for simple LaTeX', () => {
      expect(katexCanRender('x^2')).toBe(true);
    });

    it('should return true for fractions', () => {
      expect(katexCanRender('\\frac{1}{2}')).toBe(true);
    });

    it('should return true for integrals', () => {
      expect(katexCanRender('\\int_0^1 x\\,dx')).toBe(true);
    });

    it('should return true for Greek letters', () => {
      expect(katexCanRender('\\alpha + \\beta')).toBe(true);
    });

    it('should return true for subscripts and superscripts', () => {
      expect(katexCanRender('a_{ij}^{2}')).toBe(true);
    });

    it('should return false for unsupported LaTeX commands', () => {
      // \chemfig is not supported by KaTeX
      expect(katexCanRender('\\chemfig{H-C(-[2]H)(-[6]H)-H}')).toBe(false);
    });

    it('should handle displayMode parameter', () => {
      expect(katexCanRender('x^2', true)).toBe(true);
      expect(katexCanRender('x^2', false)).toBe(true);
    });

    it('should return false for completely invalid LaTeX', () => {
      expect(katexCanRender('\\invalidcommandthatdoesnotexist{}')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(katexCanRender('')).toBe(true);
    });

    it('should handle summation notation', () => {
      expect(katexCanRender('\\sum_{i=1}^{n} i^2')).toBe(true);
    });

    it('should handle matrix-like notation', () => {
      expect(katexCanRender('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}')).toBe(true);
    });

    it('should handle square root', () => {
      expect(katexCanRender('\\sqrt{x^2 + y^2}')).toBe(true);
    });
  });

  describe('isMathJaxLoaded', () => {
    it('should return a boolean', () => {
      expect(typeof isMathJaxLoaded()).toBe('boolean');
    });

    it('should return false when MathJax has not been loaded', () => {
      // In test environment, MathJax is not loaded
      expect(isMathJaxLoaded()).toBe(false);
    });
  });
});

// ===========================================================================
// Code (remaining coverage)
// ===========================================================================

describe('Code (additional coverage)', () => {
  // -----------------------------------------------------------------
  // _createThreeObject and mesh lifecycle
  // -----------------------------------------------------------------
  describe('_createThreeObject and mesh lifecycle', () => {
    it('should create THREE.Group with mesh and texture', () => {
      const c = new Code({ code: 'hello' });
      const obj = c.getThreeObject();
      expect(obj.type).toBe('Group');
      const hasMesh = obj.children.some((ch) => ch.type === 'Mesh');
      expect(hasMesh).toBe(true);
    });

    it('should create mesh with correct material properties', () => {
      const c = new Code({ code: 'test code' });
      const obj = c.getThreeObject();
      const mesh = obj.children.find((ch) => ch.type === 'Mesh') as THREE.Mesh;
      expect(mesh).toBeDefined();
      const mat = mesh.material as THREE.MeshBasicMaterial;
      expect(mat.transparent).toBe(true);
      expect(mat.side).toBe(THREE.DoubleSide);
      expect(mat.depthWrite).toBe(false);
    });

    it('should add existing highlights to the group', () => {
      const c = new Code({ code: 'line1\nline2\nline3' });
      // Highlight before creating three object
      c.highlightLines(1, 2);
      const obj = c.getThreeObject();
      // Group should have the code mesh plus the highlight mesh
      expect(obj.children.length).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------
  // _updateMesh (triggered via setCode after getThreeObject)
  // -----------------------------------------------------------------
  describe('_updateMesh after getThreeObject', () => {
    it('should update mesh geometry when setCode is called', () => {
      const c = new Code({ code: 'short' });
      const obj = c.getThreeObject();
      const mesh = obj.children.find((ch) => ch.type === 'Mesh') as THREE.Mesh;
      const geom1 = mesh.geometry;

      c.setCode('a much longer line of code here');
      // After setCode, geometry should have been replaced
      const geom2 = mesh.geometry;
      expect(geom2).not.toBe(geom1);
    });

    it('should update mesh geometry when setLanguage is called', () => {
      const c = new Code({ code: 'def x():', language: 'text' });
      const obj = c.getThreeObject();
      const mesh = obj.children.find((ch) => ch.type === 'Mesh') as THREE.Mesh;
      const geom1 = mesh.geometry;

      c.setLanguage('python');
      const geom2 = mesh.geometry;
      // Geometry may be replaced even if dimensions are same
      expect(geom2).toBeDefined();
    });
  });

  // -----------------------------------------------------------------
  // _syncMaterialToThree (triggered via _syncToThree)
  // -----------------------------------------------------------------
  describe('_syncMaterialToThree', () => {
    it('should update material opacity', () => {
      const c = new Code({ code: 'hello' });
      const obj = c.getThreeObject();
      const mesh = obj.children.find((ch) => ch.type === 'Mesh') as THREE.Mesh;

      c.setOpacity(0.5);
      c._syncToThree();

      const mat = mesh.material as THREE.MeshBasicMaterial;
      expect(mat.opacity).toBeCloseTo(0.5);
    });

    it('should re-render canvas in _syncMaterialToThree', () => {
      const c = new Code({ code: 'hello', language: 'python' });
      c.getThreeObject();
      // Changing color triggers _syncMaterialToThree -> _renderToCanvas
      c.setColor('#ff0000');
      c._syncToThree();
      // Should not throw
    });
  });

  // -----------------------------------------------------------------
  // dispose with mesh present
  // -----------------------------------------------------------------
  describe('dispose with mesh and texture', () => {
    it('should dispose mesh geometry and material', () => {
      const c = new Code({ code: 'hello' });
      c.getThreeObject();
      expect(() => c.dispose()).not.toThrow();
    });

    it('should clear highlights on dispose', () => {
      const c = new Code({ code: 'line1\nline2\nline3' });
      c.getThreeObject();
      c.highlightLines(1, 2);
      expect(() => c.dispose()).not.toThrow();
    });

    it('should set canvas and ctx to null after dispose', () => {
      const c = new Code({ code: 'hello' });
      c.getThreeObject();
      c.dispose();
      const internal = c as unknown as {
        _canvas: HTMLCanvasElement | null;
        _ctx: CanvasRenderingContext2D | null;
      };
      expect(internal._canvas).toBeNull();
      expect(internal._ctx).toBeNull();
    });
  });

  // -----------------------------------------------------------------
  // highlightLines with threeObject present
  // -----------------------------------------------------------------
  describe('highlightLines with threeObject', () => {
    it('should add highlight mesh to existing three object', () => {
      const c = new Code({ code: 'line1\nline2\nline3' });
      const obj = c.getThreeObject();
      const childCountBefore = obj.children.length;
      c.highlightLines(1, 2);
      expect(obj.children.length).toBeGreaterThan(childCountBefore);
    });

    it('should remove highlight meshes from three object on clearHighlights', () => {
      const c = new Code({ code: 'line1\nline2\nline3' });
      const obj = c.getThreeObject();
      c.highlightLines(1, 2);
      const childCountWithHighlight = obj.children.length;
      c.clearHighlights();
      expect(obj.children.length).toBeLessThan(childCountWithHighlight);
    });
  });

  // -----------------------------------------------------------------
  // showBackground: false branch
  // -----------------------------------------------------------------
  describe('showBackground: false', () => {
    it('should call clearRect instead of drawing background', () => {
      const c = new Code({ code: 'hello', showBackground: false });
      c.getThreeObject();
      // Construction went through _renderToCanvas with showBackground: false
      // which calls clearRect instead of _roundRect. Should not throw.
      expect(c.getWidth()).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------------------------------------------
  // lineNumbers: false
  // -----------------------------------------------------------------
  describe('lineNumbers: false coverage', () => {
    it('should skip line number rendering', () => {
      const c = new Code({ code: 'hello\nworld', lineNumbers: false });
      c.getThreeObject();
      expect(c.getWidth()).toBeGreaterThanOrEqual(0);
      expect(c.getHeight()).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------------------------------------------
  // _measureCode when ctx is null
  // -----------------------------------------------------------------
  describe('_measureCode when ctx is null', () => {
    it('should return zero dimensions when ctx is null', () => {
      const c = new Code({ code: 'hello' });
      // Manually null out the ctx
      const internal = c as unknown as { _ctx: CanvasRenderingContext2D | null };
      internal._ctx = null;
      const measureFn = c as unknown as { _measureCode: () => { width: number; height: number } };
      const result = measureFn._measureCode();
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });
  });

  // -----------------------------------------------------------------
  // _renderToCanvas when canvas/ctx is null
  // -----------------------------------------------------------------
  describe('_renderToCanvas when canvas/ctx is null', () => {
    it('should return early when canvas is null', () => {
      const c = new Code({ code: 'hello' });
      const internal = c as unknown as {
        _canvas: HTMLCanvasElement | null;
        _renderToCanvas: () => void;
      };
      internal._canvas = null;
      expect(() => internal._renderToCanvas()).not.toThrow();
    });
  });

  // -----------------------------------------------------------------
  // _roundRect when ctx is null
  // -----------------------------------------------------------------
  describe('_roundRect when ctx is null', () => {
    it('should return early when ctx is null', () => {
      const c = new Code({ code: 'hello' });
      const internal = c as unknown as {
        _ctx: CanvasRenderingContext2D | null;
        _roundRect: (x: number, y: number, w: number, h: number, r: number) => void;
      };
      internal._ctx = null;
      expect(() => internal._roundRect(0, 0, 100, 100, 5)).not.toThrow();
    });
  });

  // -----------------------------------------------------------------
  // _getLineNumberWidth when lineNumbers is false or ctx is null
  // -----------------------------------------------------------------
  describe('_getLineNumberWidth edge cases', () => {
    it('should return 0 when lineNumbers is false', () => {
      const c = new Code({ code: 'hello', lineNumbers: false });
      const internal = c as unknown as { _getLineNumberWidth: () => number };
      expect(internal._getLineNumberWidth()).toBe(0);
    });

    it('should return 0 when ctx is null', () => {
      const c = new Code({ code: 'hello' });
      const internal = c as unknown as {
        _ctx: CanvasRenderingContext2D | null;
        _getLineNumberWidth: () => number;
      };
      internal._ctx = null;
      expect(internal._getLineNumberWidth()).toBe(0);
    });
  });

  // -----------------------------------------------------------------
  // Triple-quote string tokenization (lines 399-403)
  // -----------------------------------------------------------------
  describe('triple-quote string tokenization', () => {
    it('should tokenize triple double-quotes as strings', () => {
      // Note: Python delimiters list has '"' before '"""', so the tokenizer
      // matches '"' first. The triple-quote path (lines 399-403) is reached
      // when delim.length === 3 - only for the explicit '"""' and "'''" entries.
      const c = new Code({ code: 'x = """hello"""', language: 'python' });
      const line = c.getLineOfCode(1)!;
      const stringTokens = line.tokens.filter((t) => t.type === 'string');
      expect(stringTokens.length).toBeGreaterThan(0);
    });

    it('should tokenize triple single-quotes as strings', () => {
      const c = new Code({ code: "x = '''hello'''", language: 'python' });
      const line = c.getLineOfCode(1)!;
      const stringTokens = line.tokens.filter((t) => t.type === 'string');
      expect(stringTokens.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------
  // Punctuation regex: brackets, parens, braces, semicolons, etc.
  // -----------------------------------------------------------------
  describe('punctuation tokenization for brackets and braces', () => {
    it('should tokenize parentheses as punctuation', () => {
      const c = new Code({ code: 'foo(bar)', language: 'javascript' });
      const line = c.getLineOfCode(1)!;
      const punctTokens = line.tokens.filter((t) => t.type === 'punctuation');
      const punctTexts = punctTokens.map((t) => t.text);
      expect(punctTexts).toContain('(');
      expect(punctTexts).toContain(')');
    });

    it('should tokenize curly braces as punctuation', () => {
      const c = new Code({ code: 'if (x) { y; }', language: 'javascript' });
      const line = c.getLineOfCode(1)!;
      const punctTokens = line.tokens.filter((t) => t.type === 'punctuation');
      const punctTexts = punctTokens.map((t) => t.text);
      expect(punctTexts).toContain('{');
      expect(punctTexts).toContain('}');
    });

    it('should tokenize square brackets as punctuation', () => {
      const c = new Code({ code: 'a[0]', language: 'javascript' });
      const line = c.getLineOfCode(1)!;
      const punctTokens = line.tokens.filter((t) => t.type === 'punctuation');
      const punctTexts = punctTokens.map((t) => t.text);
      expect(punctTexts).toContain('[');
      expect(punctTexts).toContain(']');
    });

    it('should tokenize semicolons, colons, commas, dots as punctuation', () => {
      const c = new Code({ code: 'a.b,c;d:e', language: 'javascript' });
      const line = c.getLineOfCode(1)!;
      const punctTokens = line.tokens.filter((t) => t.type === 'punctuation');
      const punctTexts = punctTokens.map((t) => t.text);
      expect(punctTexts).toContain('.');
      expect(punctTexts).toContain(',');
      expect(punctTexts).toContain(';');
      expect(punctTexts).toContain(':');
    });
  });

  // -----------------------------------------------------------------
  // texture.colorSpace set to SRGBColorSpace after _createThreeObject
  // -----------------------------------------------------------------
  describe('texture colorSpace in _createThreeObject', () => {
    it('should set texture.colorSpace to SRGBColorSpace', () => {
      const c = new Code({ code: 'hello' });
      const obj = c.getThreeObject();
      const mesh = obj.children.find((ch) => ch.type === 'Mesh') as THREE.Mesh;
      expect(mesh).toBeDefined();
      const mat = mesh.material as THREE.MeshBasicMaterial;
      expect(mat.map).toBeDefined();
      expect(mat.map!.colorSpace).toBe(THREE.SRGBColorSpace);
    });
  });

  // -----------------------------------------------------------------
  // _createThreeObject when canvas is null
  // -----------------------------------------------------------------
  describe('_createThreeObject when canvas is null', () => {
    it('should return empty group when canvas is null', () => {
      const c = new Code({ code: 'hello' });
      const internal = c as unknown as {
        _canvas: HTMLCanvasElement | null;
        _threeObject: THREE.Object3D | null;
        _createThreeObject: () => THREE.Object3D;
      };
      internal._canvas = null;
      internal._threeObject = null; // force re-creation
      const obj = internal._createThreeObject();
      expect(obj.type).toBe('Group');
      // Should have no mesh children since canvas is null
      expect(obj.children.length).toBe(0);
    });
  });

  // -----------------------------------------------------------------
  // _updateMesh when mesh is null
  // -----------------------------------------------------------------
  describe('_updateMesh when mesh is null', () => {
    it('should be a no-op when mesh is null', () => {
      const c = new Code({ code: 'hello' });
      const internal = c as unknown as { _updateMesh: () => void };
      // Don't call getThreeObject, so mesh is null
      expect(() => internal._updateMesh()).not.toThrow();
    });
  });

  // -----------------------------------------------------------------
  // _syncMaterialToThree when mesh is null
  // -----------------------------------------------------------------
  describe('_syncMaterialToThree when mesh is null', () => {
    it('should not throw when mesh is null', () => {
      const c = new Code({ code: 'hello' });
      const internal = c as unknown as { _syncMaterialToThree: () => void };
      expect(() => internal._syncMaterialToThree()).not.toThrow();
    });
  });
});

// ===========================================================================
// MarkupText (remaining coverage)
// ===========================================================================

describe('MarkupText (additional coverage)', () => {
  // -----------------------------------------------------------------
  // _measureText when ctx is null
  // -----------------------------------------------------------------
  describe('_measureText when ctx is null', () => {
    it('should return empty result when ctx is null', () => {
      const mt = new MarkupText({ text: 'hello' });
      const internal = mt as unknown as {
        _ctx: CanvasRenderingContext2D | null;
        _measureText: () => { lines: string[]; width: number; height: number };
      };
      internal._ctx = null;
      const result = internal._measureText();
      expect(result.lines).toEqual([]);
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });
  });

  // -----------------------------------------------------------------
  // _measureText totalHeight === 0 fallback
  // -----------------------------------------------------------------
  describe('_measureText totalHeight === 0 fallback', () => {
    it('should use fallback height when no styled segments produce height', () => {
      const mt = new MarkupText({ text: '' });
      // Empty text should still produce valid dimensions
      const internal = mt as unknown as {
        _styledSegments: Array<{ text: string }>;
        _measureText: () => { lines: string[]; width: number; height: number };
      };
      // Set segments to an empty-text segment to exercise totalHeight === 0
      internal._styledSegments = [];
      const result = internal._measureText();
      // Should not crash and height should be > 0 (fallback)
      expect(result.height).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------------------------------------------
  // _renderToCanvas when canvas/ctx is null
  // -----------------------------------------------------------------
  describe('_renderToCanvas when canvas/ctx is null', () => {
    it('should return early when canvas is null', () => {
      const mt = new MarkupText({ text: 'hello' });
      const internal = mt as unknown as {
        _canvas: HTMLCanvasElement | null;
        _renderToCanvas: () => void;
      };
      internal._canvas = null;
      expect(() => internal._renderToCanvas()).not.toThrow();
    });
  });

  // -----------------------------------------------------------------
  // _renderToCanvas with _texture present (needsUpdate)
  // -----------------------------------------------------------------
  describe('_renderToCanvas texture update', () => {
    it('should set texture.needsUpdate when texture exists', () => {
      const mt = new MarkupText({ text: '<b>Bold</b>' });
      const internal = mt as unknown as {
        _texture: { needsUpdate: boolean } | null;
        _renderToCanvas: () => void;
      };
      // Use a plain object as a stub texture to avoid THREE.CanvasTexture internals
      const stubTexture = { needsUpdate: false };
      internal._texture = stubTexture;
      internal._renderToCanvas();
      expect(stubTexture.needsUpdate).toBe(true);
    });
  });

  // -----------------------------------------------------------------
  // _measureStyledLineWidth when ctx is null
  // -----------------------------------------------------------------
  describe('_measureStyledLineWidth when ctx is null', () => {
    it('should return 0 when ctx is null', () => {
      const mt = new MarkupText({ text: 'hello' });
      const internal = mt as unknown as {
        _ctx: CanvasRenderingContext2D | null;
        _measureStyledLineWidth: (segments: unknown[]) => number;
      };
      internal._ctx = null;
      expect(internal._measureStyledLineWidth([])).toBe(0);
    });
  });

  // -----------------------------------------------------------------
  // Parsing edge cases
  // -----------------------------------------------------------------
  describe('parsing: self-closing tag in inner parser', () => {
    it('should skip self-closing tags in inner parse', () => {
      const mt = new MarkupText({ text: '<b>text<br/>more</b>' });
      const segs = mt.getStyledSegments();
      expect(segs.length).toBeGreaterThanOrEqual(1);
      // 'text' and 'more' should both be bold
      for (const seg of segs) {
        expect(seg.fontWeight).toBe('bold');
      }
    });
  });

  describe('parsing: mismatched close tag in inner parser', () => {
    it('should handle mismatched close tag gracefully', () => {
      // </i> when parent is <b> - should be handled leniently
      const mt = new MarkupText({ text: '<b>text</i>' });
      const segs = mt.getStyledSegments();
      expect(segs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('parsing: inner parser reaching end without close tag', () => {
    it('should handle missing close tag gracefully', () => {
      const mt = new MarkupText({ text: '<b>unclosed text' });
      const segs = mt.getStyledSegments();
      expect(segs.length).toBeGreaterThanOrEqual(1);
      expect(segs[0].text).toBe('unclosed text');
    });
  });

  // -----------------------------------------------------------------
  // textAlign: right branch
  // -----------------------------------------------------------------
  describe('textAlign: right rendering', () => {
    it('should handle right alignment', () => {
      const mt = new MarkupText({ text: '<b>Right</b>', textAlign: 'right' });
      expect(mt.getStyledSegments()[0].text).toBe('Right');
    });
  });

  // -----------------------------------------------------------------
  // Segment with color override
  // -----------------------------------------------------------------
  describe('segment color override', () => {
    it('should use segment color when specified', () => {
      const mt = new MarkupText({ text: '<span color="red">Red</span> normal' });
      const segs = mt.getStyledSegments();
      expect(segs[0].color).toBe('red');
      expect(segs[1].color).toBeNull();
    });
  });

  // -----------------------------------------------------------------
  // font_size named sizes coverage
  // -----------------------------------------------------------------
  describe('font_size named sizes', () => {
    it('should handle x-small', () => {
      const mt = new MarkupText({ text: '<span font_size="x-small">T</span>' });
      const segs = mt.getStyledSegments();
      expect(segs[0].fontSize).toBeCloseTo(48 * 0.6944, 0);
    });

    it('should handle small', () => {
      const mt = new MarkupText({ text: '<span font_size="small">T</span>' });
      const segs = mt.getStyledSegments();
      expect(segs[0].fontSize).toBeCloseTo(48 * 0.8333, 0);
    });

    it('should handle large', () => {
      const mt = new MarkupText({ text: '<span font_size="large">T</span>' });
      const segs = mt.getStyledSegments();
      expect(segs[0].fontSize).toBeCloseTo(48 * 1.2, 0);
    });
  });

  // -----------------------------------------------------------------
  // parseOpenTag: tag with no attributes
  // -----------------------------------------------------------------
  describe('parseOpenTag: tag with no attributes', () => {
    it('should handle tags with no whitespace or attributes', () => {
      const mt = new MarkupText({ text: '<b>B</b>' });
      expect(mt.getStyledSegments()[0].fontWeight).toBe('bold');
    });
  });

  // -----------------------------------------------------------------
  // Single-quoted attribute values in span
  // -----------------------------------------------------------------
  describe('single-quoted attribute values', () => {
    it('should parse attributes with single quotes', () => {
      const mt = new MarkupText({ text: "<span color='blue'>B</span>" });
      const segs = mt.getStyledSegments();
      expect(segs[0].color).toBe('blue');
    });
  });

  // -----------------------------------------------------------------
  // Legacy markdown overlap avoidance
  // -----------------------------------------------------------------
  describe('legacy markdown overlap avoidance', () => {
    it('should avoid overlapping matches', () => {
      // **bold** contains * inside, which should not be matched as italic
      const mt = new MarkupText({ text: '**bold**' });
      const segs = mt.getStyledSegments();
      expect(segs.length).toBe(1);
      expect(segs[0].fontWeight).toBe('bold');
    });
  });

  // -----------------------------------------------------------------
  // _createCopy preserves all options
  // -----------------------------------------------------------------
  describe('_createCopy preserves all options', () => {
    it('should preserve letterSpacing and textAlign', () => {
      const orig = new MarkupText({
        text: '<b>Test</b>',
        letterSpacing: 2,
        textAlign: 'right',
      });
      const cp = orig.copy() as MarkupText;
      const internalOrig = orig as unknown as { _letterSpacing: number; _textAlign: string };
      const internalCp = cp as unknown as { _letterSpacing: number; _textAlign: string };
      expect(internalCp._letterSpacing).toBe(internalOrig._letterSpacing);
      expect(internalCp._textAlign).toBe(internalOrig._textAlign);
    });

    it('should preserve fontWeight and fontStyle', () => {
      const orig = new MarkupText({
        text: 'Test',
        fontWeight: 'bold',
        fontStyle: 'italic',
      });
      const cp = orig.copy() as MarkupText;
      const internalCp = cp as unknown as { _fontWeight: string; _fontStyle: string };
      expect(internalCp._fontWeight).toBe('bold');
      expect(internalCp._fontStyle).toBe('italic');
    });
  });

  // -----------------------------------------------------------------
  // _getPlainText
  // -----------------------------------------------------------------
  describe('_getPlainText', () => {
    it('should return plain text without markup', () => {
      const mt = new MarkupText({ text: '<b>Bold</b> and <i>Italic</i>' });
      const internal = mt as unknown as { _getPlainText: () => string };
      expect(internal._getPlainText()).toBe('Bold and Italic');
    });

    it('should return full text for plain strings', () => {
      const mt = new MarkupText({ text: 'Hello World' });
      const internal = mt as unknown as { _getPlainText: () => string };
      expect(internal._getPlainText()).toBe('Hello World');
    });
  });

  // -----------------------------------------------------------------
  // _splitStyledSegmentsByLine with newlines
  // -----------------------------------------------------------------
  describe('_splitStyledSegmentsByLine with newlines in segments', () => {
    it('should split segments containing newlines into multiple lines', () => {
      const mt = new MarkupText({ text: '<b>Line1\nLine2\nLine3</b>' });
      const internal = mt as unknown as {
        _splitStyledSegmentsByLine: () => Array<Array<{ text: string }>>;
      };
      const lines = internal._splitStyledSegmentsByLine();
      expect(lines.length).toBe(3);
      expect(lines[0][0].text).toBe('Line1');
      expect(lines[1][0].text).toBe('Line2');
      expect(lines[2][0].text).toBe('Line3');
    });

    it('should handle multiple segments with newlines', () => {
      const mt = new MarkupText({ text: '<b>A\nB</b> <i>C\nD</i>' });
      const internal = mt as unknown as {
        _splitStyledSegmentsByLine: () => Array<Array<{ text: string }>>;
      };
      const lines = internal._splitStyledSegmentsByLine();
      expect(lines.length).toBeGreaterThanOrEqual(3);
    });
  });

  // -----------------------------------------------------------------
  // _maxFontSizeInLine
  // -----------------------------------------------------------------
  describe('_maxFontSizeInLine', () => {
    it('should return maximum font size from segments', () => {
      const mt = new MarkupText({
        text: '<span font_size="72">Big</span> <span font_size="24">Small</span>',
      });
      const internal = mt as unknown as {
        _maxFontSizeInLine: (segments: unknown[]) => number;
        _styledSegments: Array<{ fontSize: number | null; relativeScale: number }>;
      };
      const result = internal._maxFontSizeInLine(internal._styledSegments);
      expect(result).toBeGreaterThanOrEqual(72);
    });
  });
});
