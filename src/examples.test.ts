/**
 * Unit tests derived from the working examples in examples/.
 * Each test suite exercises the same code paths as the corresponding example
 * but at the unit level—no DOM or Scene required.
 */
import { describe, it, expect } from 'vitest';
import { Axes } from './mobjects/graphing/Axes';
import { Line } from './mobjects/geometry/Line';
import { Dot } from './mobjects/geometry/Dot';
import { Polygon } from './mobjects/geometry/Polygon';
import { Angle } from './mobjects/geometry/AngleShapes';
import { ValueTracker } from './mobjects/value-tracker/ValueTracker';
import { VGroup } from './core/VGroup';
import { VMobject } from './core/VMobject';
import {
  BLUE,
  BLUE_C,
  GREEN,
  RED,
  YELLOW,
  YELLOW_B,
  YELLOW_D,
  GRAY,
  ORANGE,
  PINK,
} from './constants';
import { LEFT, RIGHT, ORIGIN, UP, Mobject } from './core/Mobject';
import { subVec, scaleVec } from './utils/vectors';
import { Group } from './core/Group';
import { Square } from './mobjects/geometry/Rectangle';
import {
  Union,
  Intersection,
  Difference,
  Exclusion,
  BooleanResult,
} from './mobjects/geometry/BooleanOperations';
import { Underline } from './mobjects/geometry/ShapeMatchers';
import { Ellipse } from './mobjects/geometry/ArcShapes';
import { DEFAULT_STROKE_WIDTH } from './constants';

// ---------------------------------------------------------------------------
// 1. Graph Area Plot
//    Exercises: Axes construction, plot(), getVerticalLine(), i2gp(),
//    inputToGraphPoint(), getRiemannRectangles(), getArea()
// ---------------------------------------------------------------------------
describe('Graph Area Plot', () => {
  const ax = new Axes({
    xRange: [0, 5],
    yRange: [0, 6],
    xAxisConfig: { numbersToInclude: [2, 3] },
    tips: false,
  });

  it('creates Axes with correct ranges', () => {
    expect(ax.xRange).toEqual([0, 5, 1]);
    expect(ax.yRange).toEqual([0, 6, 1]);
  });

  it('c2p and pointToCoords are inverse operations', () => {
    const point = ax.c2p(2, 3);
    const [x, y] = ax.pointToCoords(point);
    expect(x).toBeCloseTo(2, 5);
    expect(y).toBeCloseTo(3, 5);
  });

  it('plot() returns a FunctionGraph with correct function', () => {
    const curve = ax.plot((x) => 4 * x - x * x, { xRange: [0, 4], color: BLUE_C });
    expect(curve).toBeDefined();
    expect(curve.color).toBe(BLUE_C);
    const fn = curve.getFunction();
    expect(fn(0)).toBeCloseTo(0, 5);
    expect(fn(2)).toBeCloseTo(4, 5);
  });

  it('getVerticalLine() creates a line at the correct x position', () => {
    const curve = ax.plot((x) => 4 * x - x * x, { xRange: [0, 4], color: BLUE_C });
    const graphPoint = ax.inputToGraphPoint(2, curve);
    const vLine = ax.getVerticalLine(graphPoint, { color: YELLOW });
    expect(vLine).toBeDefined();
    expect(vLine.color).toBe(YELLOW);
  });

  it('i2gp returns the visual point on the graph for a given x', () => {
    const curve = ax.plot((x) => 4 * x - x * x, { xRange: [0, 4] });
    const point = ax.i2gp(2, curve);
    // f(2) = 4*2 - 4 = 4, so graph point should map back to (2, 4)
    const [gx, gy] = ax.pointToCoords(point);
    expect(gx).toBeCloseTo(2, 4);
    expect(gy).toBeCloseTo(4, 4);
  });

  it('getRiemannRectangles returns a non-empty VGroup', () => {
    const curve = ax.plot((x) => 4 * x - x * x, { xRange: [0, 4] });
    const rects = ax.getRiemannRectangles(curve, {
      xRange: [0.3, 0.6],
      dx: 0.03,
      color: BLUE,
      fillOpacity: 0.5,
    });
    expect(rects).toBeInstanceOf(VGroup);
    expect(rects.length).toBeGreaterThan(0);
  });

  it('getArea returns a VMobject', () => {
    const curve1 = ax.plot((x) => 4 * x - x * x, { xRange: [0, 4] });
    const curve2 = ax.plot((x) => 0.8 * x * x - 3 * x + 4, { xRange: [0, 4] });
    const area = ax.getArea(curve2, [2, 3], { boundedGraph: curve1, color: GRAY, opacity: 0.5 });
    expect(area).toBeInstanceOf(VMobject);
  });
});

// ---------------------------------------------------------------------------
// 2. Sin Cos Plot
//    Exercises: Axes with negative ranges, plot() with Math.sin/cos,
//    getGraphLabel(), getVerticalLine() with Line, VGroup
// ---------------------------------------------------------------------------
describe('Sin Cos Plot', () => {
  const axes = new Axes({
    xRange: [-10, 10.3, 1],
    yRange: [-1.5, 1.5, 1],
    xLength: 10,
    axisConfig: { color: GREEN },
    tips: false,
  });

  it('axes store correct ranges and lengths', () => {
    expect(axes.xRange[0]).toBe(-10);
    expect(axes.xRange[1]).toBe(10.3);
    expect(axes.getXLength()).toBe(10);
  });

  it('plot() with sin/cos produces graphs', () => {
    const sinGraph = axes.plot((x) => Math.sin(x), { color: BLUE });
    const cosGraph = axes.plot((x) => Math.cos(x), { color: RED });
    expect(sinGraph.getFunction()(0)).toBeCloseTo(0, 5);
    expect(cosGraph.getFunction()(0)).toBeCloseTo(1, 5);
    expect(sinGraph.getFunction()(Math.PI / 2)).toBeCloseTo(1, 5);
  });

  it('getGraphLabel() returns a MathTex positioned near the graph', () => {
    const sinGraph = axes.plot((x) => Math.sin(x), { color: BLUE });
    const label = axes.getGraphLabel(sinGraph, '\\sin(x)', {
      xVal: -10,
      direction: scaleVec(0.5, UP),
    });
    expect(label).toBeDefined();
  });

  it('getVerticalLine with Line constructor works', () => {
    const cosGraph = axes.plot((x) => Math.cos(x), { color: RED });
    const vLine = axes.getVerticalLine(axes.i2gp(2 * Math.PI, cosGraph), {
      color: YELLOW,
      lineFunc: Line,
    });
    expect(vLine).toBeDefined();
  });

  it('VGroup can hold axes, graphs, and labels', () => {
    const sinGraph = axes.plot((x) => Math.sin(x), { color: BLUE });
    const cosGraph = axes.plot((x) => Math.cos(x), { color: RED });
    const plot = new VGroup(axes, sinGraph, cosGraph);
    expect(plot.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 3. Moving Angle
//    Exercises: ValueTracker, Line, Angle from two lines, pointFromProportion(),
//    addUpdater(), animateTo()
// ---------------------------------------------------------------------------
describe('Moving Angle', () => {
  it('ValueTracker stores and updates values', () => {
    const tracker = new ValueTracker(110);
    expect(tracker.getValue()).toBe(110);
    tracker.setValue(40);
    expect(tracker.getValue()).toBe(40);
    tracker.incrementValue(10);
    expect(tracker.getValue()).toBe(50);
  });

  it('Line can be created with correct length and angle', () => {
    const line = new Line({ start: [-1, 0, 0], end: [1, 0, 0] });
    expect(line.getLength()).toBeCloseTo(2, 5);
    expect(line.getAngle()).toBeCloseTo(0, 5);
    expect(line.getMidpoint()[0]).toBeCloseTo(0, 5);
  });

  it('Angle between two lines computes correct angle value', () => {
    const line1 = new Line({ start: [-1, 0, 0], end: [1, 0, 0] });
    const line2 = new Line({ start: [-1, 0, 0], end: [0, 1, 0] });
    const angle = new Angle({ line1, line2 }, { radius: 0.5, otherAngle: false });
    // Angle from horizontal to 45°-ish line from LEFT
    expect(angle.getAngleValue()).toBeGreaterThan(0);
    expect(angle.getAngleValueDegrees()).toBeGreaterThan(0);
  });

  it('Angle.pointFromProportion returns points on the arc', () => {
    const line1 = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    const line2 = new Line({ start: [0, 0, 0], end: [0, 1, 0] });
    const angle = new Angle({ line1, line2 }, { radius: 1 });

    const start = angle.pointFromProportion(0);
    const end = angle.pointFromProportion(1);
    const mid = angle.pointFromProportion(0.5);

    // Start should be at (1, 0, 0) (radius=1 along x-axis)
    expect(start[0]).toBeCloseTo(1, 4);
    expect(start[1]).toBeCloseTo(0, 4);

    // End should be at (0, 1, 0) (radius=1 along y-axis)
    expect(end[0]).toBeCloseTo(0, 4);
    expect(end[1]).toBeCloseTo(1, 4);

    // Mid should be at 45° = (cos45, sin45) ≈ (0.707, 0.707)
    expect(mid[0]).toBeCloseTo(Math.cos(Math.PI / 4), 3);
    expect(mid[1]).toBeCloseTo(Math.sin(Math.PI / 4), 3);
  });

  it('animateTo creates an Animation object', () => {
    const tracker = new ValueTracker(110);
    const anim = tracker.animateTo(40);
    expect(anim).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Moving Frame Box
//    Exercises: SurroundingRectangle (indirectly via imports), VMobject become()
// ---------------------------------------------------------------------------
describe('Moving Frame Box', () => {
  it('VMobject.become copies geometry from another VMobject', () => {
    const line1 = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    const line2 = new Line({ start: [0, 0, 0], end: [0, 2, 0] });

    line1.become(line2);
    // After become, line1 should have the same position as line2
    expect(line1.position.x).toBeCloseTo(line2.position.x, 5);
    expect(line1.position.y).toBeCloseTo(line2.position.y, 5);
  });
});

// ---------------------------------------------------------------------------
// 5. Moving Dots
//    Exercises: Dot, VGroup.arrange(), Line from dot centers,
//    ValueTracker with setX/setY updaters
// ---------------------------------------------------------------------------
describe('Moving Dots', () => {
  it('Dot is created at origin by default', () => {
    const dot = new Dot();
    const center = dot.getCenter();
    expect(center[0]).toBeCloseTo(0, 5);
    expect(center[1]).toBeCloseTo(0, 5);
    expect(center[2]).toBeCloseTo(0, 5);
  });

  it('Dot can be created with color', () => {
    const d1 = new Dot({ color: BLUE });
    const d2 = new Dot({ color: GREEN });
    expect(d1.color).toBe(BLUE);
    expect(d2.color).toBe(GREEN);
  });

  it('VGroup.arrange positions children along a direction', () => {
    const d1 = new Dot({ color: BLUE });
    const d2 = new Dot({ color: GREEN });
    const group = new VGroup(d1, d2);
    group.arrange(RIGHT, 1);
    // After arrange, d2 should be to the right of d1
    expect(d2.getCenter()[0]).toBeGreaterThan(d1.getCenter()[0]);
  });

  it('Line can be created from dot centers', () => {
    const d1 = new Dot({ point: [-1, 0, 0] });
    const d2 = new Dot({ point: [1, 0, 0] });
    const line = new Line({ start: d1.getCenter(), end: d2.getCenter() });
    expect(line.getLength()).toBeCloseTo(2, 4);
  });

  it('ValueTracker + setX moves a dot horizontally', () => {
    const dot = new Dot();
    const tracker = new ValueTracker(0);
    // Simulate updater behavior
    dot.setX(tracker.getValue());
    expect(dot.getCenter()[0]).toBeCloseTo(0, 5);

    tracker.setValue(5);
    dot.setX(tracker.getValue());
    expect(dot.getCenter()[0]).toBeCloseTo(5, 5);
  });

  it('ValueTracker + setY moves a dot vertically', () => {
    const dot = new Dot();
    const tracker = new ValueTracker(0);
    dot.setY(tracker.getValue());
    expect(dot.getCenter()[1]).toBeCloseTo(0, 5);

    tracker.setValue(4);
    dot.setY(tracker.getValue());
    expect(dot.getCenter()[1]).toBeCloseTo(4, 5);
  });
});

// ---------------------------------------------------------------------------
// 6. Moving Group To Destination
//    Exercises: VGroup with multiple Dots, scale(), getCenter(),
//    Dot point options, subVec for shift direction
// ---------------------------------------------------------------------------
describe('Moving Group To Destination', () => {
  it('VGroup of dots has center at their average', () => {
    const group = new VGroup(
      new Dot({ point: LEFT }),
      new Dot({ point: ORIGIN }),
      new Dot({ point: RIGHT }),
      new Dot({ point: scaleVec(2, RIGHT) }),
    );
    const center = group.getCenter();
    // Average of [-1,0,0], [0,0,0], [1,0,0], [2,0,0] = [0.5, 0, 0]
    expect(center[0]).toBeCloseTo(0.5, 4);
    expect(center[1]).toBeCloseTo(0, 4);
  });

  it('VGroup.scale scales children about group center', () => {
    const d1 = new Dot({ point: [-1, 0, 0] });
    const d2 = new Dot({ point: [1, 0, 0] });
    const group = new VGroup(d1, d2);
    const centerBefore = group.getCenter();
    group.scale(2);
    const centerAfter = group.getCenter();
    // Center should remain roughly the same
    expect(centerAfter[0]).toBeCloseTo(centerBefore[0], 3);
    expect(centerAfter[1]).toBeCloseTo(centerBefore[1], 3);
    // Spread should double
    const spread = d2.getCenter()[0] - d1.getCenter()[0];
    expect(spread).toBeCloseTo(4, 3);
  });

  it('subVec computes direction from one point to another', () => {
    const dest: [number, number, number] = [4, 3, 0];
    const src: [number, number, number] = [1, 0, 0];
    const dir = subVec(dest, src);
    expect(dir[0]).toBeCloseTo(3, 5);
    expect(dir[1]).toBeCloseTo(3, 5);
    expect(dir[2]).toBeCloseTo(0, 5);
  });

  it('VGroup.get(index) retrieves the correct child', () => {
    const d0 = new Dot({ point: LEFT });
    const d1 = new Dot({ point: ORIGIN });
    const d2 = new Dot({ point: RIGHT, color: RED });
    const group = new VGroup(d0, d1, d2);
    expect(group.get(2)?.color).toBe(RED);
  });
});

// ---------------------------------------------------------------------------
// 7. Point With Trace
//    Exercises: VMobject path building (setPointsAsCorners, addPointsAsCorners),
//    Dot, addUpdater, copy(), become()
// ---------------------------------------------------------------------------
describe('Point With Trace', () => {
  it('VMobject.setPointsAsCorners creates a path from corners', () => {
    const path = new VMobject();
    path.setPointsAsCorners([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('VMobject.addPointsAsCorners extends the path', () => {
    const path = new VMobject();
    path.setPointsAsCorners([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const countBefore = path.numPoints;
    path.addPointsAsCorners([[2, 1, 0]]);
    expect(path.numPoints).toBeGreaterThan(countBefore);
  });

  it('Dot.getCenter updates after moveTo', () => {
    const dot = new Dot();
    expect(dot.getCenter()).toEqual([0, 0, 0]);
    dot.moveTo([3, 4, 0]);
    expect(dot.getCenter()[0]).toBeCloseTo(3, 5);
    expect(dot.getCenter()[1]).toBeCloseTo(4, 5);
  });

  it('VMobject.copy creates an independent copy', () => {
    const path = new VMobject();
    path.setPointsAsCorners([
      [0, 0, 0],
      [1, 1, 0],
    ]);
    const copy = path.copy() as VMobject;
    expect(copy.numPoints).toBe(path.numPoints);
  });

  it('addUpdater registers an updater function', () => {
    const dot = new Dot();
    let called = false;
    dot.addUpdater(() => {
      called = true;
    }, true);
    expect(called).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Rotation Updater
//    Exercises: Line, rotateAboutOrigin, addUpdater/removeUpdater with dt
// ---------------------------------------------------------------------------
describe('Rotation Updater', () => {
  it('Line.rotateAboutOrigin transforms the line points', () => {
    const line = new Line({ start: [0, 0, 0], end: [-1, 0, 0] });
    // Before rotation: end is at (-1, 0, 0), angle is PI
    const endBefore = line.getEnd();
    expect(endBefore[0]).toBeCloseTo(-1, 3);
    expect(endBefore[1]).toBeCloseTo(0, 3);

    line.rotateAboutOrigin(Math.PI / 2);
    // After 90° CCW rotation: (-1, 0) -> (0, -1)
    const endAfter = line.getEnd();
    expect(endAfter[0]).toBeCloseTo(0, 3);
    expect(endAfter[1]).toBeCloseTo(-1, 3);
  });

  it('addUpdater and removeUpdater manage updater list', () => {
    const line = new Line({ start: ORIGIN, end: LEFT });
    const updater = (mobj: Mobject, dt: number) => {
      mobj.rotateAboutOrigin(dt);
    };
    line.addUpdater(updater);
    // Verify updater is registered
    expect(line['_updaters']).toContain(updater);

    line.removeUpdater(updater);
    expect(line['_updaters']).not.toContain(updater);
  });

  it('Line.setColor changes the line color', () => {
    const line = new Line({ start: ORIGIN, end: LEFT });
    line.setColor(YELLOW);
    expect(line.color).toBe(YELLOW);
  });
});

// ---------------------------------------------------------------------------
// 9. Heat Diagram Plot
//    Exercises: Axes with custom ranges/lengths, plotLineGraph(), getAxisLabels()
// ---------------------------------------------------------------------------
describe('Heat Diagram Plot', () => {
  const ax = new Axes({
    xRange: [0, 40, 5],
    yRange: [-8, 32, 5],
    xLength: 9,
    yLength: 6,
    xAxisConfig: { numbersToInclude: [0, 5, 10, 15, 20, 25, 30, 35] },
    yAxisConfig: { numbersToInclude: [-5, 0, 5, 10, 15, 20, 25, 30] },
    tips: false,
  });

  it('axes have the correct dimensions', () => {
    expect(ax.getXLength()).toBe(9);
    expect(ax.getYLength()).toBe(6);
    expect(ax.xRange).toEqual([0, 40, 5]);
    expect(ax.yRange).toEqual([-8, 32, 5]);
  });

  it('plotLineGraph creates a VDict with lines and dots', () => {
    const xVals = [0, 8, 38, 39];
    const yVals = [20, 0, 0, -5];
    const graph = ax.plotLineGraph({ xValues: xVals, yValues: yVals });
    expect(graph).toBeDefined();
  });

  it('getAxisLabels returns a Group', () => {
    const labels = ax.getAxisLabels();
    expect(labels).toBeDefined();
  });

  it('c2p maps boundary values correctly', () => {
    // Origin of graph space
    const origin = ax.c2p(0, 0);
    // The point (0, 0) should be in the lower-left area
    const topRight = ax.c2p(40, 32);
    expect(topRight[0]).toBeGreaterThan(origin[0]);
    expect(topRight[1]).toBeGreaterThan(origin[1]);
  });
});

// ---------------------------------------------------------------------------
// 10. Polygon On Axes
//     Exercises: Axes, plot(), ValueTracker, Polygon construction with c2p
//     vertices, addUpdater + become pattern, Dot.moveTo
// ---------------------------------------------------------------------------
describe('Polygon On Axes', () => {
  const ax = new Axes({
    xRange: [0, 10],
    yRange: [0, 10],
    xLength: 6,
    yLength: 6,
    tips: false,
  });
  const k = 25;

  function getRectangleCorners(bottomLeft: number[], topRight: number[]) {
    return [
      [topRight[0], topRight[1]],
      [bottomLeft[0], topRight[1]],
      [bottomLeft[0], bottomLeft[1]],
      [topRight[0], bottomLeft[1]],
    ];
  }

  it('plot() graphs the hyperbola k/x', () => {
    const graph = ax.plot((x) => k / x, { color: YELLOW_D, xRange: [k / 10, 10.0] });
    const fn = graph.getFunction();
    expect(fn(5)).toBeCloseTo(5, 5);
    expect(fn(1)).toBeCloseTo(25, 5);
  });

  it('Polygon is constructed from c2p-mapped vertices', () => {
    const t = 5;
    const corners = getRectangleCorners([0, 0], [t, k / t]);
    const vertices = corners.map(([x, y]) => ax.c2p(x, y));
    const polygon = new Polygon({
      vertices: vertices as [number, number, number][],
      strokeWidth: 1,
      color: YELLOW_B,
      fillOpacity: 0.5,
    });
    expect(polygon.getVertices().length).toBe(4);
    expect(polygon.color).toBe(YELLOW_B);
  });

  it('Polygon.become replaces geometry', () => {
    const poly1 = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    });
    const poly2 = new Polygon({
      vertices: [
        [0, 0, 0],
        [2, 0, 0],
        [2, 2, 0],
        [0, 2, 0],
      ],
    });
    poly1.become(poly2);
    expect(poly1.position.x).toBeCloseTo(poly2.position.x, 5);
  });

  it('Dot.moveTo repositions to c2p coordinates', () => {
    const dot = new Dot();
    const target = ax.c2p(5, 5);
    dot.moveTo(target);
    expect(dot.getCenter()[0]).toBeCloseTo(target[0], 4);
    expect(dot.getCenter()[1]).toBeCloseTo(target[1], 4);
  });

  it('ValueTracker drives polygon updates', () => {
    const t = new ValueTracker(5);
    expect(t.getValue()).toBe(5);

    t.setValue(10);
    const corners = getRectangleCorners([0, 0], [t.getValue(), k / t.getValue()]);
    expect(corners[0][0]).toBe(10);
    expect(corners[0][1]).toBeCloseTo(2.5, 5);

    t.setValue(k / 10);
    expect(t.getValue()).toBeCloseTo(2.5, 5);
  });
});

// ---------------------------------------------------------------------------
// 11. Boolean Operations
//     Exercises: Union, Intersection, Difference, Exclusion, BooleanResult,
//     Group positioning (shift/moveTo/getCenter), generateTarget
// ---------------------------------------------------------------------------
describe('Boolean Operations', () => {
  // Create two overlapping squares for reliable boolean ops
  const sq1 = new Square({ sideLength: 2 });
  const sq2 = new Square({ sideLength: 2 }).shift([1, 0, 0]);

  it('Intersection produces a shape with points', () => {
    const i = new Intersection(sq1, sq2, { color: GREEN, fillOpacity: 0.5 });
    const pts = i.getPoints();
    expect(pts.length).toBeGreaterThan(0);
  });

  it('Intersection inherits color and fillOpacity', () => {
    const i = new Intersection(sq1, sq2, { color: GREEN, fillOpacity: 0.7 });
    expect(i.color).toBe(GREEN);
    expect(i.fillOpacity).toBe(0.7);
  });

  it('Intersection result vertices are within both shapes', () => {
    const i = new Intersection(sq1, sq2, { color: GREEN });
    const verts = i.getResultVertices();
    expect(verts.length).toBeGreaterThan(0);
    // The intersection of sq1 (center 0,0 side 2) and sq2 (center 1,0 side 2)
    // should be a rectangle from x=0 to x=1, y=-1 to y=1
    for (const poly of verts) {
      for (const v of poly) {
        expect(v.x).toBeGreaterThanOrEqual(-0.01);
        expect(v.x).toBeLessThanOrEqual(1.01);
        expect(v.y).toBeGreaterThanOrEqual(-1.01);
        expect(v.y).toBeLessThanOrEqual(1.01);
      }
    }
  });

  it('Union produces a shape larger than either input', () => {
    const u = new Union(sq1, sq2, { color: ORANGE, fillOpacity: 0.5 });
    const pts = u.getPoints();
    expect(pts.length).toBeGreaterThan(0);
    const verts = u.getResultVertices();
    expect(verts.length).toBeGreaterThan(0);
    // Union vertices should span from x=-1 to x=2
    const allX = verts.flat().map((v) => v.x);
    expect(Math.min(...allX)).toBeCloseTo(-1, 0);
    expect(Math.max(...allX)).toBeCloseTo(2, 0);
  });

  it('Difference subtracts second shape from first', () => {
    const d = new Difference(sq1, sq2, { color: PINK, fillOpacity: 0.5 });
    const pts = d.getPoints();
    expect(pts.length).toBeGreaterThan(0);
    const verts = d.getResultVertices();
    expect(verts.length).toBeGreaterThan(0);
    // Difference should only have vertices in the left part (x < 0)
    // of sq1 that doesn't overlap with sq2
    const allX = verts.flat().map((v) => v.x);
    expect(Math.min(...allX)).toBeCloseTo(-1, 0);
    // Max x should be near 0 (the left edge of sq2)
    expect(Math.max(...allX)).toBeCloseTo(0, 0);
  });

  it('Exclusion produces XOR of two shapes', () => {
    const e = new Exclusion(sq1, sq2, { color: YELLOW, fillOpacity: 0.5 });
    const pts = e.getPoints();
    expect(pts.length).toBeGreaterThan(0);
    const verts = e.getResultVertices();
    // XOR of two overlapping squares should produce two separate regions
    expect(verts.length).toBeGreaterThanOrEqual(1);
  });

  it('BooleanResult extends VMobject', () => {
    const i = new Intersection(sq1, sq2);
    expect(i).toBeInstanceOf(VMobject);
    expect(i).toBeInstanceOf(BooleanResult);
  });

  it('defaults to shape1 styling when no options given', () => {
    const s1 = new Square({ sideLength: 2, color: RED });
    s1.fillOpacity = 0.8;
    s1.strokeWidth = 5;
    const s2 = new Square({ sideLength: 2 }).shift([0.5, 0, 0]);
    const u = new Union(s1, s2);
    expect(u.color).toBe(RED);
    expect(u.fillOpacity).toBe(0.8);
    // Boolean operations use DEFAULT_STROKE_WIDTH (4), not input shape's strokeWidth
    // This matches Python Manim behavior where BooleanOps inherit VMobject defaults
    expect(u.strokeWidth).toBe(4);
  });

  it('non-overlapping shapes produce empty intersection', () => {
    const s1 = new Square({ sideLength: 1 }).moveTo([-5, 0, 0]);
    const s2 = new Square({ sideLength: 1 }).moveTo([5, 0, 0]);
    const i = new Intersection(s1, s2);
    // No overlap → no result vertices
    expect(i.getResultVertices().length).toBe(0);
    expect(i.getPoints().length).toBe(0);
  });

  it('generateTarget creates a copy for MoveToTarget', () => {
    const i = new Intersection(sq1, sq2, { color: GREEN });
    const target = i.generateTarget();
    expect(target).toBeDefined();
    expect(i.targetCopy).toBe(target);
    // Target should be independent
    target.moveTo([5, 5, 0]);
    const origCenter = i.getCenter();
    const targetCenter = target.getCenter();
    expect(targetCenter[0]).not.toBeCloseTo(origCenter[0], 0);
  });

  it('copy creates independent BooleanResult', () => {
    const i = new Intersection(sq1, sq2, { color: GREEN });
    const copy = i.copy();
    copy.shift([10, 0, 0]);
    // Original should not have moved
    const origCenter = i.getCenter();
    const copyCenter = copy.getCenter();
    expect(Math.abs(copyCenter[0] - origCenter[0])).toBeGreaterThan(5);
  });

  it('all boolean ops default to DEFAULT_STROKE_WIDTH', () => {
    const s1 = new Square({ sideLength: 2, color: RED });
    s1.strokeWidth = 10;
    const s2 = new Square({ sideLength: 2 }).shift([0.5, 0, 0]);
    expect(new Union(s1, s2).strokeWidth).toBe(DEFAULT_STROKE_WIDTH);
    expect(new Intersection(s1, s2).strokeWidth).toBe(DEFAULT_STROKE_WIDTH);
    expect(new Difference(s1, s2).strokeWidth).toBe(DEFAULT_STROKE_WIDTH);
    expect(new Exclusion(s1, s2).strokeWidth).toBe(DEFAULT_STROKE_WIDTH);
  });

  it('boolean ops accept explicit strokeWidth override', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2 }).shift([0.5, 0, 0]);
    const u = new Union(s1, s2, { strokeWidth: 1.2 });
    expect(u.strokeWidth).toBe(1.2);
  });

  it('setStrokeWidth works on boolean results', () => {
    const s1 = new Square({ sideLength: 2 });
    const s2 = new Square({ sideLength: 2 }).shift([0.5, 0, 0]);
    const i = new Intersection(s1, s2, { color: GREEN });
    i.setStrokeWidth(1);
    expect(i.strokeWidth).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 11b. Underline positioning
//      Exercises: Underline buff, negative buff for tight text underlines
// ---------------------------------------------------------------------------
describe('Underline', () => {
  it('creates a line below a mobject', () => {
    const sq = new Square({ sideLength: 2 });
    const ul = new Underline(sq);
    const pts = ul.getPoints();
    expect(pts.length).toBeGreaterThan(0);
  });

  it('negative buff moves line closer to mobject than positive buff', () => {
    const sq = new Square({ sideLength: 2 });
    const ulFar = new Underline(sq, { buff: 0.2 });
    const ulClose = new Underline(sq, { buff: -0.25 });
    const farY = ulFar.getPoints()[0][1];
    const closeY = ulClose.getPoints()[0][1];
    // Negative buff → line higher (closer to mobject center)
    expect(closeY).toBeGreaterThan(farY);
    // Difference should match buff difference (0.45)
    expect(closeY - farY).toBeCloseTo(0.45, 1);
  });

  it('spans the width of the target mobject', () => {
    const sq = new Square({ sideLength: 4 });
    const ul = new Underline(sq, { buff: 0 });
    const pts = ul.getPoints();
    const startX = pts[0][0];
    const endX = pts[pts.length - 1][0];
    // Line should roughly span the square's width (± stroke padding)
    expect(endX - startX).toBeGreaterThan(3.5);
    expect(endX - startX).toBeLessThan(5);
    // Symmetric around center
    expect(Math.abs(startX + endX)).toBeLessThan(0.5);
  });
});

// ---------------------------------------------------------------------------
// 11c. Ellipse construction for Boolean Operations example
// ---------------------------------------------------------------------------
describe('Ellipse for boolean ops', () => {
  it('accepts explicit strokeWidth', () => {
    const e = new Ellipse({ width: 4, height: 5, strokeWidth: 2 });
    expect(e.strokeWidth).toBe(2);
  });

  it('copy preserves strokeWidth', () => {
    const e1 = new Ellipse({ width: 4, height: 5, strokeWidth: 2 });
    const e2 = e1.copy();
    expect(e2.strokeWidth).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 12. Group positioning
//     Exercises: Group.shift, Group.moveTo, Group.getCenter
//     (fixes the double-counting bug)
// ---------------------------------------------------------------------------
describe('Group positioning', () => {
  it('getCenter returns average of children centers', () => {
    const d1 = new Dot({ point: [-2, 0, 0] });
    const d2 = new Dot({ point: [2, 0, 0] });
    const g = new Group(d1, d2);
    const center = g.getCenter();
    expect(center[0]).toBeCloseTo(0, 1);
    expect(center[1]).toBeCloseTo(0, 1);
  });

  it('moveTo positions group center at target', () => {
    const d1 = new Dot({ point: [0, 0, 0] });
    const d2 = new Dot({ point: [2, 0, 0] });
    const g = new Group(d1, d2);
    g.moveTo([5, 3, 0]);
    const center = g.getCenter();
    expect(center[0]).toBeCloseTo(5, 1);
    expect(center[1]).toBeCloseTo(3, 1);
  });

  it('shift moves group center by delta', () => {
    const d1 = new Dot({ point: [0, 0, 0] });
    const d2 = new Dot({ point: [2, 0, 0] });
    const g = new Group(d1, d2);
    const before = g.getCenter();
    g.shift([3, -1, 0]);
    const after = g.getCenter();
    expect(after[0]).toBeCloseTo(before[0] + 3, 1);
    expect(after[1]).toBeCloseTo(before[1] - 1, 1);
  });

  it('moveTo then getCenter is consistent (no double-counting)', () => {
    const d1 = new Dot({ point: [-1, 0, 0] });
    const d2 = new Dot({ point: [1, 0, 0] });
    const g = new Group(d1, d2);
    g.moveTo([-3, 0, 0]);
    const center = g.getCenter();
    // After moveTo([-3,0,0]), center should be at (-3,0,0)
    expect(center[0]).toBeCloseTo(-3, 1);
    expect(center[1]).toBeCloseTo(0, 1);
    // Children should be at -4 and -2
    expect(d1.getCenter()[0]).toBeCloseTo(-4, 1);
    expect(d2.getCenter()[0]).toBeCloseTo(-2, 1);
  });

  it('multiple shifts accumulate correctly', () => {
    const d1 = new Dot({ point: [0, 0, 0] });
    const d2 = new Dot({ point: [2, 0, 0] });
    const g = new Group(d1, d2);
    g.shift([1, 0, 0]);
    g.shift([1, 0, 0]);
    g.shift([1, 0, 0]);
    const center = g.getCenter();
    // Initial center was (1, 0), after 3 shifts of +1 → (4, 0)
    expect(center[0]).toBeCloseTo(4, 1);
  });

  it('moveTo after moveTo works correctly', () => {
    const d1 = new Dot({ point: [0, 0, 0] });
    const d2 = new Dot({ point: [2, 0, 0] });
    const g = new Group(d1, d2);
    g.moveTo([5, 0, 0]);
    g.moveTo([-5, 0, 0]);
    const center = g.getCenter();
    expect(center[0]).toBeCloseTo(-5, 1);
  });
});
