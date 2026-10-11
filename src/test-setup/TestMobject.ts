import * as THREE from 'three';
import { Mobject, type MobjectOptions } from '../core/Mobject';

/**
 * Minimal concrete Mobject for tests.
 *
 * The base {@link Mobject} is abstract and cannot be instantiated. Tests that
 * need a plain, non-VMobject mobject (for example to exercise the opacity
 * fallback path of an animation) use this stand-in. It implements only the
 * abstract members with the smallest valid behavior:
 *   - `_createThreeObject` returns an empty Three.js object.
 *   - `copy` returns a new instance with the base attributes copied over.
 *   - `normalizeTransform` is a no-op that returns `this`.
 *
 * Keep it a direct subclass of Mobject (not VMobject) so tests that check
 * non-VMobject behavior still exercise that path.
 */
export class TestMobject extends Mobject {
  constructor(options?: MobjectOptions) {
    super(options);
  }

  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Object3D();
  }

  override copy(): Mobject {
    const clone = new TestMobject({ userId: this.userId });
    this._copyBaseAttributesInto(clone);
    return clone;
  }

  override normalizeTransform(): this {
    return this;
  }
}
