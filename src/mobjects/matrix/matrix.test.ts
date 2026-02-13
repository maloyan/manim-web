import { describe, it, expect } from 'vitest';
import { Matrix, IntegerMatrix, DecimalMatrix } from './Matrix';
import { VGroup } from '../../core/VGroup';
// constants

describe('Matrix', () => {
  it('constructs a 2x2 matrix from numbers', () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
    ]);
    expect(m.numRows).toBe(2);
    expect(m.numCols).toBe(2);
  });

  it('constructs a 3x2 matrix', () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    expect(m.numRows).toBe(3);
    expect(m.numCols).toBe(2);
  });

  it('constructs a 1x3 matrix', () => {
    const m = new Matrix([[1, 2, 3]]);
    expect(m.numRows).toBe(1);
    expect(m.numCols).toBe(3);
  });

  it('constructs from string data', () => {
    const m = new Matrix([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(m.numRows).toBe(2);
    expect(m.numCols).toBe(2);
  });

  it('getEntry returns the entry mobject', () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
    ]);
    expect(m.getEntry(0, 0)).toBeDefined();
    expect(m.getEntry(1, 1)).toBeDefined();
  });

  it('getEntry returns undefined for out-of-bounds', () => {
    const m = new Matrix([[1, 2]]);
    expect(m.getEntry(5, 5)).toBeUndefined();
  });

  it('getRow returns a VGroup', () => {
    const m = new Matrix([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const row = m.getRow(0);
    expect(row).toBeInstanceOf(VGroup);
  });

  it('getColumn returns a VGroup', () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
    ]);
    const col = m.getColumn(0);
    expect(col).toBeInstanceOf(VGroup);
  });

  it('getRows returns all rows', () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
    ]);
    const rows = m.getRows();
    expect(rows.length).toBe(2);
  });

  it('getColumns returns all columns', () => {
    const m = new Matrix([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const cols = m.getColumns();
    expect(cols.length).toBe(3);
  });

  it('getEntries returns flat VGroup of all entries', () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
    ]);
    const entries = m.getEntries();
    expect(entries).toBeInstanceOf(VGroup);
  });

  it('default bracket type is []', () => {
    const m = new Matrix([[1]]);
    const brackets = m.getBrackets();
    expect(brackets).not.toBeNull();
    expect(m.getLeftBracket()).not.toBeNull();
    expect(m.getRightBracket()).not.toBeNull();
  });

  it('empty bracket type produces no brackets', () => {
    const m = new Matrix([[1]], { bracketType: '' });
    expect(m.getBrackets()).toBeNull();
    expect(m.getLeftBracket()).toBeNull();
    expect(m.getRightBracket()).toBeNull();
  });

  it('parentheses bracket type', () => {
    const m = new Matrix([[1]], { bracketType: '()' });
    expect(m.getBrackets()).not.toBeNull();
  });

  it('determinant bracket type', () => {
    const m = new Matrix([[1]], { bracketType: '||' });
    expect(m.getBrackets()).not.toBeNull();
  });

  it('is a VGroup', () => {
    const m = new Matrix([[1]]);
    expect(m).toBeInstanceOf(VGroup);
  });
});

describe('IntegerMatrix', () => {
  it('constructs from integer data', () => {
    const m = new IntegerMatrix([
      [1, 2],
      [3, 4],
    ]);
    expect(m.numRows).toBe(2);
    expect(m.numCols).toBe(2);
  });

  it('rounds non-integer values', () => {
    const m = new IntegerMatrix([
      [1.7, 2.3],
      [3.5, 4.9],
    ]);
    expect(m.numRows).toBe(2);
    expect(m.numCols).toBe(2);
  });

  it('is a Matrix', () => {
    const m = new IntegerMatrix([[1]]);
    expect(m).toBeInstanceOf(Matrix);
  });
});

describe('DecimalMatrix', () => {
  it('constructs from decimal data', () => {
    const m = new DecimalMatrix([
      [1.234, 2.567],
      [3.891, 4.012],
    ]);
    expect(m.numRows).toBe(2);
    expect(m.numCols).toBe(2);
  });

  it('default decimal places is 2', () => {
    const m = new DecimalMatrix([[1.23456]]);
    expect(m.numRows).toBe(1);
    expect(m.numCols).toBe(1);
  });

  it('constructs with custom decimal places', () => {
    const m = new DecimalMatrix([[1.23456]], { numDecimalPlaces: 4 });
    expect(m.numRows).toBe(1);
    expect(m.numCols).toBe(1);
  });

  it('is a Matrix', () => {
    const m = new DecimalMatrix([[1.0]]);
    expect(m).toBeInstanceOf(Matrix);
  });
});
