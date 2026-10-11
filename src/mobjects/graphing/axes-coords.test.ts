import { describe, it, expect } from 'vitest';
import { Axes } from './Axes';
import { VGroup } from '../../core/VGroup';

/** Square axes with no tips, so child counts are easy to reason about. */
function squareAxes(): Axes {
  return new Axes({
    xRange: [-5, 5, 1],
    yRange: [-3, 3, 1],
    xLength: 10,
    yLength: 6,
    tips: false,
  });
}

describe('Axes.addCoordinates', () => {
  it('adds a label per step value on each axis, excluding the origin', () => {
    const axes = squareAxes();
    axes.addCoordinates();
    // x: -5..5 (11) minus 0 = 10; y: -3..3 (7) minus 0 = 6
    expect(axes.getCoordinateNumberLabels().length).toBe(16);
  });

  it('is chainable (returns this)', () => {
    const axes = squareAxes();
    expect(axes.addCoordinates()).toBe(axes);
  });

  it('adds every label as a submobject of the axes', () => {
    const axes = squareAxes();
    const before = axes.children.length;
    axes.addCoordinates();
    expect(axes.children.length).toBe(before + 16);
    for (const label of axes.getCoordinateNumberLabels()) {
      expect(axes.children).toContain(label);
    }
  });

  it('honors explicit x and y values (still excluding 0)', () => {
    const axes = squareAxes();
    axes.addCoordinates([-2, 0, 3], [1, 2]);
    // x: -2, 3 (0 dropped) = 2; y: 1, 2 = 2
    expect(axes.getCoordinateNumberLabels().length).toBe(4);
  });

  it('places x labels below the x-axis and y labels left of the y-axis', () => {
    const axes = squareAxes();
    axes.addCoordinates([3], [2]);
    const labels = axes.getCoordinateNumberLabels();
    const xLabel = labels[0];
    const yLabel = labels[1];
    // x label sits at the visual x of 3, below the x-axis (y = 0 line here)
    expect(xLabel.position.x).toBeCloseTo((3 / 10 + 0.5 - 0.5) * 10, 6);
    expect(xLabel.position.y).toBeLessThan(0);
    // y label sits at the visual y of 2, left of the y-axis (x = 0 line here)
    expect(yLabel.position.x).toBeLessThan(0);
    expect(yLabel.position.y).toBeCloseTo(((2 + 3) / 6 - 0.5) * 6, 6);
  });
});

describe('Axes.getHorizontalLine', () => {
  it('spans from the y-axis across to the point, at the point y', () => {
    const axes = squareAxes();
    const point = axes.coordsToPoint(3, 2);
    const line = axes.getHorizontalLine(point) as unknown as {
      getStart(): number[];
      getEnd(): number[];
    };
    const yAxisX = axes.coordsToPoint(0, 0)[0];
    const start = line.getStart();
    const end = line.getEnd();
    expect(start[0]).toBeCloseTo(yAxisX, 6); // starts on the y-axis
    expect(start[1]).toBeCloseTo(point[1], 6); // at the point's y
    expect(end[0]).toBeCloseTo(point[0], 6); // ends at the point
    expect(end[1]).toBeCloseTo(point[1], 6); // horizontal: same y
  });
});

describe('Axes.getLinesToPoint', () => {
  it('returns a VGroup with exactly the vertical and horizontal lines', () => {
    const axes = squareAxes();
    const point = axes.coordsToPoint(3, 2);
    const group = axes.getLinesToPoint(point);
    expect(group).toBeInstanceOf(VGroup);
    expect(group.children.length).toBe(2);
  });

  it('child 0 is vertical (to the x-axis) and child 1 is horizontal (to the y-axis)', () => {
    const axes = squareAxes();
    const point = axes.coordsToPoint(3, 2);
    const group = axes.getLinesToPoint(point);
    const vertical = group.children[0] as unknown as { getStart(): number[]; getEnd(): number[] };
    const horizontal = group.children[1] as unknown as { getStart(): number[]; getEnd(): number[] };
    const origin = axes.coordsToPoint(0, 0);
    // vertical line drops to the x-axis y
    expect(vertical.getStart()[1]).toBeCloseTo(origin[1], 6);
    expect(vertical.getStart()[0]).toBeCloseTo(point[0], 6);
    // horizontal line starts at the y-axis x
    expect(horizontal.getStart()[0]).toBeCloseTo(origin[0], 6);
    expect(horizontal.getStart()[1]).toBeCloseTo(point[1], 6);
  });
});
