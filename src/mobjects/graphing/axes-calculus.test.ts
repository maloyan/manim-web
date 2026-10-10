import { describe, it, expect } from 'vitest';
import { Axes } from './Axes';
import { VGroup } from '../../core/VGroup';
import {
  slopeOfTangent,
  angleOfTangent,
  getSecantSlopeGroup,
  getVerticalLinesToGraph,
} from './axes-calculus';

/** Square axes: one x-unit and one y-unit map to the same visual distance. */
function squareAxes(): Axes {
  return new Axes({
    xRange: [-5, 5, 1],
    yRange: [-5, 5, 1],
    xLength: 10,
    yLength: 10,
    tips: false,
  });
}

describe('axes-calculus: slopeOfTangent', () => {
  it('approximates the derivative of x^2 at x=2 (~4)', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x * x);
    expect(slopeOfTangent(2, graph)).toBeCloseTo(4, 2);
  });

  it('is exact for a linear function f(x)=3x+1 (slope 3 everywhere)', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => 3 * x + 1);
    for (const x of [-3, 0, 1.5, 4]) {
      expect(slopeOfTangent(x, graph)).toBeCloseTo(3, 10);
    }
  });

  it('is exposed as an Axes method with identical result', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x * x);
    expect(axes.slopeOfTangent(2, graph)).toBeCloseTo(slopeOfTangent(2, graph), 12);
  });
});

describe('axes-calculus: angleOfTangent', () => {
  it('is pi/4 on a 45-degree line with equal unit scaling', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x);
    expect(angleOfTangent(axes, 1, graph)).toBeCloseTo(Math.PI / 4, 6);
  });

  it('changes when the y-unit scale differs from the x-unit scale', () => {
    // y-unit is half the visual size of the x-unit, so a slope-1 line tilts less.
    const axes = new Axes({
      xRange: [-5, 5, 1],
      yRange: [-5, 5, 1],
      xLength: 10,
      yLength: 5,
      tips: false,
    });
    const graph = axes.plot((x) => x);
    const angle = angleOfTangent(axes, 1, graph);
    expect(angle).toBeCloseTo(Math.atan(0.5), 6);
    expect(angle).not.toBeCloseTo(Math.PI / 4, 3);
  });

  it('is exposed as an Axes method with identical result', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x);
    expect(axes.angleOfTangent(1, graph)).toBeCloseTo(angleOfTangent(axes, 1, graph), 12);
  });
});

describe('axes-calculus: getSecantSlopeGroup', () => {
  it('builds a VGroup with dx line, dy line, labels group, and secant line', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x * x);
    const group = getSecantSlopeGroup(axes, 1, graph, { dx: 0.5 });
    expect(group).toBeInstanceOf(VGroup);
    expect(group.children.length).toBe(4);
    expect(group.children[2]).toBeInstanceOf(VGroup); // labels group (empty here)
    expect((group.children[2] as VGroup).children.length).toBe(0);
  });

  it('places optional dx/dy labels inside the labels group', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x * x);
    const group = getSecantSlopeGroup(axes, 1, graph, { dx: 0.5, dxLabel: 'dx', dyLabel: 'dy' });
    const labels = group.children[2] as VGroup;
    expect(labels.children.length).toBe(2);
  });

  it('has dx-line endpoints equal to coordsToPoint at x and x+dx', () => {
    const axes = squareAxes();
    const f = (x: number) => x * x;
    const graph = axes.plot(f);
    const x = 1;
    const dx = 0.5;
    const group = getSecantSlopeGroup(axes, x, graph, { dx });
    const dxLine = group.children[0] as { getStart(): number[]; getEnd(): number[] };
    const p1 = axes.coordsToPoint(x, f(x));
    const p2 = axes.coordsToPoint(x + dx, f(x + dx));
    const start = dxLine.getStart();
    const end = dxLine.getEnd();
    expect(start[0]).toBeCloseTo(p1[0], 6);
    expect(start[1]).toBeCloseTo(p1[1], 6);
    expect(end[0]).toBeCloseTo(p2[0], 6); // horizontal run to x+dx
    expect(end[1]).toBeCloseTo(p1[1], 6); // dy line carries the rise
  });

  it('secant slope in coord-space equals slopeOfTangent at the same dx', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x * x);
    const x = 1;
    const dx = 0.5;
    const group = getSecantSlopeGroup(axes, x, graph, { dx });
    const secant = group.children[3] as { getStart(): number[]; getEnd(): number[] };
    const [cx1, cy1] = axes.pointToCoords(secant.getStart() as [number, number, number]);
    const [cx2, cy2] = axes.pointToCoords(secant.getEnd() as [number, number, number]);
    const secantSlope = (cy2 - cy1) / (cx2 - cx1);
    expect(secantSlope).toBeCloseTo(slopeOfTangent(x, graph, dx), 6);
  });

  it('is exposed as an Axes method', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x * x);
    const group = axes.getSecantSlopeGroup(1, graph, { dx: 0.5 });
    expect(group).toBeInstanceOf(VGroup);
    expect(group.children.length).toBe(4);
  });
});

describe('axes-calculus: getVerticalLinesToGraph', () => {
  it('creates exactly numLines vertical lines', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x * x);
    const group = getVerticalLinesToGraph(axes, graph, { xRange: [-2, 2], numLines: 5 });
    expect(group).toBeInstanceOf(VGroup);
    expect(group.children.length).toBe(5);
  });

  it('puts each line graph-side endpoint on getPointFromX', () => {
    const axes = squareAxes();
    const f = (x: number) => 0.5 * x * x;
    const graph = axes.plot(f);
    const numLines = 4;
    const xRange: [number, number] = [-2, 2];
    const group = getVerticalLinesToGraph(axes, graph, { xRange, numLines });
    const step = (xRange[1] - xRange[0]) / (numLines - 1);
    for (let i = 0; i < numLines; i++) {
      const x = xRange[0] + i * step;
      const expected = graph.getPointFromX(x);
      expect(expected).not.toBeNull();
      const line = group.children[i] as { getEnd(): number[] };
      const end = line.getEnd();
      expect(end[0]).toBeCloseTo(expected![0], 6);
      expect(end[1]).toBeCloseTo(expected![1], 6);
    }
  });

  it('is exposed as an Axes method', () => {
    const axes = squareAxes();
    const graph = axes.plot((x) => x * x);
    const group = axes.getVerticalLinesToGraph(graph, { xRange: [-2, 2], numLines: 3 });
    expect(group.children.length).toBe(3);
  });
});
