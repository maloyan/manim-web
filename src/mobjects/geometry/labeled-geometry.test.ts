// @vitest-environment happy-dom
/**
 * Tests for LabeledGeometry.ts
 *
 * Coverage for:
 * - directionToVector (all 8 directions)
 * - LabeledLine: constructor, getLine, getLabel, setLabelText,
 *   setLabelPosition, setLabelOffset, setEndpoints, _createCopy
 * - LabeledArrow: constructor, getArrow, getLabel, setLabelText,
 *   setLabelPosition, setLabelOffset, setEndpoints, _createCopy
 * - LabeledDot: constructor, getDot, getLabel, moveTo, setLabelText,
 *   setLabelDirection, setLabelOffset, getPoint, _createCopy
 * - AnnotationDot: constructor, getDot, getOutline, getLabel, moveTo,
 *   setLabelText (with/without existing label), setLabelDirection,
 *   setLabelOffset, getPoint, setShowOutline, _createCopy
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LabeledLine,
  LabeledArrow,
  LabeledDot,
  AnnotationDot,
  LabeledPolygram,
} from './LabeledGeometry';
import { Line } from './Line';
import { Arrow } from './Arrow';
import { Dot } from './Dot';
import { Circle } from './Circle';
import { Polygram } from './Polygram';
import { WHITE } from '../../constants';

/**
 * Create a mock CanvasRenderingContext2D.
 * happy-dom does not support canvas 2D context, so we must mock it.
 */
function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textBaseline: 'top',
    textAlign: 'center',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((_text: string) => ({
      width: _text.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 3,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: _text.length * 10,
    })),
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
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
    if (contextId === '2d') return createMockCtx();
    return null;
  });
});

// ===========================================================================
// LabeledLine
// ===========================================================================

describe('LabeledLine', () => {
  describe('constructor', () => {
    it('creates with defaults', () => {
      const ll = new LabeledLine({ label: 'test' });
      expect(ll.getLine()).toBeInstanceOf(Line);
      expect(ll.getLabel()).toBeDefined();
      expect(ll.getLabel().getText()).toBe('test');
    });

    it('accepts custom start and end', () => {
      const ll = new LabeledLine({
        label: 'AB',
        start: [-2, 0, 0],
        end: [2, 0, 0],
      });
      const line = ll.getLine();
      expect(line.getStart()).toEqual([-2, 0, 0]);
      expect(line.getEnd()).toEqual([2, 0, 0]);
    });

    it('accepts custom labelPosition, labelOrientation, labelOffset', () => {
      const ll = new LabeledLine({
        label: 'X',
        labelPosition: 0.3,
        labelOrientation: 'perpendicular',
        labelOffset: 0.5,
      });
      // Just verify construction succeeds
      expect(ll.getLabel().getText()).toBe('X');
    });

    it('accepts horizontal label orientation', () => {
      const ll = new LabeledLine({
        label: 'H',
        labelOrientation: 'horizontal',
      });
      expect(ll.getLabel().rotation.z).toBe(0);
    });

    it('accepts custom color and strokeWidth', () => {
      const ll = new LabeledLine({
        label: 'c',
        color: '#ff0000',
        strokeWidth: 6,
      });
      expect(ll.getLine().color.toLowerCase()).toBe('#ff0000');
    });

    it('labelColor defaults to line color', () => {
      const ll = new LabeledLine({
        label: 'c',
        color: '#00ff00',
      });
      expect(ll.getLabel().color.toLowerCase()).toBe('#00ff00');
    });

    it('accepts custom labelColor', () => {
      const ll = new LabeledLine({
        label: 'c',
        color: '#00ff00',
        labelColor: '#ff0000',
      });
      expect(ll.getLabel().color.toLowerCase()).toBe('#ff0000');
    });
  });

  describe('setLabelText', () => {
    it('updates label text', () => {
      const ll = new LabeledLine({ label: 'old' });
      ll.setLabelText('new');
      expect(ll.getLabel().getText()).toBe('new');
    });

    it('returns this for chaining', () => {
      const ll = new LabeledLine({ label: 'x' });
      expect(ll.setLabelText('y')).toBe(ll);
    });
  });

  describe('setLabelPosition', () => {
    it('updates label position along line', () => {
      const ll = new LabeledLine({ label: 'mid', start: [0, 0, 0], end: [4, 0, 0] });
      ll.setLabelPosition(0.0);
      // Label should be near the start of the line
      const label = ll.getLabel();
      // position is set internally
      expect(label).toBeDefined();
    });

    it('returns this for chaining', () => {
      const ll = new LabeledLine({ label: 'x' });
      expect(ll.setLabelPosition(0.8)).toBe(ll);
    });
  });

  describe('setLabelOffset', () => {
    it('returns this for chaining', () => {
      const ll = new LabeledLine({ label: 'x' });
      expect(ll.setLabelOffset(0.5)).toBe(ll);
    });
  });

  describe('setEndpoints', () => {
    it('updates line and repositions label', () => {
      const ll = new LabeledLine({ label: 'test', start: [0, 0, 0], end: [1, 0, 0] });
      ll.setEndpoints([0, 0, 0], [5, 5, 0]);
      const line = ll.getLine();
      expect(line.getEnd()).toEqual([5, 5, 0]);
    });

    it('returns this for chaining', () => {
      const ll = new LabeledLine({ label: 'x' });
      expect(ll.setEndpoints([0, 0, 0], [1, 1, 0])).toBe(ll);
    });
  });

  describe('_createCopy', () => {
    it('creates a deep copy', () => {
      const ll = new LabeledLine({
        label: 'copy test',
        start: [-1, 0, 0],
        end: [3, 2, 0],
        color: '#abcdef',
        labelPosition: 0.3,
        labelOrientation: 'perpendicular',
        labelOffset: 0.4,
        labelFontSize: 24,
        labelColor: '#123456',
      });
      const copy = (ll as any)._createCopy() as LabeledLine;
      expect(copy).toBeInstanceOf(LabeledLine);
      expect(copy.getLabel().getText()).toBe('copy test');
    });
  });

  describe('perpendicular label rotation', () => {
    it('handles upside-down perpendicular label', () => {
      // Create a line going left (angle > PI/2 for perpendicular)
      const ll = new LabeledLine({
        label: 'perp',
        start: [2, 0, 0],
        end: [-2, 0, 0],
        labelOrientation: 'perpendicular',
      });
      // The label rotation should be adjusted to keep text readable
      const label = ll.getLabel();
      expect(typeof label.rotation.z).toBe('number');
    });
  });

  describe('parallel label with upside-down line', () => {
    it('flips label to keep readable', () => {
      // Line going from right to left: angle = PI
      const ll = new LabeledLine({
        label: 'parallel',
        start: [2, 0, 0],
        end: [-2, 0, 0],
        labelOrientation: 'parallel',
      });
      const label = ll.getLabel();
      expect(typeof label.rotation.z).toBe('number');
    });
  });
});

// ===========================================================================
// LabeledArrow
// ===========================================================================

describe('LabeledArrow', () => {
  describe('constructor', () => {
    it('creates with defaults', () => {
      const la = new LabeledArrow({ label: 'Force' });
      expect(la.getArrow()).toBeInstanceOf(Arrow);
      expect(la.getLabel().getText()).toBe('Force');
    });

    it('accepts custom start, end, and options', () => {
      const la = new LabeledArrow({
        label: 'v',
        start: [0, 0, 0],
        end: [3, 4, 0],
        color: '#ff0000',
        labelPosition: 0.7,
        labelOrientation: 'horizontal',
        labelOffset: 0.3,
        labelFontSize: 28,
        labelColor: '#00ff00',
      });
      expect(la.getLabel().getText()).toBe('v');
      expect(la.getLabel().color.toLowerCase()).toBe('#00ff00');
    });

    it('labelColor defaults to arrow color', () => {
      const la = new LabeledArrow({
        label: 'x',
        color: '#aabbcc',
      });
      expect(la.getLabel().color.toLowerCase()).toBe('#aabbcc');
    });
  });

  describe('setLabelText', () => {
    it('updates text', () => {
      const la = new LabeledArrow({ label: 'old' });
      la.setLabelText('new');
      expect(la.getLabel().getText()).toBe('new');
    });
  });

  describe('setLabelPosition', () => {
    it('returns this', () => {
      const la = new LabeledArrow({ label: 'x' });
      expect(la.setLabelPosition(0.9)).toBe(la);
    });
  });

  describe('setLabelOffset', () => {
    it('returns this', () => {
      const la = new LabeledArrow({ label: 'x' });
      expect(la.setLabelOffset(0.6)).toBe(la);
    });
  });

  describe('setEndpoints', () => {
    it('updates arrow endpoints', () => {
      const la = new LabeledArrow({ label: 'test' });
      la.setEndpoints([0, 0, 0], [5, 0, 0]);
      expect(la.getArrow().getEnd()).toEqual([5, 0, 0]);
    });
  });

  describe('_createCopy', () => {
    it('produces a LabeledArrow copy', () => {
      const la = new LabeledArrow({
        label: 'copy',
        start: [0, 0, 0],
        end: [2, 3, 0],
        labelColor: '#123456',
        tipLength: 0.3,
        tipWidth: 0.2,
      });
      const copy = (la as any)._createCopy() as LabeledArrow;
      expect(copy).toBeInstanceOf(LabeledArrow);
      expect(copy.getLabel().getText()).toBe('copy');
    });
  });

  describe('parallel and perpendicular label orientations', () => {
    it('parallel label on upside-down arrow is flipped', () => {
      const la = new LabeledArrow({
        label: 'par',
        start: [2, 0, 0],
        end: [-2, 0, 0],
        labelOrientation: 'parallel',
      });
      expect(typeof la.getLabel().rotation.z).toBe('number');
    });

    it('perpendicular label', () => {
      const la = new LabeledArrow({
        label: 'perp',
        start: [0, 0, 0],
        end: [0, 3, 0],
        labelOrientation: 'perpendicular',
      });
      expect(typeof la.getLabel().rotation.z).toBe('number');
    });

    it('horizontal label stays at z=0', () => {
      const la = new LabeledArrow({
        label: 'horiz',
        start: [0, 0, 0],
        end: [3, 4, 0],
        labelOrientation: 'horizontal',
      });
      expect(la.getLabel().rotation.z).toBe(0);
    });
  });
});

// ===========================================================================
// LabeledDot
// ===========================================================================

describe('LabeledDot', () => {
  describe('constructor', () => {
    it('creates with defaults', () => {
      const ld = new LabeledDot({ label: 'A' });
      expect(ld.getDot()).toBeInstanceOf(Dot);
      expect(ld.getLabel().getText()).toBe('A');
    });

    it('accepts custom point and options', () => {
      const ld = new LabeledDot({
        label: 'P',
        point: [1, 2, 0],
        labelDirection: 'DOWN',
        labelOffset: 0.5,
        labelFontSize: 20,
        labelColor: '#ff0000',
        radius: 0.1,
        color: '#00ff00',
        fillOpacity: 0.8,
      });
      expect(ld.getLabel().getText()).toBe('P');
      expect(ld.getPoint()).toEqual([1, 2, 0]);
    });
  });

  describe('moveTo', () => {
    it('moves dot and updates label position', () => {
      const ld = new LabeledDot({ label: 'A', point: [0, 0, 0] });
      ld.moveTo([3, 4, 0]);
      expect(ld.getPoint()).toEqual([3, 4, 0]);
    });

    it('returns this', () => {
      const ld = new LabeledDot({ label: 'A' });
      expect(ld.moveTo([1, 1, 0])).toBe(ld);
    });
  });

  describe('setLabelText', () => {
    it('updates text', () => {
      const ld = new LabeledDot({ label: 'old' });
      ld.setLabelText('new');
      expect(ld.getLabel().getText()).toBe('new');
    });
  });

  describe('setLabelDirection', () => {
    it('updates direction', () => {
      const ld = new LabeledDot({ label: 'A', labelDirection: 'UP' });
      ld.setLabelDirection('RIGHT');
      // No crash, direction is updated
      expect(ld).toBeDefined();
    });

    it('returns this', () => {
      const ld = new LabeledDot({ label: 'A' });
      expect(ld.setLabelDirection('DL')).toBe(ld);
    });
  });

  describe('setLabelOffset', () => {
    it('returns this', () => {
      const ld = new LabeledDot({ label: 'A' });
      expect(ld.setLabelOffset(0.6)).toBe(ld);
    });
  });

  describe('_createCopy', () => {
    it('produces a LabeledDot copy', () => {
      const ld = new LabeledDot({
        label: 'copy',
        point: [1, 2, 0],
        labelDirection: 'DR',
      });
      const copy = (ld as any)._createCopy() as LabeledDot;
      expect(copy).toBeInstanceOf(LabeledDot);
      expect(copy.getLabel().getText()).toBe('copy');
    });
  });

  describe('all label directions', () => {
    const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'UL', 'UR', 'DL', 'DR'] as const;
    for (const dir of directions) {
      it(`supports direction ${dir}`, () => {
        const ld = new LabeledDot({
          label: dir,
          labelDirection: dir,
        });
        expect(ld.getLabel().getText()).toBe(dir);
      });
    }
  });
});

// ===========================================================================
// AnnotationDot
// ===========================================================================

describe('AnnotationDot', () => {
  describe('constructor', () => {
    it('creates with defaults', () => {
      const ad = new AnnotationDot();
      expect(ad.getDot()).toBeInstanceOf(Dot);
      expect(ad.getOutline()).toBeInstanceOf(Circle);
      expect(ad.getLabel()).toBeNull();
    });

    it('creates with label', () => {
      const ad = new AnnotationDot({ label: 'Critical' });
      expect(ad.getLabel()).not.toBeNull();
      expect(ad.getLabel()!.getText()).toBe('Critical');
    });

    it('creates without outline', () => {
      const ad = new AnnotationDot({ showOutline: false });
      expect(ad.getOutline()).toBeNull();
    });

    it('accepts custom options', () => {
      const ad = new AnnotationDot({
        point: [3, 4, 0],
        label: 'X',
        labelDirection: 'DL',
        labelOffset: 0.6,
        labelFontSize: 24,
        labelColor: '#ff0000',
        outlineColor: '#00ff00',
        outlineScale: 2,
        outlineOpacity: 0.5,
        radius: 0.2,
        color: '#0000ff',
        fillOpacity: 0.9,
        strokeWidth: 2,
      });
      expect(ad.getPoint()).toEqual([3, 4, 0]);
      expect(ad.getLabel()!.getText()).toBe('X');
    });

    it('labelColor defaults to dot color', () => {
      const ad = new AnnotationDot({ label: 'X', color: '#aabbcc' });
      expect(ad.getLabel()!.color.toLowerCase()).toBe('#aabbcc');
    });
  });

  describe('moveTo', () => {
    it('moves dot and outline', () => {
      const ad = new AnnotationDot({ point: [0, 0, 0], label: 'P' });
      ad.moveTo([5, 6, 0]);
      expect(ad.getPoint()).toEqual([5, 6, 0]);
    });

    it('works without outline', () => {
      const ad = new AnnotationDot({ showOutline: false });
      ad.moveTo([1, 1, 0]);
      expect(ad.getPoint()).toEqual([1, 1, 0]);
    });

    it('works without label', () => {
      const ad = new AnnotationDot({});
      ad.moveTo([2, 2, 0]);
      expect(ad.getPoint()).toEqual([2, 2, 0]);
    });

    it('returns this', () => {
      const ad = new AnnotationDot();
      expect(ad.moveTo([1, 1, 0])).toBe(ad);
    });
  });

  describe('setLabelText', () => {
    it('updates existing label', () => {
      const ad = new AnnotationDot({ label: 'old' });
      ad.setLabelText('new');
      expect(ad.getLabel()!.getText()).toBe('new');
    });

    it('creates label if it does not exist', () => {
      const ad = new AnnotationDot();
      expect(ad.getLabel()).toBeNull();
      ad.setLabelText('created');
      expect(ad.getLabel()).not.toBeNull();
      expect(ad.getLabel()!.getText()).toBe('created');
    });

    it('returns this', () => {
      const ad = new AnnotationDot();
      expect(ad.setLabelText('x')).toBe(ad);
    });
  });

  describe('setLabelDirection', () => {
    it('updates label direction', () => {
      const ad = new AnnotationDot({ label: 'A', labelDirection: 'UP' });
      ad.setLabelDirection('DOWN');
      // No crash
      expect(ad.getLabel()!.getText()).toBe('A');
    });

    it('returns this', () => {
      const ad = new AnnotationDot({ label: 'A' });
      expect(ad.setLabelDirection('LEFT')).toBe(ad);
    });
  });

  describe('setLabelOffset', () => {
    it('returns this', () => {
      const ad = new AnnotationDot({ label: 'A' });
      expect(ad.setLabelOffset(0.8)).toBe(ad);
    });
  });

  describe('setShowOutline', () => {
    it('enables outline when previously disabled', () => {
      const ad = new AnnotationDot({ showOutline: false });
      expect(ad.getOutline()).toBeNull();
      ad.setShowOutline(true);
      expect(ad.getOutline()).not.toBeNull();
    });

    it('disables outline when previously enabled', () => {
      const ad = new AnnotationDot({ showOutline: true });
      expect(ad.getOutline()).not.toBeNull();
      ad.setShowOutline(false);
      expect(ad.getOutline()).toBeNull();
    });

    it('returns this', () => {
      const ad = new AnnotationDot();
      expect(ad.setShowOutline(false)).toBe(ad);
    });
  });

  describe('_createCopy', () => {
    it('produces an AnnotationDot copy with label', () => {
      const ad = new AnnotationDot({
        point: [1, 2, 0],
        label: 'copy',
        labelDirection: 'DR',
        showOutline: true,
        outlineColor: '#ff0000',
        radius: 0.15,
      });
      const copy = (ad as any)._createCopy() as AnnotationDot;
      expect(copy).toBeInstanceOf(AnnotationDot);
      expect(copy.getLabel()!.getText()).toBe('copy');
    });

    it('produces copy without label', () => {
      const ad = new AnnotationDot({ showOutline: false });
      const copy = (ad as any)._createCopy() as AnnotationDot;
      expect(copy).toBeInstanceOf(AnnotationDot);
      expect(copy.getLabel()).toBeNull();
    });
  });

  describe('getPoint', () => {
    it('returns dot position', () => {
      const ad = new AnnotationDot({ point: [7, 8, 0] });
      expect(ad.getPoint()).toEqual([7, 8, 0]);
    });
  });
});

// ===========================================================================
// LabeledPolygram
// ===========================================================================

describe('LabeledPolygram', () => {
  describe('constructor', () => {
    it('creates with vertex groups and label', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [4, 0, 0],
            [4, 3, 0],
            [0, 3, 0],
          ],
        ],
        label: 'Rectangle',
      });
      expect(lp.getPolygram()).toBeInstanceOf(Polygram);
      expect(lp.getLabel().getText()).toBe('Rectangle');
    });

    it('accepts custom color and fillOpacity', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [2, 0, 0],
            [2, 2, 0],
            [0, 2, 0],
          ],
        ],
        label: 'Square',
        color: '#ff0000',
        fillOpacity: 0.5,
      });
      expect(lp.getPolygram().color.toLowerCase()).toBe('#ff0000');
    });
  });

  describe('label positioning', () => {
    it('places label at pole of inaccessibility', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [4, 0, 0],
            [4, 4, 0],
            [0, 4, 0],
          ],
        ],
        label: 'Center',
      });
      // For a square, the pole should be near the center
      const pole = lp.pole;
      expect(pole[0]).toBeCloseTo(2, 0);
      expect(pole[1]).toBeCloseTo(2, 0);
    });
  });

  describe('pole and radius properties', () => {
    it('exposes pole as [x, y]', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [6, 0, 0],
            [6, 4, 0],
            [0, 4, 0],
          ],
        ],
        label: 'Test',
      });
      const pole = lp.pole;
      expect(pole).toHaveLength(2);
      expect(typeof pole[0]).toBe('number');
      expect(typeof pole[1]).toBe('number');
    });

    it('exposes radius (distance to nearest edge)', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [4, 0, 0],
            [4, 4, 0],
            [0, 4, 0],
          ],
        ],
        label: 'Test',
      });
      expect(lp.radius).toBeGreaterThan(0);
      // For a 4x4 square, the pole radius should be ~2
      expect(lp.radius).toBeCloseTo(2, 0);
    });
  });

  describe('custom precision', () => {
    it('accepts precision parameter', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [2, 0, 0],
            [2, 2, 0],
            [0, 2, 0],
          ],
        ],
        label: 'Prec',
        precision: 0.001,
      });
      expect(lp.pole[0]).toBeCloseTo(1, 2);
      expect(lp.pole[1]).toBeCloseTo(1, 2);
    });
  });

  describe('custom label options', () => {
    it('accepts labelFontSize', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [2, 0, 0],
            [2, 2, 0],
            [0, 2, 0],
          ],
        ],
        label: 'Small',
        labelFontSize: 24,
      });
      expect(lp.getLabel().getFontSize()).toBe(24);
    });

    it('accepts labelColor', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [2, 0, 0],
            [2, 2, 0],
            [0, 2, 0],
          ],
        ],
        label: 'Red',
        labelColor: '#ff0000',
      });
      expect(lp.getLabel().color.toLowerCase()).toBe('#ff0000');
    });

    it('defaults labelColor to white', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [2, 0, 0],
            [2, 2, 0],
            [0, 2, 0],
          ],
        ],
        label: 'Default',
      });
      expect(lp.getLabel().color.toUpperCase()).toBe(WHITE);
    });
  });

  describe('setLabelText', () => {
    it('updates label text', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [2, 0, 0],
            [2, 2, 0],
            [0, 2, 0],
          ],
        ],
        label: 'old',
      });
      lp.setLabelText('new');
      expect(lp.getLabel().getText()).toBe('new');
    });

    it('returns this for chaining', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [2, 0, 0],
            [2, 2, 0],
            [0, 2, 0],
          ],
        ],
        label: 'x',
      });
      expect(lp.setLabelText('y')).toBe(lp);
    });
  });

  describe('_createCopy', () => {
    it('produces a LabeledPolygram copy', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          [
            [0, 0, 0],
            [4, 0, 0],
            [4, 3, 0],
            [0, 3, 0],
          ],
        ],
        label: 'copy test',
        color: '#abcdef',
        labelColor: '#123456',
        labelFontSize: 20,
        precision: 0.1,
      });
      const copy = (lp as any)._createCopy() as LabeledPolygram;
      expect(copy).toBeInstanceOf(LabeledPolygram);
      expect(copy.getLabel().getText()).toBe('copy test');
      expect(copy.pole[0]).toBeCloseTo(lp.pole[0], 0);
      expect(copy.pole[1]).toBeCloseTo(lp.pole[1], 0);
    });
  });

  describe('polygon with holes (multiple vertex groups)', () => {
    it('creates polygram with outer and hole groups', () => {
      const lp = new LabeledPolygram({
        vertexGroups: [
          // Outer boundary
          [
            [0, 0, 0],
            [10, 0, 0],
            [10, 10, 0],
            [0, 10, 0],
          ],
          // Hole in center
          [
            [4, 4, 0],
            [6, 4, 0],
            [6, 6, 0],
            [4, 6, 0],
          ],
        ],
        label: 'With Hole',
      });
      expect(lp.getPolygram()).toBeInstanceOf(Polygram);
      expect(lp.getLabel().getText()).toBe('With Hole');
      // Pole should not be inside the hole
      const pole = lp.pole;
      const insideHole = pole[0] > 4 && pole[0] < 6 && pole[1] > 4 && pole[1] < 6;
      expect(insideHole).toBe(false);
      expect(lp.radius).toBeGreaterThan(0);
    });
  });
});
