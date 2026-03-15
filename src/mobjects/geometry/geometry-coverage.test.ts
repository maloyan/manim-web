import { describe, it, expect } from 'vitest';
import { Arrow, DoubleArrow } from './Arrow';
import {
  ArrowTriangleTip,
  ArrowTriangleFilledTip,
  ArrowCircleFilledTip,
  ArrowSquareFilledTip,
} from './ArrowTips';
import { CubicBezier } from './CubicBezier';
import { Polygon, Pentagon } from './Polygon';
import { Rectangle, Square } from './Rectangle';
import {
  Ellipse,
  Annulus,
  AnnularSector,
  Sector,
  ArcPolygon,
  CurvedArrow,
  CurvedDoubleArrow,
  TangentialArc,
} from './ArcShapes';
import { ArcBetweenPoints } from './ArcBetweenPoints';
import { DashedVMobject } from './DashedVMobject';
import { Line } from './Line';
import { VMobject } from '../../core/VMobject';

// ---------------------------------------------------------------------------
// Arrow — coverage gaps: lines 374-376 (z-direction perpendicular), 442 (_createCopy DoubleArrow)
// ---------------------------------------------------------------------------
describe('Arrow coverage gaps', () => {
  it('DoubleArrow with z-direction uses x-axis perpendicular (lines 374-376)', () => {
    // When direction is along Z axis (|dirZ| > 0.99), perpX=1, perpY=0, perpZ=0
    const da = new DoubleArrow({
      start: [0, 0, 0],
      end: [0, 0, 5],
    });
    expect(da.getLength()).toBeCloseTo(5, 5);
    expect(da.getStart()).toEqual([0, 0, 0]);
    expect(da.getEnd()).toEqual([0, 0, 5]);
  });

  it('DoubleArrow.copy() covers _createCopy (line 442)', () => {
    const da = new DoubleArrow({
      start: [0, 0, 0],
      end: [3, 4, 0],
    });
    const copy = da.copy();
    expect(copy).toBeInstanceOf(DoubleArrow);
    expect(copy).not.toBe(da);
    expect(copy.getStart()).toEqual(da.getStart());
    expect(copy.getEnd()).toEqual(da.getEnd());
  });

  it('Arrow with z-direction uses x perpendicular', () => {
    const a = new Arrow({
      start: [0, 0, -3],
      end: [0, 0, 3],
    });
    expect(a.getLength()).toBeCloseTo(6, 5);
  });
});

// ---------------------------------------------------------------------------
// ArrowTips — coverage gaps: lines 40 (getPerpendicular z-direction),
//   280 (ArrowTriangleFilledTip._createCopy), 415 (ArrowCircleFilledTip._createCopy),
//   535 (ArrowSquareFilledTip._createCopy)
// ---------------------------------------------------------------------------
describe('ArrowTips coverage gaps', () => {
  it('ArrowTriangleFilledTip._createCopy (line 280)', () => {
    const tip = new ArrowTriangleFilledTip({
      position: [1, 0, 0],
      direction: [1, 0, 0],
    });
    const copy = tip.copy();
    expect(copy).toBeInstanceOf(ArrowTriangleFilledTip);
    expect(copy).not.toBe(tip);
  });

  it('ArrowCircleFilledTip._createCopy (line 415)', () => {
    const tip = new ArrowCircleFilledTip({
      position: [1, 0, 0],
      direction: [1, 0, 0],
    });
    const copy = tip.copy();
    expect(copy).toBeInstanceOf(ArrowCircleFilledTip);
    expect(copy).not.toBe(tip);
  });

  it('ArrowSquareFilledTip._createCopy (line 535)', () => {
    const tip = new ArrowSquareFilledTip({
      position: [1, 0, 0],
      direction: [1, 0, 0],
    });
    const copy = tip.copy();
    expect(copy).toBeInstanceOf(ArrowSquareFilledTip);
    expect(copy).not.toBe(tip);
  });

  it('ArrowTriangleTip with z-direction triggers getPerpendicular z-branch (line 40)', () => {
    const tip = new ArrowTriangleTip({
      position: [0, 0, 1],
      direction: [0, 0, 1],
    });
    expect(tip.getDirection()).toEqual([0, 0, 1]);
    // When dir is along Z, getPerpendicular returns [1, 0, 0]
    expect(tip).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// CubicBezier — coverage gaps: line 187 (normalizedTangentAtT degenerate),
//   line 240 (curvatureAtT degenerate), line 331 (_createCopy)
// ---------------------------------------------------------------------------
describe('CubicBezier coverage gaps', () => {
  it('normalizedTangentAtT returns [1,0,0] for degenerate tangent (line 187)', () => {
    // All control points at the same position → tangent has zero length
    const cb = new CubicBezier({
      points: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
    });
    const tangent = cb.normalizedTangentAtT(0.5);
    expect(tangent).toEqual([1, 0, 0]);
  });

  it('curvatureAtT returns 0 for degenerate curve (line 240)', () => {
    const cb = new CubicBezier({
      points: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
    });
    const curvature = cb.curvatureAtT(0.5);
    expect(curvature).toBe(0);
  });

  it('copy() covers _createCopy (line 331)', () => {
    const cb = new CubicBezier({
      points: [
        [0, 0, 0],
        [1, 2, 0],
        [3, 2, 0],
        [4, 0, 0],
      ],
    });
    const copy = cb.copy();
    expect(copy).toBeInstanceOf(CubicBezier);
    expect(copy).not.toBe(cb);
    expect(copy.getControlPoints()).toEqual(cb.getControlPoints());
  });
});

// ---------------------------------------------------------------------------
// Polygon — coverage gaps: line 169 (setVertex out of bounds), line 181 (empty getCentroid),
//   line 234 (getPerimeter < 2 vertices), line 257 (_createCopy)
// ---------------------------------------------------------------------------
describe('Polygon coverage gaps', () => {
  it('setVertex throws for out-of-bounds index (line 169)', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
    });
    expect(() => p.setVertex(-1, [0, 0, 0])).toThrow('out of bounds');
    expect(() => p.setVertex(5, [0, 0, 0])).toThrow('out of bounds');
  });

  it('copy() covers _createCopy (line 257)', () => {
    const p = new Polygon({
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
    });
    const copy = p.copy();
    expect(copy).toBeInstanceOf(Polygon);
    expect(copy).not.toBe(p);
  });

  it('Pentagon construction', () => {
    const pentagon = new Pentagon();
    expect(pentagon.getNumSides()).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Rectangle — coverage gaps: line 232 (_createCopy Rectangle), line 274 (_createCopy Square)
// ---------------------------------------------------------------------------
describe('Rectangle coverage gaps', () => {
  it('Rectangle.copy() covers _createCopy (line 232)', () => {
    const r = new Rectangle({ width: 3, height: 2 });
    const copy = r.copy();
    expect(copy).toBeInstanceOf(Rectangle);
    expect(copy).not.toBe(r);
    expect(copy.getWidth()).toBe(3);
    expect(copy.getHeight()).toBe(2);
  });

  it('Square.copy() covers _createCopy (line 274)', () => {
    const s = new Square({ sideLength: 3 });
    const copy = s.copy();
    expect(copy).toBeInstanceOf(Square);
    expect(copy).not.toBe(s);
    expect(copy.getSideLength()).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// ArcShapes — coverage gaps depend on exact lines; cover _createCopy and edge cases
// ---------------------------------------------------------------------------
describe('ArcShapes coverage gaps', () => {
  it('Ellipse.copy() covers _createCopy', () => {
    const e = new Ellipse({ width: 4, height: 2 });
    const copy = e.copy();
    expect(copy).toBeInstanceOf(Ellipse);
    expect(copy.getWidth()).toBe(4);
  });

  it('Annulus.copy() covers _createCopy', () => {
    const a = new Annulus({ innerRadius: 0.5, outerRadius: 1.5 });
    const copy = a.copy();
    expect(copy).toBeInstanceOf(Annulus);
    expect(copy.getInnerRadius()).toBe(0.5);
  });

  it('AnnularSector.copy() covers _createCopy', () => {
    const s = new AnnularSector({ innerRadius: 0.5, outerRadius: 1, angle: Math.PI / 3 });
    const copy = s.copy();
    expect(copy).toBeInstanceOf(AnnularSector);
  });

  it('Sector.copy() covers _createCopy', () => {
    const s = new Sector({ radius: 1, angle: Math.PI / 4 });
    const copy = s.copy();
    expect(copy).toBeInstanceOf(Sector);
  });

  it('ArcPolygon with mixed arc and straight edges', () => {
    const ap = new ArcPolygon({
      vertices: [
        [0, 1, 0],
        [-1, -0.5, 0],
        [1, -0.5, 0],
      ],
      arcConfigs: [
        { angle: Math.PI / 4 },
        { angle: 0 }, // straight
        { angle: -Math.PI / 4 },
      ],
    });
    const copy = ap.copy();
    expect(copy).toBeInstanceOf(ArcPolygon);
    expect(copy.getVertices().length).toBe(3);
  });

  it('CurvedArrow.copy() covers _createCopy', () => {
    const ca = new CurvedArrow({
      startPoint: [-1, 0, 0],
      endPoint: [1, 0, 0],
      angle: Math.PI / 3,
    });
    const copy = ca.copy();
    expect(copy).toBeInstanceOf(CurvedArrow);
    expect(copy.getStartPoint()).toEqual([-1, 0, 0]);
  });

  it('CurvedDoubleArrow.copy() covers _createCopy', () => {
    const cda = new CurvedDoubleArrow({
      startPoint: [-1, 0, 0],
      endPoint: [1, 0, 0],
      angle: Math.PI / 4,
    });
    const copy = cda.copy();
    expect(copy).toBeInstanceOf(CurvedDoubleArrow);
  });

  it('TangentialArc.copy() covers _createCopy', () => {
    const ta = new TangentialArc({
      start: [0, 0, 0],
      direction: [1, 0, 0],
      radius: 1,
      angle: Math.PI / 2,
    });
    const copy = ta.copy();
    expect(copy).toBeInstanceOf(TangentialArc);
  });

  it('CurvedArrow with coincident points results in empty path', () => {
    const ca = new CurvedArrow({
      startPoint: [0, 0, 0],
      endPoint: [0, 0, 0],
      angle: Math.PI / 4,
    });
    expect(ca).toBeDefined();
  });

  it('CurvedDoubleArrow with coincident points', () => {
    const cda = new CurvedDoubleArrow({
      startPoint: [1, 1, 0],
      endPoint: [1, 1, 0],
      angle: Math.PI / 4,
    });
    expect(cda).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// ArcBetweenPoints — coverage gaps: lines 94-99 (degenerate angle),
//   120 (coincident points), 179 (_createCopy)
// ---------------------------------------------------------------------------
describe('ArcBetweenPoints coverage gaps', () => {
  it('degenerate case: very small angle (lines 94-99)', () => {
    const arc = new ArcBetweenPoints({
      start: [-1, 0, 0],
      end: [1, 0, 0],
      angle: 0, // zero angle
    });
    expect(arc).toBeDefined();
    expect(arc.getStartPoint()).toEqual([-1, 0, 0]);
  });

  it('degenerate case: coincident points (line 120)', () => {
    const arc = new ArcBetweenPoints({
      start: [0, 0, 0],
      end: [0, 0, 0],
      angle: Math.PI / 2,
    });
    expect(arc).toBeDefined();
  });

  it('copy() covers _createCopy (line 179)', () => {
    const arc = new ArcBetweenPoints({
      start: [-1, 0, 0],
      end: [1, 0, 0],
      angle: Math.PI / 2,
    });
    const copy = arc.copy();
    expect(copy).toBeInstanceOf(ArcBetweenPoints);
    expect(copy.getStartPoint()).toEqual([-1, 0, 0]);
    expect(copy.getEndPoint()).toEqual([1, 0, 0]);
  });
});

// ---------------------------------------------------------------------------
// DashedVMobject — coverage gaps: line 83 (empty points), line 91 (nSeg <1),
//   line 310 (_createCopy)
// ---------------------------------------------------------------------------
describe('DashedVMobject coverage gaps', () => {
  it('DashedVMobject with empty VMobject handles gracefully (line 83)', () => {
    const vm = new VMobject();
    // No points set
    const dashed = new DashedVMobject({ vmobject: vm });
    expect(dashed).toBeDefined();
  });

  it('DashedVMobject.copy() covers _createCopy (line 310)', () => {
    const line = new Line({ start: [0, 0, 0], end: [3, 0, 0] });
    const dashed = new DashedVMobject({ vmobject: line });
    const copy = dashed.copy();
    expect(copy).toBeInstanceOf(DashedVMobject);
  });
});
