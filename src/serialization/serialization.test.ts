import { describe, it, expect, afterEach } from 'vitest';
import {
  serializeScene,
  deserializeScene,
  serializeMobject,
  deserializeMobject,
  registerSerializableMobject,
  getSerializableTypes,
  unregisterSerializableMobject,
  type SerializedMobject,
  type SerializedScene,
} from './index';
import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { VGroup } from '../core/VGroup';
import { Group } from '../core/Group';
import { Scene } from '../core/Scene';
import { Circle } from '../mobjects/geometry/Circle';
import { Rectangle, Square } from '../mobjects/geometry/Rectangle';
import { Line } from '../mobjects/geometry/Line';
import { Dot } from '../mobjects/geometry/Dot';
import { Polygon } from '../mobjects/geometry/Polygon';

/** Minimal container for deserializeScene that records what was added. */
function makeContainer(): { added: Mobject[]; add: (...m: Mobject[]) => void } {
  const added: Mobject[] = [];
  return { added, add: (...m: Mobject[]) => added.push(...m) };
}

describe('serializeMobject – geometry', () => {
  it('serializes a Circle with type, radius, transform, and style', () => {
    const c = new Circle({ radius: 2, color: '#ff0000', fillOpacity: 0.5 });
    const json = serializeMobject(c);
    expect(json.type).toBe('Circle');
    expect(json.unknown).toBeUndefined();
    expect(json.props.radius).toBe(2);
    expect(json.transform.position).toEqual([0, 0, 0]);
    expect(json.style.fillOpacity).toBeCloseTo(0.5);
    expect(json.style.strokeColor?.toLowerCase()).toBe('#ff0000');
  });

  it('captures the Circle center via transform.position', () => {
    const c = new Circle({ radius: 1, center: [3, -2, 1] });
    const json = serializeMobject(c);
    expect(json.transform.position).toEqual([3, -2, 1]);
  });
});

describe('round-trip – geometry props preserved', () => {
  const cases: Array<{ name: string; make: () => Mobject; instanceOf: unknown }> = [
    {
      name: 'Circle',
      make: () => new Circle({ radius: 2.5, color: '#112233' }),
      instanceOf: Circle,
    },
    {
      name: 'Rectangle',
      make: () => new Rectangle({ width: 4, height: 1.5, color: '#00ff00' }),
      instanceOf: Rectangle,
    },
    { name: 'Square', make: () => new Square({ sideLength: 3 }), instanceOf: Square },
    {
      name: 'Line',
      make: () => new Line({ start: [-1, -1, 0], end: [2, 3, 0] }),
      instanceOf: Line,
    },
    { name: 'Dot', make: () => new Dot({ point: [1, 2, 0], radius: 0.12 }), instanceOf: Dot },
    {
      name: 'Polygon',
      make: () =>
        new Polygon({
          vertices: [
            [0, 1, 0],
            [-1, -0.5, 0],
            [1, -0.5, 0],
          ],
        }),
      instanceOf: Polygon,
    },
  ];

  for (const { name, make, instanceOf } of cases) {
    it(`${name}: serialize→deserialize→serialize is stable`, () => {
      const original = make();
      const json1 = serializeMobject(original);
      const restored = deserializeMobject(json1);
      expect(restored).not.toBeNull();
      expect(restored).toBeInstanceOf(instanceOf as never);
      const json2 = serializeMobject(restored as Mobject);
      expect(json2).toEqual(json1);
    });
  }

  it('Circle: radius, color and position survive a round trip', () => {
    const c = new Circle({ radius: 3, color: '#abcdef', fillOpacity: 0.25, center: [1, 2, 0] });
    const restored = deserializeMobject(serializeMobject(c)) as Circle;
    expect(restored.getRadius()).toBeCloseTo(3);
    expect(restored.color.toLowerCase()).toBe('#abcdef');
    expect(restored.fillOpacity).toBeCloseTo(0.25);
    expect(restored.getCenter()).toEqual([1, 2, 0]);
  });

  it('Rectangle: width and height survive a round trip', () => {
    const r = new Rectangle({ width: 5, height: 2 });
    const restored = deserializeMobject(serializeMobject(r)) as Rectangle;
    expect(restored.getWidth()).toBeCloseTo(5);
    expect(restored.getHeight()).toBeCloseTo(2);
  });

  it('Line: start and end survive a round trip', () => {
    const l = new Line({ start: [-2, 0, 0], end: [2, 1, 0] });
    const restored = deserializeMobject(serializeMobject(l)) as Line;
    expect(restored.getStart()).toEqual([-2, 0, 0]);
    expect(restored.getEnd()).toEqual([2, 1, 0]);
  });

  it('Polygon: vertices survive a round trip', () => {
    const verts: [number, number, number][] = [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
    ];
    const p = new Polygon({ vertices: verts });
    const restored = deserializeMobject(serializeMobject(p)) as Polygon;
    expect(restored.getVertices()).toEqual(verts);
  });

  it('preserves an explicit non-uniform transform (position/rotation/scale)', () => {
    const r = new Rectangle({ width: 2, height: 2 });
    r.position.set(1, 2, 3);
    r.rotation.set(0.1, 0.2, 0.3);
    r.scaleVector.set(2, 2, 2);
    const restored = deserializeMobject(serializeMobject(r)) as Rectangle;
    expect([restored.position.x, restored.position.y, restored.position.z]).toEqual([1, 2, 3]);
    expect(restored.rotation.x).toBeCloseTo(0.1);
    expect(restored.scaleVector.x).toBeCloseTo(2);
  });
});

describe('submobject tree', () => {
  it('serializes and restores a VGroup of children', () => {
    const group = new VGroup(new Circle({ radius: 1 }), new Square({ sideLength: 2 }));
    const json = serializeMobject(group);
    expect(json.type).toBe('VGroup');
    expect(json.children.length).toBe(2);
    expect(json.children[0].type).toBe('Circle');
    expect(json.children[1].type).toBe('Square');

    const restored = deserializeMobject(json) as VGroup;
    expect(restored).toBeInstanceOf(VGroup);
    expect(restored.children.length).toBe(2);
    expect(restored.children[0]).toBeInstanceOf(Circle);
    expect((restored.children[0] as Circle).getRadius()).toBeCloseTo(1);
    expect(restored.children[1]).toBeInstanceOf(Square);
  });

  it('serializes and restores a plain Group of children', () => {
    const group = new Group(new Circle({ radius: 2 }), new Dot({ point: [1, 0, 0] }));
    const restored = deserializeMobject(serializeMobject(group)) as Group;
    expect(restored).toBeInstanceOf(Group);
    expect(restored.children.length).toBe(2);
    expect(restored.children[0]).toBeInstanceOf(Circle);
    expect(restored.children[1]).toBeInstanceOf(Dot);
  });
});

describe('registry extension', () => {
  afterEach(() => {
    unregisterSerializableMobject('CustomWidget');
  });

  class CustomWidget extends VMobject {
    size: number;
    constructor(size = 1) {
      super();
      this.size = size;
    }
  }

  it('supports registering a new serializable type', () => {
    expect(getSerializableTypes()).not.toContain('CustomWidget');
    registerSerializableMobject('CustomWidget', {
      serialize: (m: CustomWidget) => ({ size: m.size }),
      deserialize: (props) => new CustomWidget(typeof props.size === 'number' ? props.size : 1),
    });
    expect(getSerializableTypes()).toContain('CustomWidget');

    const widget = new CustomWidget(7);
    const json = serializeMobject(widget);
    expect(json.type).toBe('CustomWidget');
    expect(json.unknown).toBeUndefined();
    expect(json.props.size).toBe(7);

    const restored = deserializeMobject(json) as CustomWidget;
    expect(restored).toBeInstanceOf(CustomWidget);
    expect(restored.size).toBe(7);
  });
});

describe('unknown types', () => {
  class Mystery extends VMobject {}

  it('serializes an unregistered type with an unknown marker', () => {
    const m = new Mystery();
    m.position.set(1, 1, 1);
    const json = serializeMobject(m);
    expect(json.type).toBe('Mystery');
    expect(json.unknown).toBe(true);
    // transform is still captured for informational/debug purposes.
    expect(json.transform.position).toEqual([1, 1, 1]);
  });

  it('skips an unknown type gracefully on restore (returns null, does not throw)', () => {
    const json: SerializedMobject = {
      type: 'TotallyMadeUp',
      unknown: true,
      props: {},
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      style: {},
      children: [],
    };
    expect(() => deserializeMobject(json)).not.toThrow();
    expect(deserializeMobject(json)).toBeNull();
  });

  it('drops unknown children but keeps known siblings when restoring a group', () => {
    const group = new VGroup(new Circle({ radius: 1 }));
    const json = serializeMobject(group);
    json.children.push({
      type: 'Ghost',
      unknown: true,
      props: {},
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      style: {},
      children: [],
    });
    const restored = deserializeMobject(json) as VGroup;
    expect(restored.children.length).toBe(1);
    expect(restored.children[0]).toBeInstanceOf(Circle);
  });
});

describe('serializeScene / deserializeScene', () => {
  it('serializes a headless Scene to a tagged JSON document', () => {
    const scene = new Scene(null, { headless: true });
    scene.add(new Circle({ radius: 1 }), new Square({ sideLength: 2 }));
    const doc = serializeScene(scene);
    expect(doc.format).toBe('manim-web-scene');
    expect(typeof doc.version).toBe('number');
    expect(doc.mobjects.length).toBe(2);
    expect(doc.mobjects.map((m) => m.type).sort()).toEqual(['Circle', 'Square']);
  });

  it('rebuilds mobjects into a container', () => {
    const scene = new Scene(null, { headless: true });
    scene.add(new Circle({ radius: 3, color: '#223344' }), new Dot({ point: [1, 1, 0] }));
    const doc = serializeScene(scene);

    const container = makeContainer();
    const created = deserializeScene(doc, container);
    expect(created.length).toBe(2);
    expect(container.added.length).toBe(2);
    expect(container.added[0]).toBeInstanceOf(Circle);
    expect((container.added[0] as Circle).getRadius()).toBeCloseTo(3);
    expect(container.added[1]).toBeInstanceOf(Dot);
  });

  it('round-trips a scene through JSON.stringify/parse', () => {
    const scene = new Scene(null, { headless: true });
    scene.add(new Circle({ radius: 2 }), new Rectangle({ width: 3, height: 1 }));
    const doc = serializeScene(scene);
    const text = JSON.stringify(doc);
    const parsed: unknown = JSON.parse(text);

    const target = new Scene(null, { headless: true });
    const created = deserializeScene(parsed, target);
    expect(created.length).toBe(2);
    expect(target.mobjects.size).toBe(2);
  });

  it('is resilient to a malformed document', () => {
    const container = makeContainer();
    expect(deserializeScene({ nope: true }, container)).toEqual([]);
    expect(deserializeScene(null, container)).toEqual([]);
    expect(container.added.length).toBe(0);
  });
});

describe('type export smoke', () => {
  it('SerializedScene shape is usable', () => {
    const doc: SerializedScene = { format: 'manim-web-scene', version: 1, mobjects: [] };
    expect(doc.mobjects).toEqual([]);
  });
});
