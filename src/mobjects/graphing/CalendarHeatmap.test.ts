import { describe, it, expect } from 'vitest';
import { CalendarHeatmap, GITHUB_GREENS } from './CalendarHeatmap';
import { valueToColor } from './colormap';
import { Rectangle } from '../geometry/Rectangle';

describe('CalendarHeatmap', () => {
  it('maps each date to the right (week, weekday) cell', () => {
    // 2024-01-01 is a Monday; with a Sunday week start the grid begins
    // on 2023-12-31 (Sunday), so Jan 1 sits in week 0, weekday 1.
    const chart = new CalendarHeatmap({
      data: [
        { date: '2024-01-01', value: 3 },
        { date: '2024-01-07', value: 5 },
        { date: '2024-01-08', value: 7 },
      ],
    });
    expect(chart.cellPosition('2024-01-01')).toEqual({ week: 0, weekday: 1 });
    expect(chart.cellPosition('2024-01-07')).toEqual({ week: 1, weekday: 0 });
    expect(chart.cellPosition('2024-01-08')).toEqual({ week: 1, weekday: 1 });
  });

  it('colors each day by its value through the colormap', () => {
    const chart = new CalendarHeatmap({
      data: [
        { date: '2024-01-01', value: 3 },
        { date: '2024-01-08', value: 7 },
      ],
    });
    const [lo, hi] = chart.getDomain();
    const low = chart.getCell('2024-01-01') as Rectangle;
    const high = chart.getCell('2024-01-08') as Rectangle;
    expect(low.color).toBe(valueToColor(3, lo, hi, GITHUB_GREENS));
    expect(high.color).toBe(valueToColor(7, lo, hi, GITHUB_GREENS));
    expect(chart.colorForValue(3)).toBe(valueToColor(3, lo, hi, GITHUB_GREENS));
  });

  it('uses the empty color for days with no datum', () => {
    const chart = new CalendarHeatmap({
      data: [
        { date: '2024-01-01', value: 3 },
        { date: '2024-01-05', value: 9 },
      ],
      emptyColor: '#ebedf0',
    });
    const blank = chart.getCell('2024-01-03') as Rectangle;
    expect(blank.color.toLowerCase()).toBe('#ebedf0');
  });

  it('positions cells on a weeks-by-weekdays grid', () => {
    const chart = new CalendarHeatmap({
      data: [{ date: '2024-01-01', value: 1 }],
      cellSize: 0.3,
      cellGap: 0.06,
    });
    const cell = chart.getCell('2024-01-01') as Rectangle;
    const pitch = 0.36;
    const center = cell.getRectCenter();
    // week 0, weekday 1 -> x = 0, y = -pitch.
    expect(center[0]).toBeCloseTo(0, 9);
    expect(center[1]).toBeCloseTo(-pitch, 9);
  });

  it('draws month labels', () => {
    const data = [];
    for (let d = 1; d <= 28; d++) {
      const day = `${d}`.padStart(2, '0');
      data.push({ date: `2024-01-${day}`, value: d });
      data.push({ date: `2024-02-${day}`, value: d });
    }
    const chart = new CalendarHeatmap({ data });
    expect(chart.monthLabels.children.length).toBeGreaterThanOrEqual(2);
  });

  it('fills every day in the range, not only the dated ones', () => {
    const chart = new CalendarHeatmap({
      data: [
        { date: '2024-01-01', value: 3 },
        { date: '2024-01-08', value: 7 },
      ],
    });
    // Grid starts 2023-12-31 (Sun) and ends 2024-01-08: 9 days inclusive.
    expect(chart.getNumCells()).toBe(9);
  });

  it('honors a Monday week start', () => {
    const chart = new CalendarHeatmap({
      data: [{ date: '2024-01-01', value: 1 }],
      weekStartsOn: 1,
    });
    // Monday is weekday 0 when the week starts on Monday.
    expect(chart.cellPosition('2024-01-01')).toEqual({ week: 0, weekday: 0 });
  });

  it('does not throw on empty data', () => {
    const chart = new CalendarHeatmap({ data: [] });
    expect(chart.getNumCells()).toBe(0);
    expect(chart.cells.children).toHaveLength(0);
  });

  it('does not throw when all values are equal', () => {
    const chart = new CalendarHeatmap({
      data: [
        { date: '2024-03-01', value: 5 },
        { date: '2024-03-02', value: 5 },
      ],
    });
    const [lo, hi] = chart.getDomain();
    expect(hi).toBeGreaterThan(lo);
    expect(() => chart.colorForValue(5)).not.toThrow();
  });

  it('copies independently', () => {
    const chart = new CalendarHeatmap({
      data: [
        { date: '2024-01-01', value: 3 },
        { date: '2024-01-08', value: 7 },
      ],
    });
    const clone = chart.copy();
    expect(clone.getNumCells()).toBe(chart.getNumCells());
    expect(clone.cellPosition('2024-01-08')).toEqual(chart.cellPosition('2024-01-08'));
    expect(clone).not.toBe(chart);
  });
});
