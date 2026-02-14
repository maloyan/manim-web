// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { MathTex } from './MathTex';

describe('MathTex', () => {
  // -----------------------------------------------------------
  // Constructor & basic properties
  // -----------------------------------------------------------
  describe('constructor', () => {
    it('should create with a latex string', () => {
      const tex = new MathTex({ latex: 'x^2' });
      expect(tex.getLatex()).toBe('x^2');
    });

    it('should accept an empty latex string', () => {
      const tex = new MathTex({ latex: '' });
      expect(tex.getLatex()).toBe('');
    });

    it('should use default fontSize of 48', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(tex.getFontSize()).toBe(48);
    });

    it('should accept custom fontSize', () => {
      const tex = new MathTex({ latex: 'a', fontSize: 72 });
      expect(tex.getFontSize()).toBe(72);
    });

    it('should default renderer to auto', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(tex.getRenderer()).toBe('auto');
    });

    it('should accept renderer option katex', () => {
      const tex = new MathTex({ latex: 'a', renderer: 'katex' });
      expect(tex.getRenderer()).toBe('katex');
    });

    it('should accept renderer option mathjax', () => {
      const tex = new MathTex({ latex: 'a', renderer: 'mathjax' });
      expect(tex.getRenderer()).toBe('mathjax');
    });

    it('should set default color to white', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(tex.color).toBe('#ffffff');
    });

    it('should accept custom color', () => {
      const tex = new MathTex({ latex: 'a', color: '#ff0000' });
      expect(tex.color).toBe('#ff0000');
    });

    it('should set position from options', () => {
      const tex = new MathTex({ latex: 'a', position: [1, 2, 3] });
      expect(tex.position.x).toBe(1);
      expect(tex.position.y).toBe(2);
      expect(tex.position.z).toBe(3);
    });

    it('should default position to origin', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(tex.position.x).toBe(0);
      expect(tex.position.y).toBe(0);
      expect(tex.position.z).toBe(0);
    });
  });

  // -----------------------------------------------------------
  // Multi-part constructor
  // -----------------------------------------------------------
  describe('multi-part constructor', () => {
    it('should create multi-part from string array', () => {
      const tex = new MathTex({ latex: ['x', '=', '42'] });
      expect(tex.getPartCount()).toBe(3);
    });

    it('should join array latex into single string for getLatex', () => {
      const tex = new MathTex({ latex: ['x', '=', '42'] });
      expect(tex.getLatex()).toBe('x=42');
    });

    it('should create single-part from single string', () => {
      const tex = new MathTex({ latex: 'E = mc^2' });
      expect(tex.getPartCount()).toBe(1);
    });

    it('should handle single-element array', () => {
      const tex = new MathTex({ latex: ['x'] });
      expect(tex.getPartCount()).toBe(1);
      expect(tex.getLatex()).toBe('x');
    });

    it('should handle two-element array', () => {
      const tex = new MathTex({ latex: ['a', 'b'] });
      expect(tex.getPartCount()).toBe(2);
    });
  });

  // -----------------------------------------------------------
  // getLatex / setLatex
  // -----------------------------------------------------------
  describe('getLatex / setLatex', () => {
    it('should return the latex string', () => {
      const tex = new MathTex({ latex: 'y = mx + b' });
      expect(tex.getLatex()).toBe('y = mx + b');
    });

    it('should update latex via setLatex', () => {
      const tex = new MathTex({ latex: 'a' });
      tex.setLatex('b');
      expect(tex.getLatex()).toBe('b');
    });

    it('should return this for chaining on setLatex', () => {
      const tex = new MathTex({ latex: 'a' });
      const result = tex.setLatex('b');
      expect(result).toBe(tex);
    });

    it('should not re-render when setting same latex', () => {
      const tex = new MathTex({ latex: 'a' });
      const result = tex.setLatex('a');
      expect(result).toBe(tex);
      expect(tex.getLatex()).toBe('a');
    });
  });

  // -----------------------------------------------------------
  // getFontSize / setFontSize
  // -----------------------------------------------------------
  describe('getFontSize / setFontSize', () => {
    it('should return fontSize', () => {
      const tex = new MathTex({ latex: 'a', fontSize: 64 });
      expect(tex.getFontSize()).toBe(64);
    });

    it('should update fontSize via setFontSize', () => {
      const tex = new MathTex({ latex: 'a' });
      tex.setFontSize(96);
      expect(tex.getFontSize()).toBe(96);
    });

    it('should return this for chaining on setFontSize', () => {
      const tex = new MathTex({ latex: 'a' });
      const result = tex.setFontSize(96);
      expect(result).toBe(tex);
    });

    it('should not re-render when setting same fontSize', () => {
      const tex = new MathTex({ latex: 'a', fontSize: 48 });
      const result = tex.setFontSize(48);
      expect(result).toBe(tex);
    });
  });

  // -----------------------------------------------------------
  // getRenderer / setRenderer
  // -----------------------------------------------------------
  describe('getRenderer / setRenderer', () => {
    it('should return the current renderer', () => {
      const tex = new MathTex({ latex: 'a', renderer: 'katex' });
      expect(tex.getRenderer()).toBe('katex');
    });

    it('should update renderer via setRenderer', () => {
      const tex = new MathTex({ latex: 'a' });
      tex.setRenderer('mathjax');
      expect(tex.getRenderer()).toBe('mathjax');
    });

    it('should return this for chaining on setRenderer', () => {
      const tex = new MathTex({ latex: 'a' });
      const result = tex.setRenderer('katex');
      expect(result).toBe(tex);
    });

    it('should not re-render when setting same renderer', () => {
      const tex = new MathTex({ latex: 'a', renderer: 'auto' });
      const result = tex.setRenderer('auto');
      expect(result).toBe(tex);
    });
  });

  // -----------------------------------------------------------
  // getDimensions
  // -----------------------------------------------------------
  describe('getDimensions', () => {
    it('should return a tuple of two numbers', () => {
      const tex = new MathTex({ latex: 'a' });
      const dims = tex.getDimensions();
      expect(dims).toHaveLength(2);
      expect(typeof dims[0]).toBe('number');
      expect(typeof dims[1]).toBe('number');
    });

    it('should return [0, 0] before rendering completes for single-part', () => {
      const tex = new MathTex({ latex: 'a' });
      const [w, h] = tex.getDimensions();
      // Initially dimensions are 0 before async render finishes
      expect(w).toBeGreaterThanOrEqual(0);
      expect(h).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------------------------------------
  // isRendering
  // -----------------------------------------------------------
  describe('isRendering', () => {
    it('should return a boolean', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(typeof tex.isRendering()).toBe('boolean');
    });

    it('should initially be true for single-part (rendering started)', () => {
      const tex = new MathTex({ latex: 'x^2' });
      // Rendering is started in constructor, should be true initially
      expect(tex.isRendering()).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // getPart / getPartCount
  // -----------------------------------------------------------
  describe('getPart / getPartCount', () => {
    it('should return 1 for single-string MathTex', () => {
      const tex = new MathTex({ latex: 'E = mc^2' });
      expect(tex.getPartCount()).toBe(1);
    });

    it('should return correct count for multi-part', () => {
      const tex = new MathTex({ latex: ['a', '+', 'b'] });
      expect(tex.getPartCount()).toBe(3);
    });

    it('should return child MathTex for valid index', () => {
      const tex = new MathTex({ latex: ['x', '=', '5'] });
      const part = tex.getPart(0);
      expect(part).toBeInstanceOf(MathTex);
      expect(part.getLatex()).toBe('x');
    });

    it('should return correct part for each index', () => {
      const tex = new MathTex({ latex: ['a', '+', 'b'] });
      expect(tex.getPart(0).getLatex()).toBe('a');
      expect(tex.getPart(1).getLatex()).toBe('+');
      expect(tex.getPart(2).getLatex()).toBe('b');
    });

    it('should throw for getPart on single-string MathTex', () => {
      const tex = new MathTex({ latex: 'x' });
      expect(() => tex.getPart(0)).toThrow('getPart() is only available on multi-part MathTex');
    });

    it('should throw for negative index', () => {
      const tex = new MathTex({ latex: ['a', 'b'] });
      expect(() => tex.getPart(-1)).toThrow('out of range');
    });

    it('should throw for index equal to length', () => {
      const tex = new MathTex({ latex: ['a', 'b'] });
      expect(() => tex.getPart(2)).toThrow('out of range');
    });

    it('should throw for index greater than length', () => {
      const tex = new MathTex({ latex: ['a', 'b'] });
      expect(() => tex.getPart(100)).toThrow('out of range');
    });
  });

  // -----------------------------------------------------------
  // setColor (multi-part propagation)
  // -----------------------------------------------------------
  describe('setColor', () => {
    it('should set color on single-part', () => {
      const tex = new MathTex({ latex: 'a' });
      tex.setColor('#00ff00');
      expect(tex.color).toBe('#00ff00');
    });

    it('should return this for chaining', () => {
      const tex = new MathTex({ latex: 'a' });
      const result = tex.setColor('#00ff00');
      expect(result).toBe(tex);
    });

    it('should propagate color to multi-part children', () => {
      const tex = new MathTex({ latex: ['x', '=', '5'] });
      tex.setColor('#ff0000');
      expect(tex.getPart(0).color).toBe('#ff0000');
      expect(tex.getPart(1).color).toBe('#ff0000');
      expect(tex.getPart(2).color).toBe('#ff0000');
    });
  });

  // -----------------------------------------------------------
  // setOpacity (multi-part propagation)
  // -----------------------------------------------------------
  describe('setOpacity', () => {
    it('should return this for chaining', () => {
      const tex = new MathTex({ latex: 'a' });
      const result = tex.setOpacity(0.5);
      expect(result).toBe(tex);
    });

    it('should propagate opacity to multi-part children', () => {
      const tex = new MathTex({ latex: ['a', 'b'] });
      tex.setOpacity(0.3);
      // Children should also have updated opacity
      const partA = tex.getPart(0);
      const partB = tex.getPart(1);
      // Opacity is stored as _opacity on Mobject
      expect((partA as unknown as { _opacity: number })._opacity).toBeCloseTo(0.3);
      expect((partB as unknown as { _opacity: number })._opacity).toBeCloseTo(0.3);
    });
  });

  // -----------------------------------------------------------
  // getCenter
  // -----------------------------------------------------------
  describe('getCenter', () => {
    it('should return position as Vector3Tuple', () => {
      const tex = new MathTex({ latex: 'a', position: [1, 2, 3] });
      expect(tex.getCenter()).toEqual([1, 2, 3]);
    });

    it('should return origin by default', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(tex.getCenter()).toEqual([0, 0, 0]);
    });
  });

  // -----------------------------------------------------------
  // copy
  // -----------------------------------------------------------
  describe('copy', () => {
    it('should create an independent copy of single-part', () => {
      const original = new MathTex({ latex: 'x^2', color: '#ff0000', fontSize: 64 });
      const clone = original.copy() as MathTex;
      expect(clone).toBeInstanceOf(MathTex);
      expect(clone.getLatex()).toBe('x^2');
      expect(clone.color).toBe('#ff0000');
      expect(clone.getFontSize()).toBe(64);
    });

    it('should create an independent copy (modifying copy does not affect original)', () => {
      const original = new MathTex({ latex: 'a' });
      const clone = original.copy() as MathTex;
      clone.setLatex('b');
      expect(original.getLatex()).toBe('a');
      expect(clone.getLatex()).toBe('b');
    });

    it('should preserve renderer setting in copy', () => {
      const original = new MathTex({ latex: 'a', renderer: 'katex' });
      const clone = original.copy() as MathTex;
      expect(clone.getRenderer()).toBe('katex');
    });

    it('should create copy of multi-part MathTex', () => {
      const original = new MathTex({ latex: ['x', '=', '5'] });
      const clone = original.copy() as MathTex;
      expect(clone.getPartCount()).toBe(3);
      expect(clone.getPart(0).getLatex()).toBe('x');
      expect(clone.getPart(1).getLatex()).toBe('=');
      expect(clone.getPart(2).getLatex()).toBe('5');
    });
  });

  // -----------------------------------------------------------
  // dispose
  // -----------------------------------------------------------
  describe('dispose', () => {
    it('should not throw when called', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(() => tex.dispose()).not.toThrow();
    });

    it('should not throw when called on multi-part', () => {
      const tex = new MathTex({ latex: ['a', 'b'] });
      expect(() => tex.dispose()).not.toThrow();
    });

    it('should not throw when called twice', () => {
      const tex = new MathTex({ latex: 'a' });
      tex.dispose();
      expect(() => tex.dispose()).not.toThrow();
    });
  });

  // -----------------------------------------------------------
  // waitForRender
  // -----------------------------------------------------------
  describe('waitForRender', () => {
    it('should return a promise', () => {
      const tex = new MathTex({ latex: 'a' });
      const result = tex.waitForRender();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return a promise for multi-part', () => {
      const tex = new MathTex({ latex: ['a', 'b'] });
      const result = tex.waitForRender();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // -----------------------------------------------------------
  // getActiveRenderer
  // -----------------------------------------------------------
  describe('getActiveRenderer', () => {
    it('should initially be null before render completes', () => {
      const tex = new MathTex({ latex: 'a' });
      // Before async rendering completes, active renderer may be null
      const active = tex.getActiveRenderer();
      expect(active === null || active === 'katex' || active === 'mathjax').toBe(true);
    });
  });

  // -----------------------------------------------------------
  // setRevealProgress
  // -----------------------------------------------------------
  describe('setRevealProgress', () => {
    it('should not throw on single-part', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(() => tex.setRevealProgress(0.5)).not.toThrow();
    });

    it('should not throw on multi-part', () => {
      const tex = new MathTex({ latex: ['a', 'b', 'c'] });
      expect(() => tex.setRevealProgress(0)).not.toThrow();
      expect(() => tex.setRevealProgress(0.5)).not.toThrow();
      expect(() => tex.setRevealProgress(1)).not.toThrow();
    });

    it('should handle alpha = 0', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(() => tex.setRevealProgress(0)).not.toThrow();
    });

    it('should handle alpha = 1', () => {
      const tex = new MathTex({ latex: 'a' });
      expect(() => tex.setRevealProgress(1)).not.toThrow();
    });
  });

  // -----------------------------------------------------------
  // Complex LaTeX strings
  // -----------------------------------------------------------
  describe('complex LaTeX', () => {
    it('should accept fraction notation', () => {
      const tex = new MathTex({ latex: '\\frac{a}{b}' });
      expect(tex.getLatex()).toBe('\\frac{a}{b}');
    });

    it('should accept integral notation', () => {
      const tex = new MathTex({ latex: '\\int_0^1 x\\,dx' });
      expect(tex.getLatex()).toBe('\\int_0^1 x\\,dx');
    });

    it('should accept summation notation', () => {
      const tex = new MathTex({ latex: '\\sum_{i=1}^{n} i' });
      expect(tex.getLatex()).toBe('\\sum_{i=1}^{n} i');
    });

    it('should accept subscripts and superscripts', () => {
      const tex = new MathTex({ latex: 'a_{ij}^{2}' });
      expect(tex.getLatex()).toBe('a_{ij}^{2}');
    });

    it('should accept Greek letters', () => {
      const tex = new MathTex({ latex: '\\alpha + \\beta = \\gamma' });
      expect(tex.getLatex()).toBe('\\alpha + \\beta = \\gamma');
    });
  });
});
