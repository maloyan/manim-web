import { describe, it, expect } from 'vitest';
import { Pixels, Degrees, Munits, Percent } from './unit';
import { RIGHT, UP, OUT } from '../core/Mobject';
import { DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_PIXEL_WIDTH } from '../constants';

describe('unit (ManimCE parity)', () => {
  it('Degrees converts degrees to radians', () => {
    expect(Degrees(180)).toBeCloseTo(Math.PI);
    expect(Degrees(90)).toBeCloseTo(Math.PI / 2);
  });

  it('Percent maps a fraction of the frame to scene units', () => {
    expect(Percent(RIGHT, 50)).toBeCloseTo(DEFAULT_FRAME_WIDTH / 2);
    expect(Percent(UP, 25)).toBeCloseTo(DEFAULT_FRAME_HEIGHT / 4);
  });

  it('Percent rejects the Z axis', () => {
    expect(() => Percent(OUT, 50)).toThrow();
  });

  it('Pixels scales by frame width over pixel width', () => {
    expect(Pixels(DEFAULT_PIXEL_WIDTH)).toBeCloseTo(DEFAULT_FRAME_WIDTH);
  });

  it('Munits is an identity conversion', () => {
    expect(Munits(3)).toBe(3);
  });
});
