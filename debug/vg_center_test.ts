import { Line } from '../src/mobjects/geometry/Line';
import { Dot } from '../src/mobjects/geometry/Dot';
import { VGroup } from '../src/core/VGroup';

const line = new Line([0, 0, 0], [1, 0, 0]);

const p = new Dot();
p.moveTo([0.9, 0, 0]);

const g = new VGroup(line, p);

console.log('line center', line.getCenter());
console.log('dot center', p.getCenter());
console.log('group center', g.getCenter());
