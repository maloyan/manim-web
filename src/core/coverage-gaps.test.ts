import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { Mobject } from './Mobject';
import { VMobject } from './VMobject';
import { IntegerMatrix, DecimalMatrix, MobjectMatrix } from '../mobjects/matrix/Matrix';
import { PGroup, PointMobject, PointCloudDot, Mobject1D, Mobject2D } from '../mobjects/point/index';

// ---------------------------------------------------------------------------
// Mobject — coverage gaps: lines 662-663 (getBounds with _threeObject),
//   lines 1250-1256 (dispose with _threeObject mesh materials)
// ---------------------------------------------------------------------------
describe('Mobject coverage gaps', () => {
  it('getBounds without _threeObject uses fallback (lines 662-663)', () => {
    const m = new VMobject();
    const bounds = m.getBounds();
    expect(bounds.min).toBeDefined();
    expect(bounds.max).toBeDefined();
    // Fallback should use center +/- 0.5
    expect(bounds.min.x).toBeCloseTo(-0.5, 5);
    expect(bounds.max.x).toBeCloseTo(0.5, 5);
  });

  it('dispose with THREE.js mesh objects (lines 1250-1256)', () => {
    const m = new VMobject();
    // Access _threeObject to create it
    const threeObj = m.getThreeObject();

    // Add a Mesh with geometry and material
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geom, mat);
    threeObj.add(mesh);

    // Dispose should traverse and clean up
    const geomDisposeSpy = vi.spyOn(geom, 'dispose');
    const matDisposeSpy = vi.spyOn(mat, 'dispose');

    m.dispose();

    expect(geomDisposeSpy).toHaveBeenCalled();
    expect(matDisposeSpy).toHaveBeenCalled();
  });

  it('dispose with mesh having material array (line 1253-1254)', () => {
    const m = new VMobject();
    const threeObj = m.getThreeObject();

    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat1 = new THREE.MeshBasicMaterial();
    const mat2 = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geom, [mat1, mat2]);
    threeObj.add(mesh);

    const mat1Spy = vi.spyOn(mat1, 'dispose');
    const mat2Spy = vi.spyOn(mat2, 'dispose');

    m.dispose();

    expect(mat1Spy).toHaveBeenCalled();
    expect(mat2Spy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Matrix — coverage gap: line 691 (MobjectMatrix._createEntry fallback for non-Mobject)
// ---------------------------------------------------------------------------
describe('Matrix coverage gaps', () => {
  it('MobjectMatrix._createEntry fallback for string values (line 691)', () => {
    // MobjectMatrix that has a non-Mobject value triggers the fallback
    // The MobjectMatrix constructor accepts Mobject[][] but _createEntry
    // has a fallback for non-Mobject values through super._createEntry
    const m = new MobjectMatrix(
      // Force a string value through by casting
      [['hello' as unknown as Mobject, 'world' as unknown as Mobject]] as Mobject[][],
    );
    expect(m).toBeDefined();
    expect(m.numRows).toBe(1);
    expect(m.numCols).toBe(2);
  });

  it('IntegerMatrix.copy() covers _createCopy', () => {
    const m = new IntegerMatrix([
      [1, 2],
      [3, 4],
    ]);
    const copy = m.copy();
    expect(copy).toBeDefined();
  });

  it('DecimalMatrix.copy() covers _createCopy', () => {
    const m = new DecimalMatrix([[1.234, 5.678]], { numDecimalPlaces: 2 });
    const copy = m.copy();
    expect(copy).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// PMobject/Point — coverage gaps around line 981 (Mobject1D with numPoints=1),
//   line 1316-1317 (Mobject2D grid with x/yCount=1)
// ---------------------------------------------------------------------------
describe('Point module coverage gaps', () => {
  it('Mobject1D with exactly 1 point uses t=0.5 (line 984)', () => {
    const m1d = new Mobject1D({
      start: [0, 0, 0],
      end: [2, 0, 0],
      numPoints: 1,
    });
    const points = m1d.getPoints();
    expect(points.length).toBe(1);
    // t=0.5 means point should be at midpoint [1, 0, 0]
    expect(points[0].position[0]).toBeCloseTo(1, 5);
  });

  it('Mobject2D grid with xCount=1 uses tx=0.5 (line 1316)', () => {
    const m2d = new Mobject2D({
      center: [0, 0, 0],
      width: 2,
      height: 2,
      numPointsX: 1,
      numPointsY: 2,
      distribution: 'grid',
    });
    const points = m2d.getPoints();
    // With xCount=1, tx = 0.5 so x should be at center
    expect(points.length).toBe(2);
  });

  it('Mobject2D grid with yCount=1 uses ty=0.5 (line 1317)', () => {
    const m2d = new Mobject2D({
      center: [0, 0, 0],
      width: 2,
      height: 2,
      numPointsX: 2,
      numPointsY: 1,
      distribution: 'grid',
    });
    const points = m2d.getPoints();
    expect(points.length).toBe(2);
  });

  it('PointCloudDot with uniform distribution', () => {
    const dot = new PointCloudDot({
      distribution: 'uniform',
      numParticles: 5,
    });
    expect(dot.numPoints).toBe(5);
  });

  it('PGroup with no children returns position as center', () => {
    const pg = new PGroup();
    const center = pg.getCenter();
    expect(center).toEqual([0, 0, 0]);
  });

  it('PointMobject getPosition with empty points fallback', () => {
    const pm = new PointMobject({ position: [1, 2, 3] });
    pm.clearPoints();
    const pos = pm.getPosition();
    // Fallback to position.x/y/z
    expect(pos).toBeDefined();
  });
});
