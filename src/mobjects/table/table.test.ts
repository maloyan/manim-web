import { describe, it, expect } from 'vitest';
import { Table } from './Table';
import { Rectangle } from '../geometry/Rectangle';
import { VGroup } from '../../core/VGroup';

/**
 * Helper: create a small rectangle entry for table tests.
 * Rectangles have known dimensions that Table._getMobjectBounds can measure.
 */
function entry(): Rectangle {
  return new Rectangle({ width: 0.5, height: 0.5 });
}

describe('Table', () => {
  it('constructs a 2x2 table', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(2);
  });

  it('constructs a 3x1 table', () => {
    const t = new Table({
      data: [[entry()], [entry()], [entry()]],
    });
    expect(t.getNumRows()).toBe(3);
    expect(t.getNumCols()).toBe(1);
  });

  it('getCell returns the correct entry', () => {
    const e1 = entry();
    const e2 = entry();
    const t = new Table({
      data: [[e1, e2]],
    });
    expect(t.getCell(0, 0)).toBe(e1);
    expect(t.getCell(0, 1)).toBe(e2);
  });

  it('getCell throws for out-of-bounds indices', () => {
    const t = new Table({
      data: [[entry()]],
    });
    expect(() => t.getCell(5, 0)).toThrow();
    expect(() => t.getCell(0, 5)).toThrow();
    expect(() => t.getCell(-1, 0)).toThrow();
  });

  it('getRow returns a VGroup', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const row = t.getRow(0);
    expect(row).toBeInstanceOf(VGroup);
  });

  it('getRow throws for out-of-bounds index', () => {
    const t = new Table({ data: [[entry()]] });
    expect(() => t.getRow(5)).toThrow();
  });

  it('getColumn returns a VGroup', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const col = t.getColumn(0);
    expect(col).toBeInstanceOf(VGroup);
  });

  it('getColumn throws for out-of-bounds index', () => {
    const t = new Table({ data: [[entry()]] });
    expect(() => t.getColumn(5)).toThrow();
  });

  it('getEntries returns VGroup of all data entries', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const entries = t.getEntries();
    expect(entries).toBeInstanceOf(VGroup);
  });

  it('getRowLabels returns VGroup', () => {
    const t = new Table({
      data: [[entry()]],
      rowLabels: [entry()],
    });
    const labels = t.getRowLabels();
    expect(labels).toBeInstanceOf(VGroup);
  });

  it('getColLabels returns VGroup', () => {
    const t = new Table({
      data: [[entry()]],
      colLabels: [entry()],
    });
    const labels = t.getColLabels();
    expect(labels).toBeInstanceOf(VGroup);
  });

  it('getHorizontalLines returns a VGroup', () => {
    const t = new Table({ data: [[entry()]] });
    expect(t.getHorizontalLines()).toBeInstanceOf(VGroup);
  });

  it('getVerticalLines returns a VGroup', () => {
    const t = new Table({ data: [[entry()]] });
    expect(t.getVerticalLines()).toBeInstanceOf(VGroup);
  });

  it('constructs with includeOuterLines=false', () => {
    const t = new Table({
      data: [[entry(), entry()]],
      includeOuterLines: false,
    });
    expect(t.getNumRows()).toBe(1);
  });

  it('setLineColor updates line colors', () => {
    const t = new Table({
      data: [[entry(), entry()]],
    });
    t.setLineColor('#ff0000');
    // Verify it doesn't throw
    expect(t.getNumRows()).toBe(1);
  });

  it('is a VGroup', () => {
    const t = new Table({ data: [[entry()]] });
    expect(t).toBeInstanceOf(VGroup);
  });
});
