import { describe, it } from 'vitest';
import { PointMobject } from './mobjects/point';
import { Group } from './core/Group';

describe('debug', () => {
  it('probe', () => {
    const p = new PointMobject({ position: [1, 0, 0] });
    const g = new Group(p);

    console.log('after construction g.position:', g.position.x, g.position.y);
    console.log('after construction p.position:', p.position.x, p.position.y);

    g.scaleVector.set(2, 2, 2);
    g.rotation.set(0, 0, Math.PI / 2);
    g.position.set(3, 0, 0);

    g.normalizeTransform();

    console.log('after normalize g.position:', g.position.x, g.position.y);
    console.log('after normalize p.position:', p.position.x, p.position.y);
    console.log('after normalize p.getPosition():', p.getPosition());
  });
});
