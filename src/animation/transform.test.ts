import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  Transform,
  ReplacementTransform,
  MoveToTarget,
  transform,
  replacementTransform,
  moveToTarget,
  MobjectWithTarget,
} from './transform/Transform';
import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { Circle } from '../mobjects/geometry/Circle';

/** Two circles with distinct styles for point-morphing tests. */
function makePair() {
  const c1 = new Circle({ radius: 1, color: '#ff0000', strokeWidth: 2 });
  c1.opacity = 0.8;
  c1.fillOpacity = 0.2;
  const c2 = new Circle({ radius: 2, color: '#0000ff', strokeWidth: 6 });
  c2.opacity = 0.4;
  c2.fillOpacity = 0.9;
  return { c1, c2 };
}

function vmWithPoints(pts: number[][]) {
  const vm = new VMobject();
  vm.setPoints(pts);
  return vm;
}

describe('Transform', () => {
  it('stores mobject, target, and defaults to 1s duration', () => {
    const { c1, c2 } = makePair();
    const t = new Transform(c1, c2);
    expect(t.mobject).toBe(c1);
    expect(t.target).toBe(c2);
    expect(t.duration).toBe(1);
  });

  it('accepts custom duration', () => {
    const { c1, c2 } = makePair();
    expect(new Transform(c1, c2, { duration: 2.5 }).duration).toBeCloseTo(2.5, 5);
  });

  describe('begin() with two VMobjects (point morphing)', () => {
    it('captures start and target points', () => {
      const { c1, c2 } = makePair();
      const startLen = c1.getPoints().length;
      const t = new Transform(c1, c2);
      t.begin();
      expect(c1.getPoints().length).toBeGreaterThan(0);
      expect(startLen).toBeGreaterThan(0);
    });

    it('captures style start values (verified at alpha 0)', () => {
      const { c1, c2 } = makePair();
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0);
      expect(c1.opacity).toBeCloseTo(0.8, 5);
      expect(c1.fillOpacity).toBeCloseTo(0.2, 5);
      expect(c1.strokeWidth).toBeCloseTo(2, 5);
    });
  });

  describe('interpolate() – point morphing', () => {
    it('at alpha 0 points stay at start', () => {
      const { c1, c2 } = makePair();
      const startPts = c1.getPoints().map((p) => [...p]);
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0);
      const pts = c1.getPoints();
      const n = Math.min(pts.length, startPts.length);
      for (let i = 0; i < n; i++) {
        expect(pts[i][0]).toBeCloseTo(startPts[i][0], 3);
        expect(pts[i][1]).toBeCloseTo(startPts[i][1], 3);
        expect(pts[i][2]).toBeCloseTo(startPts[i][2], 3);
      }
    });

    it('at alpha 1 points reach target', () => {
      const { c1, c2 } = makePair();
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(1);
      const pts = c1.getPoints();
      expect(pts.length).toBeGreaterThan(0);
      expect(typeof pts[pts.length - 1][0]).toBe('number');
    });

    it('at alpha 0.5 points are interpolated halfway', () => {
      const vm1 = vmWithPoints([
        [0, 0, 0],
        [4, 0, 0],
        [4, 4, 0],
        [0, 4, 0],
      ]);
      const vm2 = vmWithPoints([
        [2, 0, 0],
        [6, 0, 0],
        [6, 4, 0],
        [2, 4, 0],
      ]);
      const t = new Transform(vm1, vm2);
      t.begin();
      t.interpolate(0.5);
      const pts = vm1.getPoints();
      expect(pts[0][0]).toBeCloseTo(1, 5);
      expect(pts[0][1]).toBeCloseTo(0, 5);
      expect(pts[1][0]).toBeCloseTo(5, 5);
    });
  });

  describe('style interpolation', () => {
    it('opacity lerps between source and target', () => {
      const { c1, c2 } = makePair();
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0);
      expect(c1.opacity).toBeCloseTo(0.8, 5);
      t.interpolate(0.5);
      expect(c1.opacity).toBeCloseTo(0.6, 5); // 0.8 + (0.4-0.8)*0.5
      t.interpolate(1);
      expect(c1.opacity).toBeCloseTo(0.4, 5);
    });

    it('fillOpacity lerps between source and target', () => {
      const { c1, c2 } = makePair();
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0);
      expect(c1.fillOpacity).toBeCloseTo(0.2, 5);
      t.interpolate(0.5);
      expect(c1.fillOpacity).toBeCloseTo(0.55, 5); // 0.2 + (0.9-0.2)*0.5
      t.interpolate(1);
      expect(c1.fillOpacity).toBeCloseTo(0.9, 5);
    });

    it('strokeWidth lerps between source and target', () => {
      const { c1, c2 } = makePair();
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0);
      expect(c1.strokeWidth).toBeCloseTo(2, 5);
      t.interpolate(0.5);
      expect(c1.strokeWidth).toBeCloseTo(4, 5); // 2 + (6-2)*0.5
      t.interpolate(1);
      expect(c1.strokeWidth).toBeCloseTo(6, 5);
    });
  });

  describe('color interpolation', () => {
    it('stroke color lerps between source and target colors', () => {
      const { c1, c2 } = makePair();
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0);
      expect(new THREE.Color(c1.color).r).toBeCloseTo(1.0, 2); // red
      t.interpolate(1);
      expect(new THREE.Color(c1.color).b).toBeCloseTo(1.0, 2); // blue
      t.interpolate(0.5);
      const mid = new THREE.Color(c1.color);
      expect(mid.r).toBeCloseTo(0.5, 1);
      expect(mid.b).toBeCloseTo(0.5, 1);
    });

    it('fill color lerps when source and target differ', () => {
      const c1 = new Circle({ radius: 1, color: '#ff0000' });
      c1.fillColor = '#00ff00';
      c1.fillOpacity = 0.5;
      const c2 = new Circle({ radius: 2, color: '#0000ff' });
      c2.fillColor = '#ff00ff';
      c2.fillOpacity = 0.5;
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0);
      expect(new THREE.Color(c1.fillColor ?? c1.color).g).toBeCloseTo(1.0, 1);
      t.interpolate(1);
      const end = new THREE.Color(c1.fillColor ?? c1.color);
      expect(end.r).toBeCloseTo(1.0, 1);
      expect(end.b).toBeCloseTo(1.0, 1);
    });
  });

  describe('position interpolation', () => {
    it('source position lerps toward target position', () => {
      const c1 = new Circle({ radius: 1 });
      c1.position.set(0, 0, 0);
      const c2 = new Circle({ radius: 1 });
      c2.position.set(4, 2, 0);
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0);
      expect(c1.position.x).toBeCloseTo(0, 5);
      expect(c1.position.y).toBeCloseTo(0, 5);
      t.interpolate(0.5);
      expect(c1.position.x).toBeCloseTo(2, 5);
      expect(c1.position.y).toBeCloseTo(1, 5);
      t.interpolate(1);
      expect(c1.position.x).toBeCloseTo(4, 5);
      expect(c1.position.y).toBeCloseTo(2, 5);
    });
  });

  describe('finish()', () => {
    it('sets final points, styles, and color from target', () => {
      const { c1, c2 } = makePair();
      const t = new Transform(c1, c2);
      t.begin();
      t.finish();
      expect(c1.opacity).toBeCloseTo(c2.opacity, 5);
      expect(c1.fillOpacity).toBeCloseTo(c2.fillOpacity, 5);
      expect(c1.strokeWidth).toBeCloseTo(c2.strokeWidth, 5);
      expect(c1.color.toLowerCase()).toBe(c2.color.toLowerCase());
    });

    it('sets final position from target', () => {
      const c1 = new Circle({ radius: 1 });
      c1.position.set(0, 0, 0);
      const c2 = new Circle({ radius: 1 });
      c2.position.set(3, 5, 0);
      const t = new Transform(c1, c2);
      t.begin();
      t.finish();
      expect(c1.position.x).toBeCloseTo(3, 5);
      expect(c1.position.y).toBeCloseTo(5, 5);
    });

    it('marks the animation as finished', () => {
      const { c1, c2 } = makePair();
      const t = new Transform(c1, c2);
      t.begin();
      expect(t.isFinished()).toBe(false);
      t.finish();
      expect(t.isFinished()).toBe(true);
    });
  });

  describe('cross-fade mode', () => {
    it('uses cross-fade when both VMobjects have zero points', () => {
      const vm1 = new VMobject();
      const vm2 = new VMobject();
      vm1.opacity = 1;
      vm2.opacity = 1;
      const t = new Transform(vm1, vm2);
      t.begin();
      t.interpolate(0);
      expect(vm1.opacity).toBeCloseTo(1, 5);
      t.interpolate(0.5);
      expect(vm1.opacity).toBeCloseTo(0.5, 5); // 1*(1-0.5)
      t.interpolate(1);
      expect(vm1.opacity).toBeCloseTo(0, 5);
    });

    it('uses cross-fade when source is a non-VMobject Mobject', () => {
      class SimpleMobject extends Mobject {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        protected _createThreeObject(): THREE.Object3D {
          return new THREE.Group();
        }
      }
      const m1 = new SimpleMobject();
      const m2 = new SimpleMobject();
      m1.opacity = 1;
      m2.opacity = 1;
      const t = new Transform(m1, m2);
      t.begin();
      t.interpolate(0.5);
      expect(m1.opacity).toBeCloseTo(0.5, 5);
    });
  });

  describe('rotation and scale interpolation', () => {
    it('euler angles lerp between source and target', () => {
      const c1 = new Circle({ radius: 1 });
      c1.rotation.set(0, 0, 0);
      const c2 = new Circle({ radius: 1 });
      c2.rotation.set(Math.PI, 0, 0);
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0.5);
      expect(c1.rotation.x).toBeCloseTo(Math.PI / 2, 5);
    });

    it('scaleVector lerps between source and target', () => {
      const c1 = new Circle({ radius: 1 });
      c1.scaleVector.set(1, 1, 1);
      const c2 = new Circle({ radius: 1 });
      c2.scaleVector.set(3, 3, 3);
      const t = new Transform(c1, c2);
      t.begin();
      t.interpolate(0.5);
      expect(c1.scaleVector.x).toBeCloseTo(2, 5);
      expect(c1.scaleVector.y).toBeCloseTo(2, 5);
      expect(c1.scaleVector.z).toBeCloseTo(2, 5);
    });
  });
});

describe('ReplacementTransform', () => {
  it('extends Transform and stores mobject/target', () => {
    const { c1, c2 } = makePair();
    const rt = new ReplacementTransform(c1, c2);
    expect(rt).toBeInstanceOf(Transform);
    expect(rt.mobject).toBe(c1);
    expect(rt.target).toBe(c2);
  });

  it('inherits point morphing interpolation', () => {
    const { c1, c2 } = makePair();
    const rt = new ReplacementTransform(c1, c2);
    rt.begin();
    rt.interpolate(0);
    expect(c1.opacity).toBeCloseTo(0.8, 5);
    rt.interpolate(0.5);
    expect(c1.opacity).toBeCloseTo(0.6, 5);
    rt.interpolate(1);
    expect(c1.opacity).toBeCloseTo(0.4, 5);
  });

  it('finish marks animation as finished', () => {
    const { c1, c2 } = makePair();
    const rt = new ReplacementTransform(c1, c2);
    rt.begin();
    rt.finish();
    expect(rt.isFinished()).toBe(true);
  });
});

describe('MoveToTarget', () => {
  it('throws if mobject.targetCopy is null', () => {
    const c = new Circle({ radius: 1 });
    expect(() => {
      new MoveToTarget(c as unknown as MobjectWithTarget);
    }).toThrow('MoveToTarget requires mobject.targetCopy to be set');
  });

  it('works when targetCopy is set via generateTarget', () => {
    const c = new Circle({ radius: 1, color: '#ff0000' });
    c.opacity = 1;
    c.generateTarget();
    (c.targetCopy as VMobject).opacity = 0.3;
    (c.targetCopy as Circle).position.set(5, 0, 0);
    const mt = new MoveToTarget(c as unknown as MobjectWithTarget);
    expect(mt.mobject).toBe(c);
    expect(mt.target).toBe(c.targetCopy);
    mt.begin();
    mt.interpolate(0.5);
    expect(c.opacity).toBeCloseTo(0.65, 5); // 1 + (0.3-1)*0.5
    expect(c.position.x).toBeCloseTo(2.5, 5);
  });
});

describe('factory functions', () => {
  it('transform() creates Transform with options', () => {
    const { c1, c2 } = makePair();
    const t = transform(c1, c2, { duration: 3 });
    expect(t).toBeInstanceOf(Transform);
    expect(t.mobject).toBe(c1);
    expect(t.target).toBe(c2);
    expect(t.duration).toBeCloseTo(3, 5);
  });

  it('replacementTransform() creates ReplacementTransform with options', () => {
    const { c1, c2 } = makePair();
    const rt = replacementTransform(c1, c2, { duration: 0.5 });
    expect(rt).toBeInstanceOf(ReplacementTransform);
    expect(rt).toBeInstanceOf(Transform);
    expect(rt.mobject).toBe(c1);
    expect(rt.target).toBe(c2);
    expect(rt.duration).toBeCloseTo(0.5, 5);
  });

  it('moveToTarget() creates MoveToTarget', () => {
    const c = new Circle({ radius: 1 });
    c.generateTarget();
    const mt = moveToTarget(c as unknown as MobjectWithTarget);
    expect(mt).toBeInstanceOf(MoveToTarget);
    expect(mt).toBeInstanceOf(Transform);
  });

  it('moveToTarget() throws without targetCopy', () => {
    const c = new Circle({ radius: 1 });
    expect(() => {
      moveToTarget(c as unknown as MobjectWithTarget);
    }).toThrow('MoveToTarget requires mobject.targetCopy to be set');
  });
});

describe('edge cases', () => {
  it('identical source and target is a no-op', () => {
    const c1 = new Circle({ radius: 1, color: '#ff0000' });
    c1.opacity = 1;
    c1.fillOpacity = 0.5;
    const c2 = new Circle({ radius: 1, color: '#ff0000' });
    c2.opacity = 1;
    c2.fillOpacity = 0.5;
    const t = new Transform(c1, c2);
    t.begin();
    t.interpolate(0.5);
    expect(c1.opacity).toBeCloseTo(1, 5);
    expect(c1.fillOpacity).toBeCloseTo(0.5, 5);
  });

  it('manually set VMobject points interpolate correctly', () => {
    const vm1 = vmWithPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    const vm2 = vmWithPoints([
      [2, 2, 0],
      [3, 2, 0],
      [3, 3, 0],
      [2, 3, 0],
    ]);
    const t = new Transform(vm1, vm2);
    t.begin();
    t.interpolate(0);
    expect(vm1.getPoints()[0][0]).toBeCloseTo(0, 5);
    expect(vm1.getPoints()[0][1]).toBeCloseTo(0, 5);
    t.interpolate(1);
    expect(vm1.getPoints()[0][0]).toBeCloseTo(2, 5);
    expect(vm1.getPoints()[0][1]).toBeCloseTo(2, 5);
    expect(vm1.getPoints()[2][0]).toBeCloseTo(3, 5);
    expect(vm1.getPoints()[2][1]).toBeCloseTo(3, 5);
  });

  it('multiple interpolate calls update progressively', () => {
    const { c1, c2 } = makePair();
    const t = new Transform(c1, c2);
    t.begin();
    t.interpolate(0.25);
    expect(c1.opacity).toBeCloseTo(0.7, 5); // 0.8 + (0.4-0.8)*0.25
    t.interpolate(0.75);
    expect(c1.opacity).toBeCloseTo(0.5, 5); // 0.8 + (0.4-0.8)*0.75
  });

  it('zero-duration transform is valid', () => {
    const { c1, c2 } = makePair();
    const t = new Transform(c1, c2, { duration: 0 });
    expect(t.duration).toBe(0);
    t.begin();
    t.interpolate(1);
    expect(c1.opacity).toBeCloseTo(c2.opacity, 5);
  });
});

describe('cross-fade finish()', () => {
  it('finish() reparents target under source for non-VMobject Mobjects', () => {
    class SimpleMobject extends Mobject {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      protected _createThreeObject(): THREE.Object3D {
        return new THREE.Group();
      }
    }
    const m1 = new SimpleMobject();
    const m2 = new SimpleMobject();
    m1.opacity = 1;
    m2.opacity = 0.7;

    // Give them different positions
    m1.position.set(0, 0, 0);
    m2.position.set(3, 4, 0);

    // Attach m1 to a parent so the scene graph add logic works
    const parent = new THREE.Group();
    parent.add(m1.getThreeObject());

    const t = new Transform(m1, m2);
    t.begin();
    t.interpolate(0.5);
    t.finish();

    // After cross-fade finish, source opacity should be 0
    // and target should be reparented under source
    expect(m1.opacity).toBeCloseTo(0, 3);
    expect(t.isFinished()).toBe(true);
  });

  it('finish() handles cross-fade for VMobjects with zero points', () => {
    const vm1 = new VMobject();
    const vm2 = new VMobject();
    vm1.opacity = 1;
    vm2.opacity = 0.8;
    vm1.position.set(0, 0, 0);
    vm2.position.set(2, 3, 0);

    // Attach vm1 to a parent so cross-fade path adds target to scene graph
    const parent = new THREE.Group();
    parent.add(vm1.getThreeObject());

    const t = new Transform(vm1, vm2);
    t.begin();
    t.interpolate(0.5);
    t.finish();

    // The non-Text cross-fade path should execute finish without error
    expect(t.isFinished()).toBe(true);
  });

  it('cross-fade adds target to scene graph when source has parent', () => {
    class SimpleMobject extends Mobject {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      protected _createThreeObject(): THREE.Object3D {
        return new THREE.Group();
      }
    }
    const m1 = new SimpleMobject();
    const m2 = new SimpleMobject();

    // Source attached to parent, target is not
    const parent = new THREE.Group();
    parent.add(m1.getThreeObject());
    expect(m2.getThreeObject().parent).toBeFalsy();

    const t = new Transform(m1, m2);
    t.begin();

    // After begin(), target should be added to the same parent
    // because sourceObj.parent exists and targetObj has no parent
    expect(m2.getThreeObject().parent).toBeTruthy();
  });

  it('cross-fade position interpolation works for non-VMobject', () => {
    class SimpleMobject extends Mobject {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      protected _createThreeObject(): THREE.Object3D {
        return new THREE.Group();
      }
    }
    const m1 = new SimpleMobject();
    const m2 = new SimpleMobject();
    m1.position.set(0, 0, 0);
    m2.position.set(10, 0, 0);
    m1.opacity = 1;
    m2.opacity = 1;

    const t = new Transform(m1, m2);
    t.begin();
    t.interpolate(0.5);

    // Position should be interpolated halfway
    expect(m1.position.x).toBeCloseTo(5, 3);
  });

  it('cross-fade for zero-point VMobjects interpolates position', () => {
    const vm1 = new VMobject();
    const vm2 = new VMobject();
    vm1.position.set(0, 0, 0);
    vm2.position.set(6, 0, 0);
    vm1.opacity = 1;
    vm2.opacity = 1;

    const parent = new THREE.Group();
    parent.add(vm1.getThreeObject());

    const t = new Transform(vm1, vm2);
    t.begin();
    t.interpolate(0.5);

    // Position should be halfway
    expect(vm1.position.x).toBeCloseTo(3, 3);
    // Opacity should be fading out (source: 1*(1-0.5) = 0.5)
    expect(vm1.opacity).toBeCloseTo(0.5, 3);
  });
});

describe('cross-fade finish() with getTextureMesh (Text-like)', () => {
  it('swaps texture and geometry when both source and target have getTextureMesh', () => {
    // Create mobjects that look like Text objects with getTextureMesh
    class TextLikeMobject extends Mobject {
      private _mesh: THREE.Mesh;

      constructor() {
        super();
        const geometry = new THREE.PlaneGeometry(1, 1);
        // Use a DataTexture instead of CanvasTexture to avoid DOM dependency
        const dataTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
        const material = new THREE.MeshBasicMaterial({
          transparent: true,
          map: dataTexture,
        });
        this._mesh = new THREE.Mesh(geometry, material);
      }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      protected _createThreeObject(): THREE.Object3D {
        const group = new THREE.Group();
        group.add(this._mesh);
        return group;
      }

      getTextureMesh(): THREE.Mesh | null {
        return this._mesh;
      }
    }

    const m1 = new TextLikeMobject();
    const m2 = new TextLikeMobject();
    m1.opacity = 1;
    m2.opacity = 0.8;
    m1.position.set(0, 0, 0);
    m2.position.set(2, 3, 0);

    // Attach m1 to a parent so cross-fade begin() works
    const parent = new THREE.Group();
    parent.add(m1.getThreeObject());

    const t = new Transform(m1, m2);
    t.begin();
    t.interpolate(0.5);
    t.finish();

    // After Text-like cross-fade finish:
    // source should be positioned at target location
    expect(m1.position.x).toBeCloseTo(2, 3);
    expect(m1.position.y).toBeCloseTo(3, 3);
    expect(t.isFinished()).toBe(true);
  });

  it('removes target from scene graph after Text-like cross-fade finish', () => {
    class TextLikeMobject extends Mobject {
      private _mesh: THREE.Mesh;

      constructor() {
        super();
        const geometry = new THREE.PlaneGeometry(1, 1);
        const dataTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
        const material = new THREE.MeshBasicMaterial({
          transparent: true,
          map: dataTexture,
        });
        this._mesh = new THREE.Mesh(geometry, material);
      }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      protected _createThreeObject(): THREE.Object3D {
        const group = new THREE.Group();
        group.add(this._mesh);
        return group;
      }

      getTextureMesh(): THREE.Mesh | null {
        return this._mesh;
      }
    }

    const m1 = new TextLikeMobject();
    const m2 = new TextLikeMobject();
    m1.opacity = 1;
    m2.opacity = 1;

    const parent = new THREE.Group();
    parent.add(m1.getThreeObject());

    const t = new Transform(m1, m2);
    t.begin();

    // Target should have been added to scene graph during begin()
    expect(m2.getThreeObject().parent).toBeTruthy();

    t.finish();

    // After finish, target should be removed from scene graph
    expect(m2.getThreeObject().parent).toBeFalsy();
  });
});

describe('finish() with fill color interpolation', () => {
  it('sets final fill color when source and target differ', () => {
    const c1 = new Circle({ radius: 1, color: '#ff0000' });
    c1.fillColor = '#00ff00';
    c1.fillOpacity = 0.5;
    const c2 = new Circle({ radius: 2, color: '#0000ff' });
    c2.fillColor = '#ff00ff';
    c2.fillOpacity = 0.5;

    const t = new Transform(c1, c2);
    t.begin();
    t.finish();

    // fillColor should match target
    const finalFill = new THREE.Color(c1.fillColor ?? c1.color);
    const expectedFill = new THREE.Color('#ff00ff');
    expect(finalFill.r).toBeCloseTo(expectedFill.r, 1);
    expect(finalFill.g).toBeCloseTo(expectedFill.g, 1);
    expect(finalFill.b).toBeCloseTo(expectedFill.b, 1);
  });

  it('finish() sets rotation and scale from target', () => {
    const c1 = new Circle({ radius: 1 });
    c1.rotation.set(0, 0, 0);
    c1.scaleVector.set(1, 1, 1);
    const c2 = new Circle({ radius: 1 });
    c2.rotation.set(Math.PI / 4, Math.PI / 2, 0);
    c2.scaleVector.set(2, 3, 1);

    const t = new Transform(c1, c2);
    t.begin();
    t.finish();

    expect(c1.rotation.x).toBeCloseTo(Math.PI / 4, 5);
    expect(c1.rotation.y).toBeCloseTo(Math.PI / 2, 5);
    expect(c1.scaleVector.x).toBeCloseTo(2, 5);
    expect(c1.scaleVector.y).toBeCloseTo(3, 5);
  });
});
