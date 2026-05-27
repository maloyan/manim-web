import { Line } from '../src/mobjects/geometry/Line';
import { Dot } from '../src/mobjects/geometry/Dot';
import { VGroup } from '../src/core/VGroup';

function lineInfo(line: Line) {
  return {
    start: line.getStart(),
    end: line.getEnd(),
    center: line.getCenter(),
    length: line.getLength(),
  };
}

// Case A: set children directly
const lineA = new Line([0, 0, 0], [1, 0, 0]);
lineA.position.x = 1;
const dotA = new Dot().moveTo([1, 0, 0]);
const gA = new VGroup(lineA, dotA);

console.log('A start', {
  line: lineInfo(lineA),
  dotCenter: dotA.getCenter(),
  gCenter: gA.getCenter(),
});
gA.scale(2);
console.log('A end  ', {
  line: lineInfo(lineA),
  dotCenter: dotA.getCenter(),
  gCenter: gA.getCenter(),
});

// Case B: set group position instead
const lineB = new Line([0, 0, 0], [1, 0, 0]);
const dotB = new Dot().moveTo([0, 0, 0]);
const gB = new VGroup(lineB, dotB);
gB.position.x = 1;

console.log('B start', {
  line: lineInfo(lineB),
  dotCenter: dotB.getCenter(),
  gCenter: gB.getCenter(),
});
gB.scale(2);
console.log('B end  ', {
  line: lineInfo(lineB),
  dotCenter: dotB.getCenter(),
  gCenter: gB.getCenter(),
});
