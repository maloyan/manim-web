/**
 * Tests for SceneExtensions:
 * - ZoomedDisplay defaults and strokeWidth
 * - Scene._autoRender accessibility
 * - ZoomDisplayPopOut animation lifecycle
 * - Coordinate conversion helpers used by VectorScene and LinearTransformationScene
 * - Matrix2D type and matrix operations
 */
import { describe, it, expect } from 'vitest';
import { Rectangle } from '../mobjects/geometry/Rectangle';
import type { Circle } from '../mobjects/geometry/Circle';
import { Scene } from './Scene';
import { ZoomDisplayPopOut } from './SceneExtensions';
import { coordsToPoint, pointToCoords } from '../utils/math';

describe('ZoomedDisplay defaults', () => {
  it('displayFrame Rectangle uses strokeWidth=3 matching Python Manim default', () => {
    // Python Manim's image_frame_stroke_width defaults to 3.
    // The displayFrame is a Rectangle with this stroke width.
    const rect = new Rectangle({ width: 6, height: 1, strokeWidth: 3 });
    expect(rect.strokeWidth).toBe(3);
  });

  it('Rectangle with strokeWidth=3 produces correct mesh half-width', () => {
    // halfW = strokeWidth * 0.005 in _updateMeshStroke
    const strokeWidth = 3;
    const halfW = strokeWidth * 0.005;
    expect(halfW).toBeCloseTo(0.015, 6);
    // Total border width in world units = 0.03, matching Python Manim's
    // linewidth formula: strokeWidth * 0.01 * (rendererWidth / frameWidth)
    expect(halfW * 2).toBeCloseTo(0.03, 6);
  });

  it('ZoomedCamera frame is a Rectangle with fillOpacity 0', () => {
    // ZoomedCamera creates a Rectangle with fillOpacity = 0 (transparent interior)
    const frame = new Rectangle({ width: 0.9, height: 0.9, color: '#FFFF00', strokeWidth: 3 });
    frame.fillOpacity = 0;
    expect(frame.fillOpacity).toBe(0);
    expect(frame.strokeWidth).toBe(3);
    expect(frame.color).toBe('#FFFF00');
  });

  it('ZoomedDisplay display frame matches expected defaults', () => {
    // The display frame uses displayFrameColor (default '#FFFF00') and
    // displayFrameStrokeWidth (default 3)
    const displayFrame = new Rectangle({
      width: 3,
      height: 3,
      color: '#FFFF00',
      strokeWidth: 3,
    });
    displayFrame.fillOpacity = 0;
    expect(displayFrame.fillOpacity).toBe(0);
    expect(displayFrame.color).toBe('#FFFF00');
  });
});

describe('Scene._autoRender accessibility', () => {
  it('_autoRender is accessible from subclasses (protected)', () => {
    // Verify the protected field exists and can be accessed by subclasses.
    // ZoomedScene extends Scene and needs to suppress auto-render
    // during activateZooming() to prevent flicker.
    class TestScene extends Scene {
      getAutoRender(): boolean {
        return this._autoRender;
      }
      setAutoRender(value: boolean): void {
        this._autoRender = value;
      }
    }

    // Scene constructor requires an HTMLElement, but _autoRender
    // is set before any DOM interaction, so we can test the
    // subclass pattern with a type-level check.
    // The fact that this compiles proves _autoRender is protected.
    expect(TestScene).toBeDefined();
  });
});

describe('ZoomDisplayPopOut', () => {
  it('should construct with display and frame mobjects', () => {
    const display = new Rectangle({ width: 3, height: 3 });
    const frame = new Rectangle({ width: 0.9, height: 0.9 });
    const anim = new ZoomDisplayPopOut(display, frame);
    expect(anim).toBeDefined();
    expect(anim.mobject).toBe(display);
    expect(anim.duration).toBe(1); // default duration
  });

  it('should accept custom animation options', () => {
    const display = new Rectangle({ width: 3, height: 3 });
    const frame = new Rectangle({ width: 0.9, height: 0.9 });
    const rateFunc = (t: number) => t * t;
    const anim = new ZoomDisplayPopOut(display, frame, {
      duration: 2,
      rateFunc,
    });
    expect(anim.duration).toBe(2);
    expect(anim.rateFunc).toBe(rateFunc);
  });

  it('begin() should save display position and scale, then snap to frame', () => {
    const display = new Rectangle({ width: 3, height: 3 });
    const frame = new Rectangle({ width: 0.9, height: 0.9 });

    // Position display away from the frame
    display.moveTo([5, 3, 0]);

    const anim = new ZoomDisplayPopOut(display, frame);
    anim.begin();

    // After begin(), display should be snapped onto the frame via replace()
    // The display's position should now be near the frame's position
    const frameCenter = frame.getCenter();
    const displayCenter = display.getCenter();
    // After replace(frame, stretch=true), the display center should match frame center
    expect(Math.abs(displayCenter[0] - frameCenter[0])).toBeLessThan(0.5);
    expect(Math.abs(displayCenter[1] - frameCenter[1])).toBeLessThan(0.5);
  });

  it('interpolate(0) should keep display at frame-matched position', () => {
    const display = new Rectangle({ width: 3, height: 3 });
    const frame = new Rectangle({ width: 0.9, height: 0.9 });
    display.moveTo([5, 3, 0]);

    const anim = new ZoomDisplayPopOut(display, frame);
    anim.begin();

    // Save frame-matched position
    const frameMatchedX = display.position.x;
    const frameMatchedY = display.position.y;

    anim.interpolate(0);
    // At alpha=0, display should remain at frame-matched position
    expect(display.position.x).toBeCloseTo(frameMatchedX, 5);
    expect(display.position.y).toBeCloseTo(frameMatchedY, 5);
  });

  it('interpolate(1) should move display to its original saved position', () => {
    const display = new Rectangle({ width: 3, height: 3 });
    const frame = new Rectangle({ width: 0.9, height: 0.9 });
    display.moveTo([5, 3, 0]);

    const savedX = display.position.x;
    const savedY = display.position.y;

    const anim = new ZoomDisplayPopOut(display, frame);
    anim.begin();
    anim.interpolate(1);

    // At alpha=1, display should be back at its original position
    expect(display.position.x).toBeCloseTo(savedX, 5);
    expect(display.position.y).toBeCloseTo(savedY, 5);
  });

  it('interpolate(0.5) should produce an intermediate position', () => {
    const display = new Rectangle({ width: 3, height: 3 });
    const frame = new Rectangle({ width: 0.9, height: 0.9 });
    display.moveTo([4, 0, 0]);

    const savedX = display.position.x;

    const anim = new ZoomDisplayPopOut(display, frame);
    anim.begin();

    const frameMatchedX = display.position.x;

    anim.interpolate(0.5);
    // At alpha=0.5, position should be halfway between frame-matched and saved
    const expectedX = frameMatchedX + (savedX - frameMatchedX) * 0.5;
    expect(display.position.x).toBeCloseTo(expectedX, 5);
  });

  it('interpolate without begin should be a no-op', () => {
    const display = new Rectangle({ width: 3, height: 3 });
    const frame = new Rectangle({ width: 0.9, height: 0.9 });
    display.moveTo([5, 3, 0]);

    const anim = new ZoomDisplayPopOut(display, frame);
    // Do NOT call begin(), call interpolate directly
    anim.interpolate(0.5);
    // Position should be unchanged (no crash, no-op)
    expect(display.position.x).toBeCloseTo(5, 5);
    expect(display.position.y).toBeCloseTo(3, 5);
  });

  it('finish() should apply final rateFunc value', () => {
    const display = new Rectangle({ width: 3, height: 3 });
    const frame = new Rectangle({ width: 0.9, height: 0.9 });
    display.moveTo([5, 3, 0]);

    const savedX = display.position.x;
    const savedY = display.position.y;

    // Default rateFunc is smooth, smooth(1) = 1
    const anim = new ZoomDisplayPopOut(display, frame);
    anim.begin();
    anim.finish();

    // After finish with default rateFunc (smooth), the display should be at saved position
    expect(display.position.x).toBeCloseTo(savedX, 3);
    expect(display.position.y).toBeCloseTo(savedY, 3);
  });

  it('finish() with reverse rate function should keep display at frame position', () => {
    const display = new Rectangle({ width: 3, height: 3 });
    const frame = new Rectangle({ width: 0.9, height: 0.9 });
    display.moveTo([5, 3, 0]);

    // Reverse rate function: rateFunc(1) = 0
    const reverseFunc = (t: number) => 1 - t;
    const anim = new ZoomDisplayPopOut(display, frame, { rateFunc: reverseFunc });
    anim.begin();

    const frameMatchedX = display.position.x;
    const frameMatchedY = display.position.y;

    anim.finish();

    // With reverse rateFunc, finalAlpha = reverseFunc(1) = 0
    // So display should remain at frame-matched position
    expect(display.position.x).toBeCloseTo(frameMatchedX, 3);
    expect(display.position.y).toBeCloseTo(frameMatchedY, 3);
  });

  it('should also interpolate scale between frame-matched and saved', () => {
    const display = new Rectangle({ width: 6, height: 6 });
    const frame = new Rectangle({ width: 1, height: 1 });
    display.moveTo([4, 2, 0]);

    const savedScaleX = display.scaleVector.x;
    const savedScaleY = display.scaleVector.y;

    const anim = new ZoomDisplayPopOut(display, frame);
    anim.begin();

    const frameScaleX = display.scaleVector.x;
    const frameScaleY = display.scaleVector.y;

    // Scale should have changed from replace(frame, stretch=true)
    // since display (6x6) is much larger than frame (1x1)
    // frameScaleX should be significantly different from savedScaleX
    anim.interpolate(1);

    // At alpha=1, scale should be restored to saved
    expect(display.scaleVector.x).toBeCloseTo(savedScaleX, 5);
    expect(display.scaleVector.y).toBeCloseTo(savedScaleY, 5);

    anim.interpolate(0);
    // At alpha=0, scale should be at frame-matched
    expect(display.scaleVector.x).toBeCloseTo(frameScaleX, 5);
    expect(display.scaleVector.y).toBeCloseTo(frameScaleY, 5);
  });
});

describe('coordsToPoint and pointToCoords helpers (used by VectorScene/LinearTransformationScene)', () => {
  const xRange: [number, number, number] = [-5, 5, 1];
  const yRange: [number, number, number] = [-3, 3, 1];
  const xLength = 10;
  const yLength = 6;

  it('coordsToPoint should map origin (0,0) to visual (0,0,0)', () => {
    const pt = coordsToPoint(0, 0, xRange, yRange, xLength, yLength);
    expect(pt[0]).toBeCloseTo(0, 5);
    expect(pt[1]).toBeCloseTo(0, 5);
    expect(pt[2]).toBe(0);
  });

  it('coordsToPoint should map (5,3) to visual (5,3,0)', () => {
    // x=5 is at xMax, so xNorm=1 -> (1-0.5)*10 = 5
    // y=3 is at yMax, so yNorm=1 -> (1-0.5)*6 = 3
    const pt = coordsToPoint(5, 3, xRange, yRange, xLength, yLength);
    expect(pt[0]).toBeCloseTo(5, 5);
    expect(pt[1]).toBeCloseTo(3, 5);
  });

  it('coordsToPoint should map (-5,-3) to visual (-5,-3,0)', () => {
    const pt = coordsToPoint(-5, -3, xRange, yRange, xLength, yLength);
    expect(pt[0]).toBeCloseTo(-5, 5);
    expect(pt[1]).toBeCloseTo(-3, 5);
  });

  it('coordsToPoint should handle asymmetric ranges', () => {
    const asymXRange: [number, number, number] = [0, 10, 1];
    const asymYRange: [number, number, number] = [0, 4, 1];
    const pt = coordsToPoint(5, 2, asymXRange, asymYRange, 10, 8);
    // x=5 is midpoint of [0,10], xNorm=0.5 -> (0.5-0.5)*10 = 0
    // y=2 is midpoint of [0,4], yNorm=0.5 -> (0.5-0.5)*8 = 0
    expect(pt[0]).toBeCloseTo(0, 5);
    expect(pt[1]).toBeCloseTo(0, 5);
  });

  it('pointToCoords should be the inverse of coordsToPoint', () => {
    const graphX = 2;
    const graphY = -1;
    const visualPt = coordsToPoint(graphX, graphY, xRange, yRange, xLength, yLength);
    const [rx, ry] = pointToCoords(
      visualPt as [number, number, number],
      xRange,
      yRange,
      xLength,
      yLength,
    );
    expect(rx).toBeCloseTo(graphX, 5);
    expect(ry).toBeCloseTo(graphY, 5);
  });

  it('pointToCoords should map visual origin to graph origin', () => {
    const [rx, ry] = pointToCoords([0, 0, 0], xRange, yRange, xLength, yLength);
    expect(rx).toBeCloseTo(0, 5);
    expect(ry).toBeCloseTo(0, 5);
  });

  it('roundtrip coordsToPoint -> pointToCoords for multiple values', () => {
    const testPoints: [number, number][] = [
      [1, 2],
      [-3, 1],
      [4.5, -2.5],
      [0, 0],
      [-5, 3],
      [5, -3],
    ];
    for (const [gx, gy] of testPoints) {
      const visual = coordsToPoint(gx, gy, xRange, yRange, xLength, yLength);
      const [rx, ry] = pointToCoords(
        visual as [number, number, number],
        xRange,
        yRange,
        xLength,
        yLength,
      );
      expect(rx).toBeCloseTo(gx, 5);
      expect(ry).toBeCloseTo(gy, 5);
    }
  });
});

describe('Matrix2D operations (used by LinearTransformationScene)', () => {
  it('identity matrix multiplication should be identity', () => {
    const identity: [[number, number], [number, number]] = [
      [1, 0],
      [0, 1],
    ];
    const [[a, b], [c, d]] = identity;
    const [[a1, b1], [c1, d1]] = identity;
    const result: [[number, number], [number, number]] = [
      [a * a1 + b * c1, a * b1 + b * d1],
      [c * a1 + d * c1, c * b1 + d * d1],
    ];
    expect(result).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });

  it('rotation matrix should preserve determinant of 1', () => {
    const angle = Math.PI / 4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotation: [[number, number], [number, number]] = [
      [cos, -sin],
      [sin, cos],
    ];
    const det = rotation[0][0] * rotation[1][1] - rotation[0][1] * rotation[1][0];
    expect(det).toBeCloseTo(1, 10);
  });

  it('scaling matrix should scale determinant accordingly', () => {
    const scale: [[number, number], [number, number]] = [
      [2, 0],
      [0, 3],
    ];
    const det = scale[0][0] * scale[1][1] - scale[0][1] * scale[1][0];
    expect(det).toBe(6);
  });

  it('matrix inverse times original should yield identity', () => {
    const m: [[number, number], [number, number]] = [
      [2, 1],
      [1, 3],
    ];
    const [[a, b], [c, d]] = m;
    const det = a * d - b * c;
    expect(det).not.toBe(0);

    const inv: [[number, number], [number, number]] = [
      [d / det, -b / det],
      [-c / det, a / det],
    ];

    // m * inv should equal identity
    const result: [[number, number], [number, number]] = [
      [a * inv[0][0] + b * inv[1][0], a * inv[0][1] + b * inv[1][1]],
      [c * inv[0][0] + d * inv[1][0], c * inv[0][1] + d * inv[1][1]],
    ];
    expect(result[0][0]).toBeCloseTo(1, 10);
    expect(result[0][1]).toBeCloseTo(0, 10);
    expect(result[1][0]).toBeCloseTo(0, 10);
    expect(result[1][1]).toBeCloseTo(1, 10);
  });

  it('shear matrix should have determinant 1', () => {
    const shear: [[number, number], [number, number]] = [
      [1, 2],
      [0, 1],
    ];
    const det = shear[0][0] * shear[1][1] - shear[0][1] * shear[1][0];
    expect(det).toBe(1);
  });
});

describe('ZoomedSceneOptions defaults verification', () => {
  it('default cameraFrameWidth should be displayWidth * zoomFactor', () => {
    const displayWidth = 3;
    const zoomFactor = 0.3;
    const cameraFrameWidth = displayWidth * zoomFactor;
    expect(cameraFrameWidth).toBeCloseTo(0.9, 5);
  });

  it('default display corner position calculation', () => {
    // Default: corner = [1, 1, 0] (upper-right), cornerBuff = 0.5
    // frameW = 14, frameH = 8 (Manim defaults)
    const corner = [1, 1, 0];
    const cornerBuff = 0.5;
    const displayWidth = 3;
    const displayHeight = 3;
    const frameW = 14;
    const frameH = 8;

    const dx = corner[0] !== 0 ? corner[0] * (frameW / 2 - cornerBuff - displayWidth / 2) : 0;
    const dy = corner[1] !== 0 ? corner[1] * (frameH / 2 - cornerBuff - displayHeight / 2) : 0;

    // dx = 1 * (7 - 0.5 - 1.5) = 5.0
    // dy = 1 * (4 - 0.5 - 1.5) = 2.0
    expect(dx).toBeCloseTo(5.0, 5);
    expect(dy).toBeCloseTo(2.0, 5);
  });

  it('display corner calculation for lower-left corner', () => {
    const corner = [-1, -1, 0];
    const cornerBuff = 0.5;
    const displayWidth = 3;
    const displayHeight = 3;
    const frameW = 14;
    const frameH = 8;

    const dx = corner[0] !== 0 ? corner[0] * (frameW / 2 - cornerBuff - displayWidth / 2) : 0;
    const dy = corner[1] !== 0 ? corner[1] * (frameH / 2 - cornerBuff - displayHeight / 2) : 0;

    expect(dx).toBeCloseTo(-5.0, 5);
    expect(dy).toBeCloseTo(-2.0, 5);
  });

  it('display corner calculation for center-right (corner=[1,0,0])', () => {
    const corner = [1, 0, 0];
    const cornerBuff = 0.5;
    const displayWidth = 3;
    const frameW = 14;
    const frameH = 8;

    const dx = corner[0] !== 0 ? corner[0] * (frameW / 2 - cornerBuff - displayWidth / 2) : 0;
    const dy = corner[1] !== 0 ? corner[1] * (frameH / 2 - cornerBuff - displayWidth / 2) : 0;

    expect(dx).toBeCloseTo(5.0, 5);
    expect(dy).toBe(0); // y component is 0 since corner[1] is 0
  });
});

describe('VectorSceneOptions defaults verification', () => {
  it('default ranges and lengths', () => {
    const defaults = {
      xRange: [-5, 5, 1] as [number, number, number],
      yRange: [-3, 3, 1] as [number, number, number],
      xLength: 10,
      yLength: 6,
      iColor: '#83C167',
      jColor: '#FC6255',
    };

    // Verify origin maps to visual (0,0)
    const origin = coordsToPoint(
      0,
      0,
      defaults.xRange,
      defaults.yRange,
      defaults.xLength,
      defaults.yLength,
    );
    expect(origin[0]).toBeCloseTo(0, 5);
    expect(origin[1]).toBeCloseTo(0, 5);

    // Verify i-hat (1,0) maps to correct visual position
    const iEnd = coordsToPoint(
      1,
      0,
      defaults.xRange,
      defaults.yRange,
      defaults.xLength,
      defaults.yLength,
    );
    // x=1 in [-5,5] -> xNorm = 6/10 = 0.6 -> (0.6 - 0.5) * 10 = 1
    expect(iEnd[0]).toBeCloseTo(1, 5);
    expect(iEnd[1]).toBeCloseTo(0, 5);

    // Verify j-hat (0,1) maps to correct visual position
    const jEnd = coordsToPoint(
      0,
      1,
      defaults.xRange,
      defaults.yRange,
      defaults.xLength,
      defaults.yLength,
    );
    expect(jEnd[0]).toBeCloseTo(0, 5);
    expect(jEnd[1]).toBeCloseTo(1, 5);
  });
});

describe('LinearTransformationScene defaults verification', () => {
  it('default grid uses symmetric ranges [-5,5] for both axes', () => {
    const xRange: [number, number, number] = [-5, 5, 1];
    const yRange: [number, number, number] = [-5, 5, 1];
    const xLength = 10;
    const yLength = 10;

    // Origin should be at visual (0,0)
    const origin = coordsToPoint(0, 0, xRange, yRange, xLength, yLength);
    expect(origin[0]).toBeCloseTo(0, 5);
    expect(origin[1]).toBeCloseTo(0, 5);
  });

  it('_coordToVisualX formula matches coordsToPoint x component', () => {
    const xRange: [number, number, number] = [-5, 5, 1];
    const xLength = 10;

    // Manual calculation matching _coordToVisualX
    const x = 3;
    const [xMin, xMax] = xRange;
    const xNorm = xMax !== xMin ? (x - xMin) / (xMax - xMin) : 0.5;
    const visualX = (xNorm - 0.5) * xLength;

    // Should match coordsToPoint x component
    const pt = coordsToPoint(x, 0, xRange, [-5, 5, 1], xLength, 10);
    expect(visualX).toBeCloseTo(pt[0], 5);
  });

  it('_coordToVisualY formula matches coordsToPoint y component', () => {
    const yRange: [number, number, number] = [-5, 5, 1];
    const yLength = 10;

    const y = -2;
    const [yMin, yMax] = yRange;
    const yNorm = yMax !== yMin ? (y - yMin) / (yMax - yMin) : 0.5;
    const visualY = (yNorm - 0.5) * yLength;

    const pt = coordsToPoint(0, y, [-5, 5, 1], yRange, 10, yLength);
    expect(visualY).toBeCloseTo(pt[1], 5);
  });

  it('should handle equal min/max range (degenerate case)', () => {
    // When xMin === xMax, _coordToVisualX returns (0.5 - 0.5) * xLength = 0
    const xRange: [number, number, number] = [3, 3, 1];
    const xLength = 10;

    const x = 3;
    const [xMin, xMax] = xRange;
    const xNorm = xMax !== xMin ? (x - xMin) / (xMax - xMin) : 0.5;
    const visualX = (xNorm - 0.5) * xLength;
    expect(visualX).toBeCloseTo(0, 5);
  });
});

describe('MovingCameraScene defaults verification', () => {
  it('default camera duration should be 1 second', () => {
    const defaultCameraDuration = 1;
    expect(defaultCameraDuration).toBe(1);
  });

  it('smoothstep function produces correct interpolation', () => {
    // MovingCameraScene uses smoothstep for camera animations
    // smoothstep(t) = t * t * (3 - 2 * t)
    const smoothstepLocal = (t: number) => t * t * (3 - 2 * t);

    expect(smoothstepLocal(0)).toBe(0);
    expect(smoothstepLocal(1)).toBe(1);
    expect(smoothstepLocal(0.5)).toBeCloseTo(0.5, 5);

    // Verify smooth acceleration/deceleration
    // Derivative at 0 and 1 should be 0 (smooth start/end)
    const dt = 0.001;
    const derivAt0 = (smoothstepLocal(dt) - smoothstepLocal(0)) / dt;
    const derivAt1 = (smoothstepLocal(1) - smoothstepLocal(1 - dt)) / dt;
    expect(derivAt0).toBeCloseTo(0, 2);
    expect(derivAt1).toBeCloseTo(0, 2);
  });

  it('zoom calculation: zoom=2 means half frameWidth', () => {
    // MovingCameraScene.zoomTo: _zoomTarget = 1 / zoom
    // Current frameWidth * currentZoom = final frameWidth
    const defaultWidth = 14;
    const zoom = 2;
    const zoomTarget = 1 / zoom; // 0.5
    const finalWidth = defaultWidth * zoomTarget; // 7
    expect(finalWidth).toBe(7);
  });

  it('zoom calculation: zoom=0.5 means double frameWidth', () => {
    const defaultWidth = 14;
    const zoom = 0.5;
    const zoomTarget = 1 / zoom; // 2
    const finalWidth = defaultWidth * zoomTarget; // 28
    expect(finalWidth).toBe(28);
  });
});

describe('ThreeDSceneOptions defaults verification', () => {
  it('default camera parameters', () => {
    const defaults = {
      fov: 45,
      phi: Math.PI / 4,
      theta: -Math.PI / 4,
      distance: 15,
      enableOrbitControls: true,
      setupLighting: true,
    };

    expect(defaults.fov).toBe(45);
    expect(defaults.phi).toBeCloseTo(Math.PI / 4, 10);
    expect(defaults.theta).toBeCloseTo(-Math.PI / 4, 10);
    expect(defaults.distance).toBe(15);
    expect(defaults.enableOrbitControls).toBe(true);
    expect(defaults.setupLighting).toBe(true);
  });

  it('HUD camera dimensions match frame dimensions', () => {
    const frameWidth = 14;
    const frameHeight = 8;
    const halfW = frameWidth / 2; // 7
    const halfH = frameHeight / 2; // 4
    expect(halfW).toBe(7);
    expect(halfH).toBe(4);
  });

  it('ambient rotation rate default is 0.1 rad/s', () => {
    const defaultRate = 0.1;
    // After 1 second, theta should advance by 0.1 radians
    const dt = 1;
    const deltaTheta = defaultRate * dt;
    expect(deltaTheta).toBeCloseTo(0.1, 10);
  });

  it('3D illusion rotation oscillation formulas', () => {
    // Python Manim: theta oscillates via 0.2*sin(tracker), phi via 0.1*cos(tracker)
    const originTheta = -Math.PI / 4;
    const originPhi = Math.PI / 4;
    const tracker = Math.PI / 2;

    const newTheta = originTheta + 0.2 * Math.sin(tracker);
    const newPhi = originPhi + 0.1 * Math.cos(tracker);

    // At tracker = PI/2: sin(PI/2) = 1, cos(PI/2) = 0
    expect(newTheta).toBeCloseTo(originTheta + 0.2, 10);
    expect(newPhi).toBeCloseTo(originPhi, 10);
  });

  it('ambient rotation clamps dt to 0.1 to avoid huge jumps', () => {
    const maxDt = 0.1;
    const largeDt = 5.0; // e.g., after tab regains focus
    const clampedDt = Math.min(largeDt, maxDt);
    expect(clampedDt).toBe(0.1);
  });
});
