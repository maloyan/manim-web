import { describe, it, expect } from 'vitest';
import { Matrix, IntegerMatrix, DecimalMatrix, MobjectMatrix } from './Matrix';
import { Mobject } from '../../core/Mobject';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';

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

  it('curly brace bracket type', () => {
    const m = new Matrix([[1]], { bracketType: '{}' });
    expect(m.getBrackets()).not.toBeNull();
    expect(m.getLeftBracket()).not.toBeNull();
    expect(m.getRightBracket()).not.toBeNull();
  });

  it('angle bracket type', () => {
    const m = new Matrix([[1]], { bracketType: '<>' });
    expect(m.getBrackets()).not.toBeNull();
    expect(m.getLeftBracket()).not.toBeNull();
    expect(m.getRightBracket()).not.toBeNull();
  });

  it('is a VGroup', () => {
    const m = new Matrix([[1]]);
    expect(m).toBeInstanceOf(VGroup);
  });

  it('handles Mobject entries in _createEntry', () => {
    const entry = new VMobject();
    const m = new Matrix([[entry]]);
    expect(m.getEntry(0, 0)).toBe(entry);
  });

  it('getEntries collects VMobject entries', () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
    ]);
    const entries = m.getEntries();
    expect(entries).toBeInstanceOf(VGroup);
  });

  it('copy creates independent Matrix with same data', () => {
    const m = new Matrix(
      [
        [1, 2],
        [3, 4],
      ],
      { bracketType: '()', vBuff: 1, hBuff: 1.5 },
    );
    const c = m.copy() as Matrix;
    expect(c).toBeInstanceOf(Matrix);
    expect(c.numRows).toBe(2);
    expect(c.numCols).toBe(2);
    expect(c).not.toBe(m);
  });

  it('copy preserves position', () => {
    const m = new Matrix([[1]], { position: [1, 2, 3] });
    const c = m.copy() as Matrix;
    expect(c.position.x).toBeCloseTo(1);
    expect(c.position.y).toBeCloseTo(2);
  });

  it('copy with Mobject entries clones them', () => {
    const entry = new VMobject();
    const m = new Matrix([[entry]]);
    const c = m.copy() as Matrix;
    expect(c.getEntry(0, 0)).not.toBe(entry);
  });

  it('getRow returns undefined for out-of-bounds', () => {
    const m = new Matrix([[1]]);
    expect(m.getRow(99)).toBeUndefined();
  });

  it('getColumn returns undefined for out-of-bounds', () => {
    const m = new Matrix([[1]]);
    expect(m.getColumn(99)).toBeUndefined();
  });

  it('numCols returns 0 for empty entries', () => {
    const m = new Matrix([['a']]);
    expect(m.numCols).toBe(1);
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

  it('copy creates independent IntegerMatrix', () => {
    const m = new IntegerMatrix(
      [
        [1, 2],
        [3, 4],
      ],
      { bracketType: '()' },
    );
    const c = m.copy() as IntegerMatrix;
    expect(c).toBeInstanceOf(IntegerMatrix);
    expect(c.numRows).toBe(2);
    expect(c.numCols).toBe(2);
    expect(c).not.toBe(m);
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

  it('copy creates independent DecimalMatrix', () => {
    const m = new DecimalMatrix([[1.5, 2.7]], { numDecimalPlaces: 3 });
    const c = m.copy() as DecimalMatrix;
    expect(c).toBeInstanceOf(DecimalMatrix);
    expect(c.numRows).toBe(1);
    expect(c.numCols).toBe(2);
    expect(c).not.toBe(m);
  });
});

describe('MobjectMatrix', () => {
  it('constructs from Mobject data', () => {
    const entries = [[new VMobject(), new VMobject()]];
    const m = new MobjectMatrix(entries);
    expect(m.numRows).toBe(1);
    expect(m.numCols).toBe(2);
    expect(m).toBeInstanceOf(Matrix);
  });

  it('_createEntry passes Mobject through directly', () => {
    const obj = new VMobject();
    const m = new MobjectMatrix([[obj]]);
    expect(m.getEntry(0, 0)).toBe(obj);
  });

  it('getEntries includes VMobject entries', () => {
    const a = new VMobject();
    const b = new VMobject();
    const m = new MobjectMatrix([[a, b]]);
    const entries = m.getEntries();
    expect(entries.children.length).toBe(2);
  });

  it('_createEntry falls back to super for non-Mobject values', () => {
    // MobjectMatrix._createEntry delegates to super for string/number
    const m = new MobjectMatrix([[new VMobject()]]);
    expect(m.numRows).toBe(1);
  });

  it('copy creates independent MobjectMatrix', () => {
    const entries = [[new VMobject()]];
    const m = new MobjectMatrix(entries, { bracketType: '||' });
    const c = m.copy() as MobjectMatrix;
    expect(c).toBeInstanceOf(MobjectMatrix);
    expect(c.numRows).toBe(1);
    expect(c).not.toBe(m);
    expect(c.getEntry(0, 0)).not.toBe(entries[0][0]);
  });
});

// Regression: a bare `new Matrix(...)` must keep its entries in the matrix
// render tree. The former _buildMatrix added each entry to a row group AND to a
// column group; the second add() reparented the entry onto a detached column
// VGroup, so the matrix rendered only its brackets. These tests fail against
// that double-parenting bug and pass once entries are owned by rows alone.
describe('Matrix render tree (regression: entries must stay attached)', () => {
  it('includes every entry in the matrix family after construction', () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
    ]);
    const family = m.getFamily();
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        expect(family).toContain(m.getEntry(i, j));
      }
    }
  });

  it("resolves each entry's parent chain up to the matrix", () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
    ]);
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const chain: Mobject[] = [];
        let node: Mobject | null = m.getEntry(i, j) ?? null;
        while (node) {
          chain.push(node);
          node = node.parent;
        }
        expect(chain).toContain(m);
      }
    }
  });

  it("attaches each entry's THREE object under the matrix THREE object", () => {
    const a = new VMobject();
    const b = new VMobject();
    const c = new VMobject();
    const d = new VMobject();
    const m = new MobjectMatrix([
      [a, b],
      [c, d],
    ]);
    const root = m.getThreeObject(); // triggers _syncToThree over the family
    for (const entry of [a, b, c, d]) {
      let parent: typeof root.parent = entry.getThreeObject().parent;
      let reachesMatrix = false;
      while (parent) {
        if (parent === root) {
          reachesMatrix = true;
          break;
        }
        parent = parent.parent;
      }
      expect(reachesMatrix).toBe(true);
    }
  });

  it('getEntries returns a view that does NOT detach entries from the matrix', () => {
    const m = new Matrix([
      [1, 2],
      [3, 4],
    ]);
    // Calling the view accessors must not steal the entries out of the matrix.
    m.getEntries();
    m.getColumns();
    const family = m.getFamily();
    expect(family).toContain(m.getEntry(0, 0));
    expect(family).toContain(m.getEntry(1, 1));
  });
});
