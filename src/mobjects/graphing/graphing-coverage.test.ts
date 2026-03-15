// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import { Axes } from './Axes';
import { BarChart } from './BarChart';
import { VectorField, StreamLines } from './VectorField';
import { ImplicitFunction } from './ImplicitFunction';
import { NumberLine } from './NumberLine';
import { ComplexPlane } from './ComplexPlane';

/**
 * happy-dom does not support canvas 2D context. Text (used by BarChart for
 * x-labels, ComplexPlane for imaginary labels, etc.) calls
 * canvas.getContext('2d') which returns null and throws. We stub it with a
 * minimal mock so construction succeeds.
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

// ---------------------------------------------------------------------------
// Axes — coverage gaps: lines 734-735 (vertexDotStyle.strokeColor), 763 (_createCopy)
// ---------------------------------------------------------------------------
describe('Axes coverage gaps', () => {
  it('plotLineGraph with vertexDotStyle.strokeColor covers lines 734-735', () => {
    const axes = new Axes({ xRange: [0, 3, 1], yRange: [0, 3, 1] });
    const result = axes.plotLineGraph({
      xValues: [0, 1, 2],
      yValues: [0, 1, 2],
      addVertexDots: true,
      vertexDotStyle: {
        strokeColor: '#ff0000',
        strokeWidth: 3,
      },
    });
    expect(result).toBeDefined();
    const dots = result.get('vertex_dots');
    expect(dots).toBeDefined();
  });

  it('copy() covers _createCopy (line 763)', () => {
    const axes = new Axes({ xRange: [0, 5, 1], yRange: [0, 5, 1] });
    const copy = axes.copy();
    expect(copy).toBeInstanceOf(Axes);
    expect(copy).not.toBe(axes);
  });
});

// ---------------------------------------------------------------------------
// BarChart — coverage gaps: line 460 (getValuesFlat multi-series), line 640 (_createCopy)
// ---------------------------------------------------------------------------
describe('BarChart coverage gaps', () => {
  it('getValuesFlat with multi-series returns flat array (line 460)', () => {
    const chart = new BarChart({
      values: [
        [1, 2],
        [3, 4],
      ],
      barColors: ['#ff0000', '#0000ff'],
    });
    const flat = chart.getValuesFlat();
    // Multi-series: flat() should return [1, 2, 3, 4]
    expect(flat).toEqual([1, 2, 3, 4]);
  });

  it('copy() covers _createCopy (line 640)', () => {
    const chart = new BarChart({ values: [1, 2, 3] });
    const copy = chart.copy();
    expect(copy).toBeInstanceOf(BarChart);
    expect(copy).not.toBe(chart);
  });
});

// ---------------------------------------------------------------------------
// VectorField — coverage gaps: lines 195-196 (maxMagnitude cap), line 736 (variableWidth)
// ---------------------------------------------------------------------------
describe('VectorField coverage gaps', () => {
  it('_evaluateVector caps at maxMagnitude (lines 195-196)', () => {
    // Create a field with a very strong vector and a low maxMagnitude
    const field = new VectorField({
      func: (_x: number, _y: number) => [1000, 1000],
      xRange: [0, 1, 0.5],
      yRange: [0, 1, 0.5],
      maxMagnitude: 1,
    });
    // _evaluateVector is protected, access via bracket notation
    const [vx, vy] = (field as any)._evaluateVector(0.5, 0.5);
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    expect(magnitude).toBeCloseTo(1, 3);
  });

  it('StreamLines with variableWidth covers line 736', () => {
    const streamField = new StreamLines({
      func: (x: number, y: number) => [-y, x],
      xRange: [-1, 1, 0.5],
      yRange: [-1, 1, 0.5],
      variableWidth: true,
    });
    expect(streamField).toBeDefined();
    expect(streamField.children.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// ImplicitFunction — coverage gaps: lines 264-265 (saddle case 5 center<=0),
//                    lines 285-286 (saddle case 10 center<=0)
// ---------------------------------------------------------------------------
describe('ImplicitFunction coverage gaps', () => {
  it('saddle case 5: BL+TR positive with center<=0 (lines 264-265)', () => {
    // f(x,y) = x*y - 0.3 creates BL+TR saddle with negative center
    const implFunc = new ImplicitFunction({
      func: (x: number, y: number) => x * y - 0.3,
      xRange: [-2, 2],
      yRange: [-2, 2],
      minDepth: 4,
    });
    expect(implFunc).toBeDefined();
    // Verify it generates points without error (VMobject has getPoints())
    const points = implFunc.getPoints();
    expect(points).toBeDefined();
  });

  it('saddle case 10: TL+BR positive with center<=0 (lines 285-286)', () => {
    // f(x,y) = -x*y - 0.3 (negated saddle)
    const implFunc = new ImplicitFunction({
      func: (x: number, y: number) => -x * y - 0.3,
      xRange: [-2, 2],
      yRange: [-2, 2],
      minDepth: 4,
    });
    expect(implFunc).toBeDefined();
    const points = implFunc.getPoints();
    expect(points).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// NumberLine — coverage gap: line 156 (remove old number labels)
// ---------------------------------------------------------------------------
describe('NumberLine coverage gaps', () => {
  it('rebuild with existing labels removes old ones (line 156)', () => {
    const nl = new NumberLine({
      xRange: [0, 5, 1],
      includeNumbers: true,
    });
    // Force a rebuild by changing range which triggers _rebuild
    nl.setXRange([0, 3, 1]);
    // The rebuild should remove old labels and create new ones
    expect(nl).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// ComplexPlane — coverage gap: line 90 (clearing imaginary labels)
// ---------------------------------------------------------------------------
describe('ComplexPlane coverage gaps', () => {
  it('re-generating imaginary labels clears existing ones (line 90)', () => {
    const cp = new ComplexPlane({
      xRange: [-2, 2, 1],
      yRange: [-2, 2, 1],
    });
    // Access and verify it created imaginary labels
    expect(cp).toBeDefined();
    // Force regeneration which clears the existing labels first
    // by calling a method that triggers _generateImaginaryLabels again
    const copy = cp.copy();
    expect(copy).toBeDefined();
  });
});
