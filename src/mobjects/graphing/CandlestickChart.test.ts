import { describe, it, expect } from 'vitest';
import { CandlestickChart, type OHLC } from './CandlestickChart';
import { VGroup } from '../../core/VGroup';
import { Rectangle } from '../geometry/Rectangle';
import { Line } from '../geometry/Line';
import { GREEN, RED } from '../../constants/colors';

const SAMPLE: OHLC[] = [
  { open: 10, high: 15, low: 8, close: 14 }, // bullish
  { open: 14, high: 16, low: 11, close: 12 }, // bearish
  { open: 12, high: 20, low: 12, close: 18 }, // bullish
  { open: 18, high: 19, low: 9, close: 9 }, // bearish
];

describe('CandlestickChart', () => {
  it('builds one candle per data point', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    expect(chart.getCandles()).toHaveLength(SAMPLE.length);
  });

  it('exposes each candle as a VGroup of a body and a wick', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    for (let i = 0; i < SAMPLE.length; i++) {
      expect(chart.getCandle(i)).toBeInstanceOf(VGroup);
      expect(chart.getBody(i)).toBeInstanceOf(Rectangle);
      expect(chart.getWick(i)).toBeInstanceOf(Line);
    }
  });

  it('colors bullish candles (close >= open) with the bullish color', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    // index 0 and 2 are bullish
    expect(chart.getBody(0)!.color.toUpperCase()).toBe(GREEN.toUpperCase());
    expect(chart.getBody(2)!.color.toUpperCase()).toBe(GREEN.toUpperCase());
  });

  it('colors bearish candles (close < open) with the bearish color', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    // index 1 and 3 are bearish
    expect(chart.getBody(1)!.color.toUpperCase()).toBe(RED.toUpperCase());
    expect(chart.getBody(3)!.color.toUpperCase()).toBe(RED.toUpperCase());
  });

  it('supports configurable bullish/bearish colors', () => {
    const chart = new CandlestickChart({
      data: SAMPLE,
      bullishColor: '#00ffff',
      bearishColor: '#ff00ff',
    });
    expect(chart.getBody(0)!.color.toLowerCase()).toBe('#00ffff');
    expect(chart.getBody(1)!.color.toLowerCase()).toBe('#ff00ff');
  });

  it('treats close == open as bullish', () => {
    const chart = new CandlestickChart({ data: [{ open: 10, high: 12, low: 9, close: 10 }] });
    expect(chart.getBody(0)!.color.toUpperCase()).toBe(GREEN.toUpperCase());
  });

  it('spans the body from open to close in axis coordinates', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    for (let i = 0; i < SAMPLE.length; i++) {
      const { open, close } = SAMPLE[i];
      const body = chart.getBody(i)!;
      const topY = chart.priceToY(Math.max(open, close));
      const bottomY = chart.priceToY(Math.min(open, close));
      expect(body.getTop()[1]).toBeCloseTo(topY, 6);
      expect(body.getBottom()[1]).toBeCloseTo(bottomY, 6);
    }
  });

  it('spans the wick from low to high in axis coordinates', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    for (let i = 0; i < SAMPLE.length; i++) {
      const { high, low } = SAMPLE[i];
      const wick = chart.getWick(i)!;
      const ys = [wick.getStart()[1], wick.getEnd()[1]];
      expect(Math.min(...ys)).toBeCloseTo(chart.priceToY(low), 6);
      expect(Math.max(...ys)).toBeCloseTo(chart.priceToY(high), 6);
    }
  });

  it('aligns the body and wick on the same x-column', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    for (let i = 0; i < SAMPLE.length; i++) {
      const bodyX = chart.getBody(i)!.getCenter()[0];
      const wickX = chart.getWick(i)!.getStart()[0];
      expect(wickX).toBeCloseTo(bodyX, 6);
    }
  });

  it('auto-scales the y-range to cover the min low and max high', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    const minLow = Math.min(...SAMPLE.map((d) => d.low));
    const maxHigh = Math.max(...SAMPLE.map((d) => d.high));
    const [yMin, yMax] = chart.getYRange();
    expect(yMin).toBeLessThanOrEqual(minLow);
    expect(yMax).toBeGreaterThanOrEqual(maxHigh);
  });

  it('honors an explicit y-range', () => {
    const chart = new CandlestickChart({ data: SAMPLE, yRange: [0, 25, 5] });
    expect(chart.getYRange()).toEqual([0, 25, 5]);
  });

  it('gives a doji (open == close) a thin non-zero body', () => {
    const chart = new CandlestickChart({ data: [{ open: 10, high: 14, low: 7, close: 10 }] });
    const body = chart.getBody(0)!;
    expect(body.getHeight()).toBeGreaterThan(0);
    // still much thinner than the wick's low->high span
    const wick = chart.getWick(0)!;
    const span = Math.abs(wick.getEnd()[1] - wick.getStart()[1]);
    expect(body.getHeight()).toBeLessThan(span);
  });

  it('renders a single candle without error', () => {
    const chart = new CandlestickChart({ data: [{ open: 5, high: 9, low: 4, close: 8 }] });
    expect(chart.getCandles()).toHaveLength(1);
    expect(chart.getBody(0)).toBeInstanceOf(Rectangle);
  });

  it('handles empty data as an empty group without throwing', () => {
    expect(() => new CandlestickChart({ data: [] })).not.toThrow();
    const chart = new CandlestickChart({ data: [] });
    expect(chart.getCandles()).toHaveLength(0);
    expect(chart.getCandle(0)).toBeUndefined();
    expect(chart.getBody(0)).toBeUndefined();
    expect(chart.getWick(0)).toBeUndefined();
  });

  it('builds volume bars only when showVolume is set', () => {
    const data: OHLC[] = SAMPLE.map((d, i) => ({ ...d, volume: (i + 1) * 100 }));
    const without = new CandlestickChart({ data });
    expect(without.getVolumeBars()).toHaveLength(0);
    const withVol = new CandlestickChart({ data, showVolume: true });
    expect(withVol.getVolumeBars()).toHaveLength(data.length);
    for (const bar of withVol.getVolumeBars()) {
      expect(bar).toBeInstanceOf(Rectangle);
    }
  });

  it('returns undefined for out-of-range candle accessors', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    expect(chart.getCandle(99)).toBeUndefined();
    expect(chart.getBody(-1)).toBeUndefined();
    expect(chart.getWick(99)).toBeUndefined();
  });

  it('is an instance of VGroup so Create/FadeIn work on it', () => {
    const chart = new CandlestickChart({ data: SAMPLE });
    expect(chart).toBeInstanceOf(VGroup);
  });

  it('centers the chart on the origin so it stays inside the frame', () => {
    // Default frame is 14.222 wide by 8 tall (half-extents 7.111 and 4).
    // The chart is built in a bottom-left-origin frame, so without centering it
    // runs off the right/top edge. After centering its bbox sits on the origin.
    const chart = new CandlestickChart({ data: SAMPLE, showVolume: true, width: 8, height: 4.2 });
    const center = chart.getCenter();
    expect(center[0]).toBeCloseTo(0, 6);
    expect(center[1]).toBeCloseTo(0, 6);

    const { width, height } = chart.getBoundingBox();
    expect(width / 2).toBeLessThan(7.111);
    expect(height / 2).toBeLessThan(4);
  });

  it('keeps body positions consistent with priceToY after centering', () => {
    // Regression: centering must fold its shift into priceToY so accessors
    // still report the real on-screen y of each candle.
    const chart = new CandlestickChart({ data: SAMPLE, showVolume: true });
    for (let i = 0; i < SAMPLE.length; i++) {
      const { open, close } = SAMPLE[i];
      const body = chart.getBody(i)!;
      expect(body.getTop()[1]).toBeCloseTo(chart.priceToY(Math.max(open, close)), 6);
      expect(body.getBottom()[1]).toBeCloseTo(chart.priceToY(Math.min(open, close)), 6);
    }
  });
});
