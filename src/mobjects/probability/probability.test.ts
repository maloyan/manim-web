import { describe, it, expect } from 'vitest';
import { DiceFace, createDiceRow, SampleSpace } from './index';
import { VGroup } from '../../core/VGroup';

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

  it('getOutline returns the outer rectangle', () => {
    const ss = new SampleSpace();
    const outline = ss.getOutline();
    expect(outline).toBeDefined();
  });

  it('divideVertically creates partitions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.3, 0.7]);
    expect(ss.numVerticalPartitions).toBe(2);
  });

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

  it('divideHorizontally creates partitions', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5]);
    expect(ss.numHorizontalPartitions).toBe(2);
  });

  it('getHorizontalDivision returns correct partition', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.3, 0.7]);
    const div = ss.getHorizontalDivision(0);
    expect(div.proportion).toBe(0.3);
  });

  it('getHorizontalDivision throws for out-of-range', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5]);
    expect(() => ss.getHorizontalDivision(5)).toThrow();
  });

  it('divideVertically replaces existing partitions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    expect(ss.numVerticalPartitions).toBe(2);
    ss.divideVertically([0.3, 0.3, 0.4]);
    expect(ss.numVerticalPartitions).toBe(3);
  });

  it('subdividePartition creates sub-divisions', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    ss.subdividePartition(0, [0.6, 0.4]);
    const sub = ss.getSubdivision(0, 0);
    expect(sub.proportion).toBe(0.6);
    const sub1 = ss.getSubdivision(0, 1);
    expect(sub1.proportion).toBe(0.4);
  });

  it('subdividePartition throws for invalid partition index', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    expect(() => ss.subdividePartition(5, [0.5, 0.5])).toThrow();
  });

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
  });

  it('getVerticalPartitions returns a copy', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    const parts = ss.getVerticalPartitions();
    expect(parts.length).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts.push(null as unknown as any);
    expect(ss.getVerticalPartitions().length).toBe(2);
  });

  it('getHorizontalPartitions returns a copy', () => {
    const ss = new SampleSpace();
    ss.divideHorizontally([0.5, 0.5]);
    const parts = ss.getHorizontalPartitions();
    expect(parts.length).toBe(2);
  });

  it('getDivisionRectangle returns the rectangle of a division', () => {
    const ss = new SampleSpace();
    ss.divideVertically([0.5, 0.5]);
    const rect = ss.getDivisionRectangle(0);
    expect(rect).toBeDefined();
  });

  it('getTitle returns null when no title is set', () => {
    const ss = new SampleSpace();
    expect(ss.getTitle()).toBeNull();
  });

  it('is a VGroup', () => {
    const ss = new SampleSpace();
    expect(ss).toBeInstanceOf(VGroup);
  });
});
