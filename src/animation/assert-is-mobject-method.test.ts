import { describe, it, expect } from 'vitest';
import { assertIsMobjectMethod } from './Always';
import { VMobject } from '../core/VMobject';

/**
 * Tests for `assertIsMobjectMethod` (Manim CE `assert_is_mobject_method`).
 * The pair `(mobject, methodName)` must name a method of a Mobject, mirroring
 * the `(mob, methodName)` API that `always` / `fAlways` accept.
 */
describe('assertIsMobjectMethod', () => {
  it('accepts a real mobject method name', () => {
    const vm = new VMobject();
    expect(() => assertIsMobjectMethod(vm, 'setX')).not.toThrow();
  });

  it('throws when the value is not a Mobject', () => {
    expect(() => assertIsMobjectMethod({}, 'setX')).toThrow(/expected a Mobject/);
    expect(() => assertIsMobjectMethod(null, 'setX')).toThrow(/expected a Mobject, got null/);
  });

  it('throws when the name is not a method of the mobject', () => {
    const vm = new VMobject();
    expect(() => assertIsMobjectMethod(vm, 'notAMethod')).toThrow(/not a method/);
  });
});
