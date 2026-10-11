/**
 * Default serializers for the common mobjects.
 *
 * Each serializer captures only the type-specific, constructor-relevant
 * (unscaled) props. The framework (`serialize.ts`) captures transform, style,
 * and children generically, so these never repeat them. Reading an unscaled
 * base value (e.g. `_radius`, not `getRadius()`) keeps scale in the transform
 * only, which is what makes serialize→deserialize→serialize stable.
 *
 * Registering runs once as an import side effect from the folder entry point.
 */

import { Circle } from '../mobjects/geometry/Circle';
import { Rectangle, Square } from '../mobjects/geometry/Rectangle';
import { Line } from '../mobjects/geometry/Line';
import { Dot } from '../mobjects/geometry/Dot';
import { Polygon } from '../mobjects/geometry/Polygon';
import { Group } from '../core/Group';
import { VGroup } from '../core/VGroup';
import { Text } from '../mobjects/text/Text';
import { MathTex } from '../mobjects/text/MathTex';
import { registerSerializableMobject } from './registry';
import { readBoolean, readNumber, readString, readVec3, readVec3Array } from './props';
import type { Vec3 } from './types';

/** Base-size (pre-scale) fields read by their serializers. */
interface CircleInternals {
  _radius: number;
  _numPoints: number;
}
interface RectangleInternals {
  _width: number;
  _height: number;
}
interface LineInternals {
  _start: Vec3;
  _end: Vec3;
}
interface PolygonInternals {
  _closed: boolean;
}
interface TextInternals {
  _fontWeight: string | number;
  _fontStyle: string;
  _lineHeight: number;
  _letterSpacing: number;
  _textAlign: 'left' | 'center' | 'right';
}
interface MathTexInternals {
  _fontSize: number;
  _displayMode: boolean;
}

/** Read a font weight, which manim accepts as a string or a number. */
function readFontWeight(value: unknown): string | number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return readString(value, 'normal');
}

/** Read a text alignment, falling back to the manim default. */
function readTextAlign(value: unknown): 'left' | 'center' | 'right' {
  return value === 'left' || value === 'right' ? value : 'center';
}

export function registerDefaultSerializers(): void {
  // ── geometry ───────────────────────────────────────────────────────────
  registerSerializableMobject<Circle>('Circle', {
    serialize: (c) => {
      const internals = c as unknown as CircleInternals;
      return { radius: internals._radius, numPoints: internals._numPoints };
    },
    deserialize: (props) =>
      new Circle({
        radius: readNumber(props.radius, 1),
        numPoints: readNumber(props.numPoints, 64),
      }),
  });

  registerSerializableMobject<Rectangle>('Rectangle', {
    serialize: (r) => {
      const internals = r as unknown as RectangleInternals;
      return { width: internals._width, height: internals._height };
    },
    deserialize: (props) =>
      new Rectangle({ width: readNumber(props.width, 2), height: readNumber(props.height, 1) }),
  });

  registerSerializableMobject<Square>('Square', {
    serialize: (s) => ({ sideLength: (s as unknown as RectangleInternals)._width }),
    deserialize: (props) => new Square({ sideLength: readNumber(props.sideLength, 2) }),
  });

  registerSerializableMobject<Line>('Line', {
    serialize: (l) => {
      const internals = l as unknown as LineInternals;
      return { start: [...internals._start], end: [...internals._end] };
    },
    deserialize: (props) =>
      new Line({ start: readVec3(props.start, [0, 0, 0]), end: readVec3(props.end, [1, 0, 0]) }),
  });

  registerSerializableMobject<Dot>('Dot', {
    serialize: (d) => ({ radius: (d as unknown as CircleInternals)._radius }),
    // Dot's center is carried by transform.position; `point` stays default.
    deserialize: (props) => new Dot({ radius: readNumber(props.radius, 0.08) }),
  });

  registerSerializableMobject<Polygon>('Polygon', {
    serialize: (p) => ({
      vertices: p.getVertices().map((v) => [...v]),
      closed: (p as unknown as PolygonInternals)._closed,
    }),
    deserialize: (props) => {
      const vertices = readVec3Array(props.vertices);
      return new Polygon({
        vertices:
          vertices.length >= 2
            ? vertices
            : [
                [0, 0, 0],
                [1, 0, 0],
              ],
        closed: readBoolean(props.closed, true),
      });
    },
  });

  // ── groups ───────────────────────────────────────────────────────────
  // Children are captured and restored by the framework; props carry nothing.
  registerSerializableMobject<Group>('Group', {
    serialize: () => ({}),
    deserialize: () => new Group(),
  });

  registerSerializableMobject<VGroup>('VGroup', {
    serialize: () => ({}),
    deserialize: () => new VGroup(),
  });

  // ── text ───────────────────────────────────────────────────────────
  registerSerializableMobject<Text>('Text', {
    serialize: (t) => {
      const internals = t as unknown as TextInternals;
      return {
        text: t.getText(),
        fontSize: t.getFontSize(),
        fontFamily: t.getFontFamily(),
        fontWeight: internals._fontWeight,
        fontStyle: internals._fontStyle,
        lineHeight: internals._lineHeight,
        letterSpacing: internals._letterSpacing,
        textAlign: internals._textAlign,
      };
    },
    deserialize: (props) =>
      new Text({
        text: readString(props.text, ''),
        fontSize: readNumber(props.fontSize, 48),
        fontFamily: readString(props.fontFamily, 'CMU Serif, Georgia, Times New Roman, serif'),
        fontWeight: readFontWeight(props.fontWeight),
        fontStyle: readString(props.fontStyle, 'normal'),
        lineHeight: readNumber(props.lineHeight, 1.2),
        letterSpacing: readNumber(props.letterSpacing, 0),
        textAlign: readTextAlign(props.textAlign),
      }),
  });

  registerSerializableMobject<MathTex>('MathTex', {
    serialize: (m) => {
      const internals = m as unknown as MathTexInternals;
      return {
        latex: m.getLatex(),
        fontSize: internals._fontSize,
        displayMode: internals._displayMode,
      };
    },
    deserialize: (props) =>
      new MathTex({
        latex: readString(props.latex, ''),
        fontSize: readNumber(props.fontSize, 1),
        displayMode: readBoolean(props.displayMode, true),
      }),
  });
}
