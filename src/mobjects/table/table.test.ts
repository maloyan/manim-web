// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import { Table, MathTable, MobjectTable, IntegerTable, DecimalTable } from './Table';
import { Rectangle } from '../geometry/Rectangle';
import { VGroup } from '../../core/VGroup';
import { YELLOW, WHITE } from '../../constants/colors';

/**
 * happy-dom does not support canvas 2D context. DecimalNumber (used by
 * IntegerTable and DecimalTable) calls canvas.getContext('2d') which returns
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

/**
 * Helper: create a small rectangle entry for table tests.
 * Rectangles have known dimensions that Table._getMobjectBounds can measure.
 */
function entry(w = 0.5, h = 0.5): Rectangle {
  return new Rectangle({ width: w, height: h });
}

describe('Table', () => {
  // ---- Basic construction ----
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

  it('constructs a 1x3 table', () => {
    const t = new Table({
      data: [[entry(), entry(), entry()]],
    });
    expect(t.getNumRows()).toBe(1);
    expect(t.getNumCols()).toBe(3);
  });

  it('constructs an empty table (0 rows)', () => {
    const t = new Table({ data: [] });
    expect(t.getNumRows()).toBe(0);
    expect(t.getNumCols()).toBe(0);
  });

  // ---- Constructor options ----
  it('constructs with custom position', () => {
    const t = new Table({
      data: [[entry()]],
      position: [2, 3, 0],
    });
    expect(t.getNumRows()).toBe(1);
  });

  it('constructs with custom vBuff and hBuff', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      vBuff: 0.5,
      hBuff: 1.0,
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(2);
  });

  it('constructs with custom lineColor and lineStrokeWidth', () => {
    const t = new Table({
      data: [[entry()]],
      lineColor: '#ff0000',
      lineStrokeWidth: 4,
    });
    expect(t.getNumRows()).toBe(1);
  });

  it('constructs with entriesColor applied to all entries', () => {
    const e1 = entry();
    const e2 = entry();
    const t = new Table({
      data: [[e1, e2]],
      entriesColor: '#00ff00',
    });
    expect(t.getNumCols()).toBe(2);
  });

  it('constructs with entriesColor applied to row and col labels', () => {
    const rl = entry();
    const cl = entry();
    const t = new Table({
      data: [[entry()]],
      rowLabels: [rl],
      colLabels: [cl],
      entriesColor: '#ff0000',
    });
    expect(t.getNumRows()).toBe(1);
  });

  // ---- Row and column labels ----
  it('constructs with row labels', () => {
    const rl1 = entry();
    const rl2 = entry();
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      rowLabels: [rl1, rl2],
    });
    expect(t.getNumRows()).toBe(2);
    const labels = t.getRowLabels();
    expect(labels).toBeInstanceOf(VGroup);
    expect(labels.children.length).toBe(2);
  });

  it('constructs with column labels', () => {
    const cl1 = entry();
    const cl2 = entry();
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      colLabels: [cl1, cl2],
    });
    expect(t.getNumCols()).toBe(2);
    const labels = t.getColLabels();
    expect(labels).toBeInstanceOf(VGroup);
    expect(labels.children.length).toBe(2);
  });

  it('constructs with both row and column labels', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      rowLabels: [entry(), entry()],
      colLabels: [entry(), entry()],
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(2);
  });

  it('constructs with row labels, column labels, and topLeftEntry', () => {
    const topLeft = entry();
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      rowLabels: [entry(), entry()],
      colLabels: [entry(), entry()],
      topLeftEntry: topLeft,
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(2);
  });

  // ---- getCell ----
  it('getCell returns the correct entry', () => {
    const e1 = entry();
    const e2 = entry();
    const t = new Table({
      data: [[e1, e2]],
    });
    expect(t.getCell(0, 0)).toBe(e1);
    expect(t.getCell(0, 1)).toBe(e2);
  });

  it('getCell returns correct entry in multi-row table', () => {
    const e1 = entry();
    const e2 = entry();
    const e3 = entry();
    const e4 = entry();
    const t = new Table({
      data: [
        [e1, e2],
        [e3, e4],
      ],
    });
    expect(t.getCell(0, 0)).toBe(e1);
    expect(t.getCell(0, 1)).toBe(e2);
    expect(t.getCell(1, 0)).toBe(e3);
    expect(t.getCell(1, 1)).toBe(e4);
  });

  it('getCell throws for out-of-bounds indices', () => {
    const t = new Table({
      data: [[entry()]],
    });
    expect(() => t.getCell(5, 0)).toThrow();
    expect(() => t.getCell(0, 5)).toThrow();
    expect(() => t.getCell(-1, 0)).toThrow();
    expect(() => t.getCell(0, -1)).toThrow();
  });

  // ---- getRow ----
  it('getRow returns a VGroup with correct children', () => {
    const e1 = entry();
    const e2 = entry();
    const t = new Table({
      data: [
        [e1, e2],
        [entry(), entry()],
      ],
    });
    const row = t.getRow(0);
    expect(row).toBeInstanceOf(VGroup);
    expect(row.children.length).toBe(2);
    expect(row.children).toContain(e1);
    expect(row.children).toContain(e2);
  });

  it('getRow throws for out-of-bounds index', () => {
    const t = new Table({ data: [[entry()]] });
    expect(() => t.getRow(5)).toThrow();
    expect(() => t.getRow(-1)).toThrow();
  });

  // ---- getColumn ----
  it('getColumn returns a VGroup with correct children', () => {
    const e1 = entry();
    const e3 = entry();
    const t = new Table({
      data: [
        [e1, entry()],
        [e3, entry()],
      ],
    });
    const col = t.getColumn(0);
    expect(col).toBeInstanceOf(VGroup);
    expect(col.children.length).toBe(2);
    expect(col.children).toContain(e1);
    expect(col.children).toContain(e3);
  });

  it('getColumn throws for out-of-bounds index', () => {
    const t = new Table({ data: [[entry()]] });
    expect(() => t.getColumn(5)).toThrow();
    expect(() => t.getColumn(-1)).toThrow();
  });

  it('getColumn handles ragged rows', () => {
    // Row 0 has 2 cols, row 1 has 1 col
    const e1 = entry();
    const e2 = entry();
    const e3 = entry();
    const t = new Table({
      data: [[e1, e2], [e3]],
    });
    // Column 0 should have entries from both rows
    const col0 = t.getColumn(0);
    expect(col0.children.length).toBe(2);
    // Column 1 should only have entry from row 0
    const col1 = t.getColumn(1);
    expect(col1.children.length).toBe(1);
  });

  // ---- getEntries ----
  it('getEntries returns VGroup of all data entries', () => {
    const e1 = entry();
    const e2 = entry();
    const e3 = entry();
    const e4 = entry();
    const t = new Table({
      data: [
        [e1, e2],
        [e3, e4],
      ],
    });
    const entries = t.getEntries();
    expect(entries).toBeInstanceOf(VGroup);
    expect(entries.children.length).toBe(4);
    expect(entries.children).toContain(e1);
    expect(entries.children).toContain(e4);
  });

  // ---- getRowLabels / getColLabels ----
  it('getRowLabels returns VGroup', () => {
    const rl = entry();
    const t = new Table({
      data: [[entry()]],
      rowLabels: [rl],
    });
    const labels = t.getRowLabels();
    expect(labels).toBeInstanceOf(VGroup);
    expect(labels.children.length).toBe(1);
    expect(labels.children).toContain(rl);
  });

  it('getColLabels returns VGroup', () => {
    const cl = entry();
    const t = new Table({
      data: [[entry()]],
      colLabels: [cl],
    });
    const labels = t.getColLabels();
    expect(labels).toBeInstanceOf(VGroup);
    expect(labels.children.length).toBe(1);
    expect(labels.children).toContain(cl);
  });

  it('getRowLabels returns empty VGroup when no labels', () => {
    const t = new Table({ data: [[entry()]] });
    const labels = t.getRowLabels();
    expect(labels).toBeInstanceOf(VGroup);
    expect(labels.children.length).toBe(0);
  });

  it('getColLabels returns empty VGroup when no labels', () => {
    const t = new Table({ data: [[entry()]] });
    const labels = t.getColLabels();
    expect(labels).toBeInstanceOf(VGroup);
    expect(labels.children.length).toBe(0);
  });

  // ---- Lines ----
  it('getHorizontalLines returns a VGroup', () => {
    const t = new Table({ data: [[entry()]] });
    expect(t.getHorizontalLines()).toBeInstanceOf(VGroup);
  });

  it('getVerticalLines returns a VGroup', () => {
    const t = new Table({ data: [[entry()]] });
    expect(t.getVerticalLines()).toBeInstanceOf(VGroup);
  });

  it('generates correct number of lines with outer lines', () => {
    // 2x2 table with outer lines: 3 horizontal + 3 vertical lines
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      includeOuterLines: true,
    });
    const hLines = t.getHorizontalLines();
    const vLines = t.getVerticalLines();
    expect(hLines.children.length).toBe(3); // top, middle, bottom
    expect(vLines.children.length).toBe(3); // left, middle, right
  });

  it('generates correct number of lines without outer lines', () => {
    // 2x2 table without outer lines: 1 horizontal + 1 vertical
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      includeOuterLines: false,
    });
    const hLines = t.getHorizontalLines();
    const vLines = t.getVerticalLines();
    expect(hLines.children.length).toBe(1); // only middle
    expect(vLines.children.length).toBe(1); // only middle
  });

  it('generates lines with row and column labels', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      rowLabels: [entry(), entry()],
      colLabels: [entry(), entry()],
      includeOuterLines: true,
    });
    const hLines = t.getHorizontalLines();
    const vLines = t.getVerticalLines();
    // With labels: 3 data rows + 1 col-label row = 4 total rows => 5 lines
    expect(hLines.children.length).toBe(4);
    // 2 data cols + 1 row-label col = 3 total cols => 4 lines
    expect(vLines.children.length).toBe(4);
  });

  it('constructs with includeOuterLines=false', () => {
    const t = new Table({
      data: [[entry(), entry()]],
      includeOuterLines: false,
    });
    expect(t.getNumRows()).toBe(1);
  });

  // ---- setLineColor ----
  it('setLineColor updates line colors and returns this', () => {
    const t = new Table({
      data: [[entry(), entry()]],
    });
    const result = t.setLineColor('#ff0000');
    expect(result).toBe(t);
  });

  // ---- addHighlight ----
  it('addHighlight creates a highlight rectangle behind a cell', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const rect = t.addHighlight(0, 0);
    expect(rect).toBeInstanceOf(Rectangle);
  });

  it('addHighlight with default color and opacity', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const rect = t.addHighlight(1, 1);
    expect(rect).toBeInstanceOf(Rectangle);
  });

  it('addHighlight with custom color and opacity', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const rect = t.addHighlight(0, 1, '#ff0000', 0.5);
    expect(rect).toBeInstanceOf(Rectangle);
  });

  it('addHighlight replaces existing highlight on same cell', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const rect1 = t.addHighlight(0, 0);
    const rect2 = t.addHighlight(0, 0, '#ff0000');
    expect(rect1).not.toBe(rect2);
  });

  it('addHighlight works with row and column labels', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      rowLabels: [entry(), entry()],
      colLabels: [entry(), entry()],
    });
    const rect = t.addHighlight(0, 0);
    expect(rect).toBeInstanceOf(Rectangle);
  });

  it('addHighlight on multiple cells', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const r1 = t.addHighlight(0, 0);
    const r2 = t.addHighlight(0, 1);
    const r3 = t.addHighlight(1, 0);
    expect(r1).toBeInstanceOf(Rectangle);
    expect(r2).toBeInstanceOf(Rectangle);
    expect(r3).toBeInstanceOf(Rectangle);
  });

  // ---- removeHighlight ----
  it('removeHighlight removes an existing highlight', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    t.addHighlight(0, 0);
    const result = t.removeHighlight(0, 0);
    expect(result).toBe(t); // returns this
  });

  it('removeHighlight on non-existing highlight does not throw', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    // No highlight added, remove should not throw
    const result = t.removeHighlight(0, 0);
    expect(result).toBe(t);
  });

  // ---- copy ----
  it('copy creates a new Table instance', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const c = t.copy();
    expect(c).toBeInstanceOf(Table);
    expect(c).not.toBe(t);
  });

  it('copy preserves row and column counts', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    const c = t.copy() as Table;
    expect(c.getNumRows()).toBe(2);
    expect(c.getNumCols()).toBe(2);
  });

  it('copy with row labels, col labels, and topLeftEntry', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
      rowLabels: [entry(), entry()],
      colLabels: [entry(), entry()],
      topLeftEntry: entry(),
    });
    const c = t.copy() as Table;
    expect(c.getNumRows()).toBe(2);
    expect(c.getNumCols()).toBe(2);
  });

  it('copy without outer lines', () => {
    const t = new Table({
      data: [[entry(), entry()]],
      includeOuterLines: false,
    });
    const c = t.copy() as Table;
    expect(c.getNumRows()).toBe(1);
  });

  // ---- Miscellaneous ----
  it('is a VGroup', () => {
    const t = new Table({ data: [[entry()]] });
    expect(t).toBeInstanceOf(VGroup);
  });

  it('entries are added as children of the table', () => {
    const t = new Table({
      data: [
        [entry(), entry()],
        [entry(), entry()],
      ],
    });
    // Table should have children: entries group, hLines group, vLines group
    expect(t.children.length).toBeGreaterThanOrEqual(3);
  });

  it('different entry sizes are handled', () => {
    // Entries with different sizes
    const e1 = entry(1.0, 0.5);
    const e2 = entry(0.5, 1.0);
    const e3 = entry(0.3, 0.3);
    const e4 = entry(2.0, 2.0);
    const t = new Table({
      data: [
        [e1, e2],
        [e3, e4],
      ],
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(2);
  });
});

describe('MathTable', () => {
  it('constructs from string data', () => {
    const t = new MathTable({
      data: [
        ['x', 'y'],
        ['1', '2'],
      ],
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(2);
  });

  it('constructs with row and column labels', () => {
    const t = new MathTable({
      data: [
        ['1', '2'],
        ['3', '4'],
      ],
      rowLabels: ['R_1', 'R_2'],
      colLabels: ['C_1', 'C_2'],
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(2);
  });

  it('constructs with custom fontSize and color', () => {
    const t = new MathTable({
      data: [['x^2']],
      fontSize: 48,
      color: '#ff0000',
    });
    expect(t.getNumRows()).toBe(1);
    expect(t.getNumCols()).toBe(1);
  });

  it('is an instance of Table', () => {
    const t = new MathTable({ data: [['a']] });
    expect(t).toBeInstanceOf(Table);
  });

  it('constructs with includeOuterLines=false', () => {
    const t = new MathTable({
      data: [
        ['1', '2'],
        ['3', '4'],
      ],
      includeOuterLines: false,
    });
    expect(t.getNumRows()).toBe(2);
  });
});

describe('MobjectTable', () => {
  it('constructs with mobject data', () => {
    const t = new MobjectTable({
      data: [[entry(), entry()]],
    });
    expect(t.getNumRows()).toBe(1);
    expect(t.getNumCols()).toBe(2);
  });

  it('is an instance of Table', () => {
    const t = new MobjectTable({ data: [[entry()]] });
    expect(t).toBeInstanceOf(Table);
  });
});

describe('IntegerTable', () => {
  it('constructs from number data', () => {
    const t = new IntegerTable({
      data: [
        [1, 2, 3],
        [4, 5, 6],
      ],
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(3);
  });

  it('constructs with row and column labels', () => {
    const t = new IntegerTable({
      data: [
        [1, 2],
        [3, 4],
      ],
      rowLabels: [10, 20],
      colLabels: [100, 200],
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(2);
  });

  it('constructs with custom fontSize and color', () => {
    const t = new IntegerTable({
      data: [[42]],
      fontSize: 48,
      color: '#00ff00',
    });
    expect(t.getNumRows()).toBe(1);
    expect(t.getNumCols()).toBe(1);
  });

  it('is an instance of Table', () => {
    const t = new IntegerTable({ data: [[1]] });
    expect(t).toBeInstanceOf(Table);
  });
});

describe('DecimalTable', () => {
  it('constructs from decimal data', () => {
    const t = new DecimalTable({
      data: [
        [1.5, 2.75],
        [3.14, 0.01],
      ],
    });
    expect(t.getNumRows()).toBe(2);
    expect(t.getNumCols()).toBe(2);
  });

  it('constructs with row and column labels', () => {
    const t = new DecimalTable({
      data: [[1.1, 2.2]],
      rowLabels: [0.5],
      colLabels: [10.1, 20.2],
    });
    expect(t.getNumRows()).toBe(1);
    expect(t.getNumCols()).toBe(2);
  });

  it('constructs with custom numDecimalPlaces', () => {
    const t = new DecimalTable({
      data: [[3.14159]],
      numDecimalPlaces: 4,
    });
    expect(t.getNumRows()).toBe(1);
    expect(t.getNumCols()).toBe(1);
  });

  it('constructs with custom fontSize and color', () => {
    const t = new DecimalTable({
      data: [[1.0]],
      fontSize: 24,
      color: '#0000ff',
    });
    expect(t.getNumRows()).toBe(1);
  });

  it('is an instance of Table', () => {
    const t = new DecimalTable({ data: [[1.0]] });
    expect(t).toBeInstanceOf(Table);
  });
});
