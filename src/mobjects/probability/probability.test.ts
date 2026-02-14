// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import { DiceFace, createDiceRow, SampleSpace } from './index';
import { VGroup } from '../../core/VGroup';

/**
 * happy-dom does not support canvas 2D context. Text (used by SampleSpace
 * for labels, title, braces) calls canvas.getContext('2d') which returns
 * null and throws. We stub it with a minimal mock so construction succeeds.
 */
beforeAll(() => {
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
    if (type === '2d') {
      return {
        scale: () => {},
        clearRect: () => {},
        fillText: () => {},
        fillRect: () => {},
        measureText: () => ({ width: 50, fontBoundingBoxAscent: 30 }),
        drawImage: () => {},
        font: '',
        fillStyle: '',
        globalAlpha: 1,
        textBaseline: 'alphabetic',
        textAlign: 'left',
      } as unknown as CanvasRenderingContext2D;
    }
    return origGetContext.call(this, type, ...(args as []));
  } as typeof origGetContext;
});

describe('DiceFace', () => {
  it('constructs with default value 1', () => {
    const face = new DiceFace();
    expect(face.getValue()).toBe(1);
  });

  it('constructs with specified value', () => {
    const face = new DiceFace({ value: 5 });
    expect(face.getValue()).toBe(5);
  });

  it('throws for value less than 1', () => {
    expect(() => new DiceFace({ value: 0 })).toThrow();
  });

  it('throws for value greater than 6', () => {
    expect(() => new DiceFace({ value: 7 })).toThrow();
  });

  it('throws for non-integer values', () => {
    expect(() => new DiceFace({ value: 2.5 })).toThrow();
  });

  it('has correct number of dots for each value', () => {
    for (let v = 1; v <= 6; v++) {
      const face = new DiceFace({ value: v });
      expect(face.getDots().length).toBe(v);
    }
  });

  it('getSize returns the side length', () => {
    const face = new DiceFace({ size: 2 });
    expect(face.getSize()).toBe(2);
  });

  it('default size is 1.5', () => {
    const face = new DiceFace();
    expect(face.getSize()).toBe(1.5);
  });

  it('getDotColor returns configured dot color', () => {
    const face = new DiceFace({ dotColor: '#ff0000' });
    expect(face.getDotColor()).toBe('#ff0000');
  });

  it('getBackgroundColor returns configured background color', () => {
    const face = new DiceFace({ backgroundColor: '#00ff00' });
    expect(face.getBackgroundColor()).toBe('#00ff00');
  });

  it('getBackground returns the background rectangle', () => {
    const face = new DiceFace();
    const bg = face.getBackground();
    expect(bg).toBeDefined();
  });

  it('setValue updates the face value', () => {
    const face = new DiceFace({ value: 1 });
    face.setValue(6);
    expect(face.getValue()).toBe(6);
    expect(face.getDots().length).toBe(6);
  });

  it('setValue throws for invalid values', () => {
    const face = new DiceFace();
    expect(() => face.setValue(0)).toThrow();
    expect(() => face.setValue(7)).toThrow();
    expect(() => face.setValue(3.5)).toThrow();
  });

  it('setDotColor changes all dot colors', () => {
    const face = new DiceFace({ value: 3 });
    face.setDotColor('#0000ff');
    expect(face.getDotColor()).toBe('#0000ff');
  });

  it('setBackgroundColor changes background', () => {
    const face = new DiceFace();
    face.setBackgroundColor('#ff00ff');
    expect(face.getBackgroundColor()).toBe('#ff00ff');
  });

  it('is a VGroup', () => {
    const face = new DiceFace();
    expect(face).toBeInstanceOf(VGroup);
  });
});

describe('createDiceRow', () => {
  it('creates a VGroup with 6 DiceFace children', () => {
    const row = createDiceRow();
    expect(row).toBeInstanceOf(VGroup);
    expect(row.children.length).toBe(6);
  });

  it('each child has correct value 1-6', () => {
    const row = createDiceRow();
    for (let i = 0; i < 6; i++) {
      const face = row.children[i] as DiceFace;
      expect(face.getValue()).toBe(i + 1);
    }
  });

  it('passes options to each face', () => {
    const row = createDiceRow({ size: 1, dotColor: '#ff0000' });
    for (const child of row.children) {
      const face = child as DiceFace;
      expect(face.getSize()).toBe(1);
      expect(face.getDotColor()).toBe('#ff0000');
    }
  });
});

describe('SampleSpace', () => {
  // ---- Construction ----
  it('constructs with default options', () => {
    const ss = new SampleSpace();
    expect(ss.getSampleSpaceWidth()).toBe(3);
    expect(ss.getSampleSpaceHeight()).toBe(3);
    expect(ss.getSampleSpaceCenter()).toEqual([0, 0, 0]);
    expect(ss.numVerticalPartitions).toBe(0);
    expect(ss.numHorizontalPartitions).toBe(0);
  });

  it('constructs with custom dimensions', () => {
    const ss = new SampleSpace({ width: 5, height: 4, center: [1, 2, 0] });
    expect(ss.getSampleSpaceWidth()).toBe(5);
    expect(ss.getSampleSpaceHeight()).toBe(4);
    expect(ss.getSampleSpaceCenter()).toEqual([1, 2, 0]);
  });

  it('constructs with custom color, fillOpacity, strokeWidth, and fontSize', () => {
    const ss = new SampleSpace({
      width: 2,
      height: 2,
      color: '#ff0000',
      fillOpacity: 0.5,
      strokeWidth: 4,
      fontSize: 32,
    });
    expect(ss.getSampleSpaceWidth()).toBe(2);
    expect(ss.getSampleSpaceHeight()).toBe(2);
  });

  it('getOutline returns the outer rectangle', () => {
    const ss = new SampleSpace();
    const outline = ss.getOutline();
    expect(outline).toBeDefined();
    expect(outline.getWidth()).toBeCloseTo(3, 1);
    expect(outline.getHeight()).toBeCloseTo(3, 1);
  });

  it('is a VGroup', () => {
    const ss = new SampleSpace();
    expect(ss).toBeInstanceOf(VGroup);
  });

  // ---- divideVertically ----
  it('divideVertically creates partitions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.3, 0.7]);
    expect(ss.numVerticalPartitions).toBe(2);
  });

  it('divideVertically with two equal partitions', () => {
    const ss = new SampleSpace({ width: 4, height: 2 });
    ss.divideVertically([0.5, 0.5]);
    expect(ss.numVerticalPartitions).toBe(2);
    const div0 = ss.getDivision(0);
    const div1 = ss.getDivision(1);
    expect(div0.proportion).toBe(0.5);
    expect(div1.proportion).toBe(0.5);
    // Each partition rectangle should have width = 4 * 0.5 = 2
    expect(div0.rectangle.getWidth()).toBeCloseTo(2, 1);
    expect(div1.rectangle.getWidth()).toBeCloseTo(2, 1);
    // Both should have full height
    expect(div0.rectangle.getHeight()).toBeCloseTo(2, 1);
    expect(div1.rectangle.getHeight()).toBeCloseTo(2, 1);
  });

  it('divideVertically with custom colors', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.3, 0.7], { colors: ['#ff0000', '#00ff00'] });
    expect(ss.numVerticalPartitions).toBe(2);
  });

  it('divideVertically with custom fillOpacity', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5], { fillOpacity: 0.5 });
    expect(ss.numVerticalPartitions).toBe(2);
  });

  it('divideVertically with labels', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.3, 0.7], {
      labels: ['P(A)=0.3', 'P(B)=0.7'],
    });
    expect(ss.numVerticalPartitions).toBe(2);
    const div0 = ss.getDivision(0);
    const div1 = ss.getDivision(1);
    expect(div0.label).toBeDefined();
    expect(div1.label).toBeDefined();
  });

  it('divideVertically with labels, custom fontSize and color', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.4, 0.6], {
      labels: ['0.4', '0.6'],
      labelFontSize: 18,
      labelColor: '#ffff00',
    });
    expect(ss.getDivision(0).label).toBeDefined();
    expect(ss.getDivision(1).label).toBeDefined();
  });

  it('divideVertically with three partitions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.2, 0.3, 0.5]);
    expect(ss.numVerticalPartitions).toBe(3);
    expect(ss.getDivision(0).proportion).toBe(0.2);
    expect(ss.getDivision(1).proportion).toBe(0.3);
    expect(ss.getDivision(2).proportion).toBe(0.5);
  });

  it('divideVertically uses default color cycle when no colors given', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.25, 0.25, 0.25, 0.25]);
    expect(ss.numVerticalPartitions).toBe(4);
  });

  it('divideVertically replaces existing partitions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    expect(ss.numVerticalPartitions).toBe(2);
    ss.divideVertically([0.3, 0.3, 0.4]);
    expect(ss.numVerticalPartitions).toBe(3);
  });

  it('divideVertically replaces existing partitions including labels', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5], { labels: ['A', 'B'] });
    expect(ss.getDivision(0).label).toBeDefined();
    ss.divideVertically([0.3, 0.7]);
    expect(ss.numVerticalPartitions).toBe(2);
  });

  it('divideVertically replaces existing partitions and clears subdivisions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.6, 0.4]);
    // Now re-divide should clear subdivisions
    ss.divideVertically([0.3, 0.7]);
    expect(ss.numVerticalPartitions).toBe(2);
    expect(() => ss.getSubdivision(0, 0)).toThrow();
  });

  it('divideVertically returns this for chaining', () => {
    const ss = new SampleSpace();
    const result = ss.divideVertically([0.5, 0.5]);
    expect(result).toBe(ss);
  });

  // ---- getDivision ----
  it('getDivision returns correct partition', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.4, 0.6]);
    const div = ss.getDivision(0);
    expect(div.proportion).toBe(0.4);
    const div1 = ss.getDivision(1);
    expect(div1.proportion).toBe(0.6);
  });

  it('getDivision throws for out-of-range index', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    expect(() => ss.getDivision(5)).toThrow();
    expect(() => ss.getDivision(-1)).toThrow();
  });

  it('getDivision throws when no partitions exist', () => {
    const ss = new SampleSpace();
    expect(() => ss.getDivision(0)).toThrow();
  });

  // ---- getDivisionRectangle ----
  it('getDivisionRectangle returns the rectangle of a division', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    const rect = ss.getDivisionRectangle(0);
    expect(rect).toBeDefined();
    expect(rect.getWidth()).toBeCloseTo(1.5, 1); // 3 * 0.5 = 1.5
  });

  // ---- divideHorizontally ----
  it('divideHorizontally creates partitions', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5]);
    expect(ss.numHorizontalPartitions).toBe(2);
  });

  it('divideHorizontally with two unequal partitions', () => {
    const ss = new SampleSpace({ width: 3, height: 4 });
    ss.divideHorizontally([0.25, 0.75]);
    expect(ss.numHorizontalPartitions).toBe(2);
    const div0 = ss.getHorizontalDivision(0);
    const div1 = ss.getHorizontalDivision(1);
    expect(div0.proportion).toBe(0.25);
    expect(div1.proportion).toBe(0.75);
    // Heights: 4*0.25=1, 4*0.75=3
    expect(div0.rectangle.getHeight()).toBeCloseTo(1, 1);
    expect(div1.rectangle.getHeight()).toBeCloseTo(3, 1);
    // Both should have full width
    expect(div0.rectangle.getWidth()).toBeCloseTo(3, 1);
    expect(div1.rectangle.getWidth()).toBeCloseTo(3, 1);
  });

  it('divideHorizontally with custom colors', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5], { colors: ['#ff0000', '#0000ff'] });
    expect(ss.numHorizontalPartitions).toBe(2);
  });

  it('divideHorizontally with labels', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.3, 0.7], {
      labels: ['Top', 'Bottom'],
      labelFontSize: 20,
      labelColor: '#00ff00',
    });
    const div0 = ss.getHorizontalDivision(0);
    const div1 = ss.getHorizontalDivision(1);
    expect(div0.label).toBeDefined();
    expect(div1.label).toBeDefined();
  });

  it('divideHorizontally with custom fillOpacity', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5], { fillOpacity: 0.3 });
    expect(ss.numHorizontalPartitions).toBe(2);
  });

  it('divideHorizontally with three partitions', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.2, 0.5, 0.3]);
    expect(ss.numHorizontalPartitions).toBe(3);
  });

  it('divideHorizontally replaces existing partitions', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5]);
    expect(ss.numHorizontalPartitions).toBe(2);
    ss.divideHorizontally([0.3, 0.3, 0.4]);
    expect(ss.numHorizontalPartitions).toBe(3);
  });

  it('divideHorizontally replaces existing partitions with labels', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5], { labels: ['A', 'B'] });
    ss.divideHorizontally([1.0]);
    expect(ss.numHorizontalPartitions).toBe(1);
  });

  it('divideHorizontally returns this for chaining', () => {
    const ss = new SampleSpace();
    const result = ss.divideHorizontally([0.5, 0.5]);
    expect(result).toBe(ss);
  });

  // ---- getHorizontalDivision ----
  it('getHorizontalDivision returns correct partition', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.3, 0.7]);
    const div = ss.getHorizontalDivision(0);
    expect(div.proportion).toBe(0.3);
    const div1 = ss.getHorizontalDivision(1);
    expect(div1.proportion).toBe(0.7);
  });

  it('getHorizontalDivision throws for out-of-range', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5]);
    expect(() => ss.getHorizontalDivision(5)).toThrow();
    expect(() => ss.getHorizontalDivision(-1)).toThrow();
  });

  it('getHorizontalDivision throws when no partitions exist', () => {
    const ss = new SampleSpace();
    expect(() => ss.getHorizontalDivision(0)).toThrow();
  });

  // ---- subdividePartition ----
  it('subdividePartition creates sub-divisions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.6, 0.4]);
    const sub = ss.getSubdivision(0, 0);
    expect(sub.proportion).toBe(0.6);
    const sub1 = ss.getSubdivision(0, 1);
    expect(sub1.proportion).toBe(0.4);
  });

  it('subdividePartition with colors', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.5, 0.5], { colors: ['#ff0000', '#00ff00'] });
    const sub0 = ss.getSubdivision(0, 0);
    const sub1 = ss.getSubdivision(0, 1);
    expect(sub0.rectangle).toBeDefined();
    expect(sub1.rectangle).toBeDefined();
  });

  it('subdividePartition with labels', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.6, 0.4], {
      labels: ['P(C|A)', 'P(D|A)'],
      labelFontSize: 16,
      labelColor: '#ffff00',
    });
    const sub0 = ss.getSubdivision(0, 0);
    const sub1 = ss.getSubdivision(0, 1);
    expect(sub0.label).toBeDefined();
    expect(sub1.label).toBeDefined();
  });

  it('subdividePartition with custom fillOpacity', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.5, 0.5], { fillOpacity: 0.7 });
    expect(ss.getSubdivision(0, 0).proportion).toBe(0.5);
  });

  it('subdividePartition with default colors (no colors provided)', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.3, 0.7]);
    expect(ss.getSubdivision(0, 0).proportion).toBe(0.3);
    expect(ss.getSubdivision(0, 1).proportion).toBe(0.7);
  });

  it('subdividePartition with three sub-partitions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.2, 0.3, 0.5]);
    expect(ss.getSubdivision(0, 0).proportion).toBe(0.2);
    expect(ss.getSubdivision(0, 1).proportion).toBe(0.3);
    expect(ss.getSubdivision(0, 2).proportion).toBe(0.5);
  });

  it('subdividePartition on second partition', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.3, 0.7]);
    ss.subdividePartition(1, [0.4, 0.6]);
    const sub = ss.getSubdivision(1, 0);
    expect(sub.proportion).toBe(0.4);
  });

  it('subdividePartition replaces existing subdivisions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.5, 0.5]);
    expect(ss.getSubdivision(0, 0).proportion).toBe(0.5);
    // Re-subdivide with different proportions
    ss.subdividePartition(0, [0.3, 0.7]);
    expect(ss.getSubdivision(0, 0).proportion).toBe(0.3);
    expect(ss.getSubdivision(0, 1).proportion).toBe(0.7);
  });

  it('subdividePartition replaces existing subdivisions with labels', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.5, 0.5], { labels: ['X', 'Y'] });
    ss.subdividePartition(0, [0.3, 0.7]);
    expect(ss.getSubdivision(0, 0).proportion).toBe(0.3);
  });

  it('subdividePartition throws for invalid partition index', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    expect(() => ss.subdividePartition(5, [0.5, 0.5])).toThrow();
  });

  it('subdividePartition returns this for chaining', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    const result = ss.subdividePartition(0, [0.5, 0.5]);
    expect(result).toBe(ss);
  });

  // ---- getSubdivision ----
  it('getSubdivision throws for non-existent subdivisions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    expect(() => ss.getSubdivision(0, 0)).toThrow();
  });

  it('getSubdivision throws for out-of-range sub-index', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.5, 0.5]);
    expect(() => ss.getSubdivision(0, 5)).toThrow();
    expect(() => ss.getSubdivision(0, -1)).toThrow();
  });

  // ---- getVerticalPartitions / getHorizontalPartitions ----
  it('getVerticalPartitions returns a copy', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    const parts = ss.getVerticalPartitions();
    expect(parts.length).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts.push(null as unknown as any);
    expect(ss.getVerticalPartitions().length).toBe(2);
  });

  it('getVerticalPartitions returns empty array when none exist', () => {
    const ss = new SampleSpace();
    expect(ss.getVerticalPartitions().length).toBe(0);
  });

  it('getHorizontalPartitions returns a copy', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5]);
    const parts = ss.getHorizontalPartitions();
    expect(parts.length).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts.push(null as unknown as any);
    expect(ss.getHorizontalPartitions().length).toBe(2);
  });

  it('getHorizontalPartitions returns empty array when none exist', () => {
    const ss = new SampleSpace();
    expect(ss.getHorizontalPartitions().length).toBe(0);
  });

  // ---- addTitle ----
  it('addTitle creates a title above the sample space', () => {
    const ss = new SampleSpace();
    const title = ss.addTitle('My Sample Space');
    expect(title).toBeDefined();
    expect(ss.getTitle()).toBe(title);
  });

  it('addTitle with custom options', () => {
    const ss = new SampleSpace();
    const title = ss.addTitle('Title', {
      fontSize: 36,
      color: '#ff0000',
      buff: 0.5,
    });
    expect(title).toBeDefined();
    expect(ss.getTitle()).toBe(title);
  });

  it('addTitle replaces existing title', () => {
    const ss = new SampleSpace();
    const title1 = ss.addTitle('First');
    const title2 = ss.addTitle('Second');
    expect(ss.getTitle()).toBe(title2);
    expect(title1).not.toBe(title2);
  });

  it('getTitle returns null when no title is set', () => {
    const ss = new SampleSpace();
    expect(ss.getTitle()).toBeNull();
  });

  // ---- addBracesAndLabels ----
  it('addBracesAndLabels adds braces to vertical partitions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.3, 0.7]);
    const result = ss.addBracesAndLabels(['0.3', '0.7']);
    expect(result).toBe(ss);
  });

  it('addBracesAndLabels with custom options', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.addBracesAndLabels(['A', 'B'], {
      direction: [0, -1, 0],
      fontSize: 20,
      braceColor: '#ffff00',
      labelColor: '#00ff00',
      buff: 0.2,
    });
    expect(ss.numVerticalPartitions).toBe(2);
  });

  it('addBracesAndLabels falls back to horizontal partitions when no vertical ones exist', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5]);
    const result = ss.addBracesAndLabels(['Top', 'Bottom']);
    expect(result).toBe(ss);
  });

  it('addBracesAndLabels replaces existing braces', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.addBracesAndLabels(['A', 'B']);
    // Call again to trigger replace logic
    ss.addBracesAndLabels(['X', 'Y']);
    expect(ss.numVerticalPartitions).toBe(2);
  });

  it('addBracesAndLabels with partial labels (fewer labels than partitions)', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.3, 0.3, 0.4]);
    // Only provide labels for first two
    ss.addBracesAndLabels(['0.3', '0.3']);
    expect(ss.numVerticalPartitions).toBe(3);
  });

  it('addBracesAndLabels with direction up', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.addBracesAndLabels(['A', 'B'], { direction: [0, 1, 0] });
    expect(ss.numVerticalPartitions).toBe(2);
  });

  // ---- Dimension accessors ----
  it('getSampleSpaceWidth returns width', () => {
    const ss = new SampleSpace({ width: 7 });
    expect(ss.getSampleSpaceWidth()).toBe(7);
  });

  it('getSampleSpaceHeight returns height', () => {
    const ss = new SampleSpace({ height: 4 });
    expect(ss.getSampleSpaceHeight()).toBe(4);
  });

  it('getSampleSpaceCenter returns a copy of center', () => {
    const ss = new SampleSpace({ center: [1, 2, 3] });
    const center = ss.getSampleSpaceCenter();
    expect(center).toEqual([1, 2, 3]);
    // Mutating returned center should not affect the sample space
    center[0] = 999;
    expect(ss.getSampleSpaceCenter()).toEqual([1, 2, 3]);
  });

  it('numVerticalPartitions starts at 0', () => {
    const ss = new SampleSpace();
    expect(ss.numVerticalPartitions).toBe(0);
  });

  it('numHorizontalPartitions starts at 0', () => {
    const ss = new SampleSpace();
    expect(ss.numHorizontalPartitions).toBe(0);
  });

  // ---- copy ----
  it('copy creates a new SampleSpace', () => {
    const ss = new SampleSpace({ width: 5, height: 4, center: [1, 2, 0] });
    const c = ss.copy();
    expect(c).toBeInstanceOf(SampleSpace);
    expect(c).not.toBe(ss);
  });

  it('copy preserves dimensions', () => {
    const ss = new SampleSpace({ width: 5, height: 4 });
    const c = ss.copy() as SampleSpace;
    expect(c.getSampleSpaceWidth()).toBe(5);
    expect(c.getSampleSpaceHeight()).toBe(4);
  });

  // ---- Combined scenarios ----
  it('vertical divide + subdivide + title', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.3, 0.7], { colors: ['#ff0000', '#0000ff'] });
    ss.subdividePartition(0, [0.6, 0.4], { labels: ['C|A', 'D|A'] });
    ss.addTitle('Probability Space');
    expect(ss.numVerticalPartitions).toBe(2);
    expect(ss.getSubdivision(0, 0).proportion).toBe(0.6);
    expect(ss.getTitle()).not.toBeNull();
  });

  it('horizontal divide + braces', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.4, 0.6]);
    ss.addBracesAndLabels(['0.4', '0.6']);
    expect(ss.numHorizontalPartitions).toBe(2);
  });

  it('partition rectangle dimensions match expected proportions', () => {
    const ss = new SampleSpace({ width: 10, height: 6 });
    ss.divideVertically([0.2, 0.8]);
    const rect0 = ss.getDivisionRectangle(0);
    const rect1 = ss.getDivisionRectangle(1);
    expect(rect0.getWidth()).toBeCloseTo(2, 1); // 10 * 0.2
    expect(rect1.getWidth()).toBeCloseTo(8, 1); // 10 * 0.8
    expect(rect0.getHeight()).toBeCloseTo(6, 1);
    expect(rect1.getHeight()).toBeCloseTo(6, 1);
  });

  it('horizontal partition rectangle dimensions match expected proportions', () => {
    const ss = new SampleSpace({ width: 6, height: 10 });
    ss.divideHorizontally([0.3, 0.7]);
    const div0 = ss.getHorizontalDivision(0);
    const div1 = ss.getHorizontalDivision(1);
    expect(div0.rectangle.getHeight()).toBeCloseTo(3, 1); // 10 * 0.3
    expect(div1.rectangle.getHeight()).toBeCloseTo(7, 1); // 10 * 0.7
    expect(div0.rectangle.getWidth()).toBeCloseTo(6, 1);
    expect(div1.rectangle.getWidth()).toBeCloseTo(6, 1);
  });

  it('subdivision rectangle dimensions match expected proportions', () => {
    const ss = new SampleSpace({ width: 4, height: 4 });
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.25, 0.75]);
    const sub0 = ss.getSubdivision(0, 0);
    const sub1 = ss.getSubdivision(0, 1);
    // Parent partition is 4*0.5 = 2 wide, 4 tall
    // Subdivisions split the height: 4*0.25=1, 4*0.75=3
    expect(sub0.rectangle.getWidth()).toBeCloseTo(2, 1);
    expect(sub1.rectangle.getWidth()).toBeCloseTo(2, 1);
    expect(sub0.rectangle.getHeight()).toBeCloseTo(1, 1);
    expect(sub1.rectangle.getHeight()).toBeCloseTo(3, 1);
  });

  it('both vertical and horizontal can be set independently', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.divideHorizontally([0.3, 0.7]);
    expect(ss.numVerticalPartitions).toBe(2);
    expect(ss.numHorizontalPartitions).toBe(2);
  });

  it('single partition division', () => {
    const ss = new SampleSpace();
    ss.divideVertically([1.0]);
    expect(ss.numVerticalPartitions).toBe(1);
    expect(ss.getDivision(0).proportion).toBe(1.0);
    expect(ss.getDivision(0).rectangle.getWidth()).toBeCloseTo(3, 1);
  });

  it('many partitions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]);
    expect(ss.numVerticalPartitions).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(ss.getDivision(i).proportion).toBeCloseTo(0.1, 5);
    }
  });

  it('custom center shifts partition positions', () => {
    const ss = new SampleSpace({ width: 4, height: 4, center: [5, 5, 0] });
    ss.divideVertically([0.5, 0.5]);
    const rect0 = ss.getDivisionRectangle(0);
    const rect1 = ss.getDivisionRectangle(1);
    // Center of first partition: 5 - 4/2 + (4*0.5)/2 = 5 - 2 + 1 = 4
    expect(rect0.getRectCenter()[0]).toBeCloseTo(4, 1);
    // Center of second partition: 5 - 2 + 2 + 1 = 6
    expect(rect1.getRectCenter()[0]).toBeCloseTo(6, 1);
  });
});
