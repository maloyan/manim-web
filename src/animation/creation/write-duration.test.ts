import { describe, it, expect } from 'vitest';
import { Write } from './Create';
import { VGroup } from '../../core/VGroup';
import { Square } from '../../mobjects/geometry';

const squares = (n: number) => new VGroup(...Array.from({ length: n }, () => new Square()));

describe('Write default run time (ManimCE parity)', () => {
  // MIGRATION: example for the property
  //   ∀ VMobject m without an explicit duration:
  //   new Write(m).duration === (m.familyMembersWithPoints().length < 15 ? 1 : 2),
  //   and an explicit duration always wins.
  // Replace with a property test once the suite lands.
  it('is 1 s below 15 sub-paths and 2 s from 15 on, like ManimCE', () => {
    expect(new Write(squares(14)).duration).toBe(1);
    expect(new Write(squares(15)).duration).toBe(2);
  });

  it('keeps an explicit duration', () => {
    expect(new Write(squares(30), { duration: 0.5 }).duration).toBe(0.5);
  });
});
