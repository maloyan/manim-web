import { describe, it, expect } from 'vitest';
import { WaterfallChart } from './WaterfallChart';
import { VGroup } from '../../core/VGroup';
import { Rectangle } from '../geometry/Rectangle';
import { Line } from '../geometry/Line';
import { GREEN, RED, BLUE } from '../../constants/colors';

const DELTAS = [100, -40, 30, -20, 50];
const LABELS = ['Start', 'Q1', 'Q2', 'Q3', 'Q4'];

/** Cumulative sum of values[0..i-1] (running total before step i). */
function runningBefore(values: number[], i: number): number {
  let sum = 0;
  for (let k = 0; k < i; k++) sum += values[k];
  return sum;
}

describe('WaterfallChart', () => {
  it('builds one bar per delta', () => {
    const chart = new WaterfallChart({ values: DELTAS, labels: LABELS });
    expect(chart.getBars()).toBeInstanceOf(VGroup);
    expect(chart.getBars().children).toHaveLength(DELTAS.length);
  });

  it('exposes each bar as a Rectangle', () => {
    const chart = new WaterfallChart({ values: DELTAS });
    for (let i = 0; i < DELTAS.length; i++) {
      expect(chart.getBar(i)).toBeInstanceOf(Rectangle);
    }
  });

  it('starts bar i at the cumulative sum of 0..i-1 and spans its delta', () => {
    const chart = new WaterfallChart({ values: DELTAS });
    for (let i = 0; i < DELTAS.length; i++) {
      const start = runningBefore(DELTAS, i);
      const end = start + DELTAS[i];
      const bar = chart.getBar(i)!;
      const expectedTop = chart.valueToY(Math.max(start, end));
      const expectedBottom = chart.valueToY(Math.min(start, end));
      expect(bar.getTop()[1]).toBeCloseTo(expectedTop, 6);
      expect(bar.getBottom()[1]).toBeCloseTo(expectedBottom, 6);
    }
  });

  it('colors increases and decreases by sign', () => {
    const chart = new WaterfallChart({ values: DELTAS });
    // 100 up, -40 down, 30 up, -20 down, 50 up
    expect(chart.getBar(0)!.color.toUpperCase()).toBe(GREEN.toUpperCase());
    expect(chart.getBar(1)!.color.toUpperCase()).toBe(RED.toUpperCase());
    expect(chart.getBar(2)!.color.toUpperCase()).toBe(GREEN.toUpperCase());
    expect(chart.getBar(3)!.color.toUpperCase()).toBe(RED.toUpperCase());
    expect(chart.getBar(4)!.color.toUpperCase()).toBe(GREEN.toUpperCase());
  });

  it('supports configurable up/down colors', () => {
    const chart = new WaterfallChart({
      values: [5, -5],
      increaseColor: '#00ffff',
      decreaseColor: '#ff00ff',
    });
    expect(chart.getBar(0)!.color.toLowerCase()).toBe('#00ffff');
    expect(chart.getBar(1)!.color.toLowerCase()).toBe('#ff00ff');
  });

  it('appends a total bar spanning 0 to the sum when showTotal is set', () => {
    const chart = new WaterfallChart({ values: DELTAS, showTotal: true });
    expect(chart.getBars().children).toHaveLength(DELTAS.length + 1);
    const sum = DELTAS.reduce((a, b) => a + b, 0);
    const total = chart.getBar(DELTAS.length)!;
    expect(total.color.toUpperCase()).toBe(BLUE.toUpperCase());
    const expectedTop = chart.valueToY(Math.max(0, sum));
    const expectedBottom = chart.valueToY(Math.min(0, sum));
    expect(total.getTop()[1]).toBeCloseTo(expectedTop, 6);
    expect(total.getBottom()[1]).toBeCloseTo(expectedBottom, 6);
  });

  it('draws connectors between adjacent bars by default', () => {
    const chart = new WaterfallChart({ values: DELTAS });
    expect(chart.getConnectors()).toBeInstanceOf(VGroup);
    // one connector between each adjacent pair
    expect(chart.getConnectors().children).toHaveLength(DELTAS.length - 1);
    expect(chart.getConnectors().children[0]).toBeInstanceOf(Line);
  });

  it('omits connectors when showConnectors is false', () => {
    const chart = new WaterfallChart({ values: DELTAS, showConnectors: false });
    expect(chart.getConnectors().children).toHaveLength(0);
  });

  it('places the connector at the running-total level between two bars', () => {
    const chart = new WaterfallChart({ values: DELTAS });
    for (let i = 0; i < DELTAS.length - 1; i++) {
      const runningAfter = runningBefore(DELTAS, i + 1);
      const connector = chart.getConnectors().children[i] as Line;
      expect(connector.getStart()[1]).toBeCloseTo(chart.valueToY(runningAfter), 6);
      expect(connector.getEnd()[1]).toBeCloseTo(chart.valueToY(runningAfter), 6);
    }
  });

  it('handles a net-negative running total', () => {
    const chart = new WaterfallChart({ values: [10, -40], showTotal: true });
    const total = chart.getBar(2)!;
    const expectedTop = chart.valueToY(0);
    const expectedBottom = chart.valueToY(-30);
    expect(total.getTop()[1]).toBeCloseTo(expectedTop, 6);
    expect(total.getBottom()[1]).toBeCloseTo(expectedBottom, 6);
  });

  it('handles a single step without throwing', () => {
    expect(() => new WaterfallChart({ values: [42] })).not.toThrow();
    const chart = new WaterfallChart({ values: [42] });
    expect(chart.getBars().children).toHaveLength(1);
    expect(chart.getConnectors().children).toHaveLength(0);
  });

  it('handles an empty data set without throwing', () => {
    expect(() => new WaterfallChart({ values: [] })).not.toThrow();
    const chart = new WaterfallChart({ values: [] });
    expect(chart.getBars().children).toHaveLength(0);
    expect(chart.getConnectors().children).toHaveLength(0);
  });

  it('is copyable', () => {
    const chart = new WaterfallChart({ values: DELTAS, labels: LABELS, showTotal: true });
    const clone = chart.copy();
    expect(clone).toBeInstanceOf(WaterfallChart);
    expect(clone.getBars().children).toHaveLength(DELTAS.length + 1);
  });
});
