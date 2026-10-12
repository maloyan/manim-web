import { describe, it, expect } from 'vitest';
import { Treemap } from './Treemap';
import { Rectangle } from '../geometry/Rectangle';
import {
  computeTreemapLayout,
  squarify,
  treemapNodeValue,
  type TreemapNode,
  type TreemapRect,
} from './treemapLayout';

const REGION: TreemapRect = { x: 0, y: 0, width: 8, height: 4.5 };

function area(rect: TreemapRect): number {
  return rect.width * rect.height;
}

function overlaps(a: TreemapRect, b: TreemapRect): boolean {
  const eps = 1e-9;
  return (
    a.x + a.width > b.x + eps &&
    b.x + b.width > a.x + eps &&
    a.y + a.height > b.y + eps &&
    b.y + b.height > a.y + eps
  );
}

function within(child: TreemapRect, parent: TreemapRect): boolean {
  const eps = 1e-9;
  return (
    child.x >= parent.x - eps &&
    child.y >= parent.y - eps &&
    child.x + child.width <= parent.x + parent.width + eps &&
    child.y + child.height <= parent.y + parent.height + eps
  );
}

describe('treemapNodeValue', () => {
  it('returns the clamped own value for a leaf', () => {
    expect(treemapNodeValue({ name: 'a', value: 5 })).toBe(5);
    expect(treemapNodeValue({ name: 'a', value: -3 })).toBe(0);
    expect(treemapNodeValue({ name: 'a' })).toBe(0);
  });

  it('sums children for an internal node, ignoring its own value', () => {
    const node: TreemapNode = {
      name: 'root',
      value: 99,
      children: [
        { name: 'a', value: 2 },
        { name: 'b', value: 3 },
      ],
    };
    expect(treemapNodeValue(node)).toBe(5);
  });
});

describe('squarify', () => {
  it('tiles a region exactly with areas proportional to the inputs', () => {
    const areas = [10, 6, 4]; // sum 20
    const region: TreemapRect = { x: 0, y: 0, width: 4, height: 5 }; // area 20
    const rects = squarify(areas, region);

    rects.forEach((rect, index) => {
      expect(area(rect)).toBeCloseTo(areas[index], 6);
    });
    const totalArea = rects.reduce((sum, rect) => sum + area(rect), 0);
    expect(totalArea).toBeCloseTo(area(region), 6);
  });

  it('produces non-overlapping tiles', () => {
    const rects = squarify([5, 5, 3, 2, 1], { x: 0, y: 0, width: 4, height: 4 });
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        expect(overlaps(rects[i], rects[j])).toBe(false);
      }
    }
  });
});

describe('computeTreemapLayout', () => {
  it('sizes leaf tiles in proportion to their values', () => {
    const data: TreemapNode = {
      name: 'root',
      children: [
        { name: 'a', value: 6 },
        { name: 'b', value: 3 },
        { name: 'c', value: 1 },
      ],
    };
    const layout = computeTreemapLayout(data, REGION, 0);
    const leaves = layout.filter((tile) => tile.path.length === 1);

    const areaA = area(leaves.find((tile) => tile.name === 'a')!.rect);
    const areaB = area(leaves.find((tile) => tile.name === 'b')!.rect);
    const areaC = area(leaves.find((tile) => tile.name === 'c')!.rect);
    expect(areaA / areaC).toBeCloseTo(6, 5);
    expect(areaB / areaC).toBeCloseTo(3, 5);
  });

  it('tiles the whole region with the leaves (no gaps, no overlap) at zero padding', () => {
    const data: TreemapNode = {
      name: 'root',
      children: [
        { name: 'a', value: 6 },
        {
          name: 'b',
          children: [
            { name: 'b1', value: 2 },
            { name: 'b2', value: 2 },
          ],
        },
        { name: 'c', value: 1 },
      ],
    };
    const layout = computeTreemapLayout(data, REGION, 0);
    const leaves = layout.filter((tile) => !layout.some((other) => isChildOf(tile, other)));

    const totalArea = leaves.reduce((sum, tile) => sum + area(tile.rect), 0);
    expect(totalArea).toBeCloseTo(area(REGION), 5);

    for (let i = 0; i < leaves.length; i++) {
      for (let j = i + 1; j < leaves.length; j++) {
        expect(overlaps(leaves[i].rect, leaves[j].rect)).toBe(false);
      }
    }
  });

  it('places each child strictly inside its parent', () => {
    const data: TreemapNode = {
      name: 'root',
      children: [
        { name: 'a', value: 4 },
        {
          name: 'b',
          children: [
            { name: 'b1', value: 3 },
            { name: 'b2', value: 1 },
          ],
        },
      ],
    };
    const layout = computeTreemapLayout(data, REGION, 0.1);
    const parent = layout.find((tile) => tile.name === 'b')!;
    const children = layout.filter((tile) => tile.depth === 2);

    expect(children.length).toBe(2);
    for (const child of children) {
      expect(within(child.rect, parent.rect)).toBe(true);
    }
  });

  it('handles a single node and zero values without throwing', () => {
    expect(() => computeTreemapLayout({ name: 'solo', value: 5 }, REGION, 0)).not.toThrow();
    const zero = computeTreemapLayout(
      {
        name: 'root',
        children: [
          { name: 'a', value: 0 },
          { name: 'b', value: 0 },
        ],
      },
      REGION,
      0,
    );
    expect(zero.length).toBe(3);
    expect(() => area(zero[0].rect)).not.toThrow();
  });
});

/** Whether `maybeChild` is a direct child of `maybeParent` in the layout path. */
function isChildOf(maybeChild: { path: number[] }, maybeParent: { path: number[] }): boolean {
  return (
    maybeChild.path.length === maybeParent.path.length + 1 &&
    maybeParent.path.every((value, index) => value === maybeChild.path[index])
  );
}

describe('Treemap', () => {
  const data: TreemapNode = {
    name: 'root',
    children: [
      { name: 'a', value: 6 },
      {
        name: 'b',
        children: [
          { name: 'b1', value: 2 },
          { name: 'b2', value: 2 },
        ],
      },
      { name: 'c', value: 1 },
    ],
  };

  it('builds one rectangle per drawn node and exposes accessors', () => {
    const tree = new Treemap({ data, padding: 0, showLabels: false });
    expect(tree.getTiles().length).toBeGreaterThan(0);
    expect(tree.getTiles()[0]).toBeInstanceOf(Rectangle);

    const leafA = tree.getTile([0]);
    const leafB1 = tree.getTile([1, 0]);
    expect(leafA).toBeInstanceOf(Rectangle);
    expect(leafB1).toBeInstanceOf(Rectangle);
    expect(tree.getTile([9])).toBeUndefined();
  });

  it('keeps the rectangle area of a leaf proportional to its value', () => {
    const tree = new Treemap({ data, padding: 0, showLabels: false });
    const leafA = tree.getTile([0])!;
    const leafC = tree.getTile([2])!;
    expect(leafA.getArea() / leafC.getArea()).toBeCloseTo(6, 4);
  });

  it('nests a child rectangle inside its parent rectangle', () => {
    const tree = new Treemap({ data, padding: 0.1, showLabels: false });
    const parent = tree.getTile([1])!;
    const child = tree.getTile([1, 0])!;

    const pLeft = parent.getRectCenter()[0] - parent.getWidth() / 2;
    const pRight = parent.getRectCenter()[0] + parent.getWidth() / 2;
    const cLeft = child.getRectCenter()[0] - child.getWidth() / 2;
    const cRight = child.getRectCenter()[0] + child.getWidth() / 2;
    expect(cLeft).toBeGreaterThanOrEqual(pLeft - 1e-9);
    expect(cRight).toBeLessThanOrEqual(pRight + 1e-9);
  });

  it('treats empty, single-node, and all-zero inputs as non-throwing empty-ish groups', () => {
    expect(() => new Treemap({ data: { name: 'empty' } })).not.toThrow();
    const empty = new Treemap({ data: { name: 'empty' } });
    expect(empty.isEmpty()).toBe(true);

    expect(() => new Treemap({ data: { name: 'solo', value: 3 }, showRoot: true })).not.toThrow();

    const zero = new Treemap({
      data: {
        name: 'root',
        children: [
          { name: 'a', value: 0 },
          { name: 'b', value: 0 },
        ],
      },
      padding: 0,
    });
    expect(() => zero.getTiles()).not.toThrow();
  });
});
