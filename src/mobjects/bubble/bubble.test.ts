import { describe, it, expect } from 'vitest';
import { SpeechBubble, ThoughtBubble } from './index';
import { Rectangle } from '../geometry/Rectangle';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

function box(w: number, h: number, center: Vector3Tuple = [0, 0, 0]) {
  return new Rectangle({ width: w, height: h, center });
}

function dist(a: Vector3Tuple, b: Vector3Tuple): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function contains(outer: Mobject, inner: Mobject, eps = 1e-6): boolean {
  const o = outer.getBounds();
  const i = inner.getBounds();
  return (
    i.min.x >= o.min.x - eps &&
    i.max.x <= o.max.x + eps &&
    i.min.y >= o.min.y - eps &&
    i.max.y <= o.max.y + eps
  );
}

describe('SpeechBubble', () => {
  it('keeps the content inside the body bounds', () => {
    const content = box(2, 1);
    const bubble = new SpeechBubble({ content, padding: 0.3 });
    expect(contains(bubble.getBody(), content)).toBe(true);
  });

  it('sizes the body to content plus padding', () => {
    const bubble = new SpeechBubble({ content: box(2, 1), padding: 0.3 });
    const b = bubble.getBody().getBounds();
    expect(b.max.x - b.min.x).toBeCloseTo(2.6, 5);
    expect(b.max.y - b.min.y).toBeCloseTo(1.6, 5);
  });

  it('exposes the content', () => {
    const content = box(2, 1);
    const bubble = new SpeechBubble({ content });
    expect(bubble.getContent()).toBe(content);
    expect(bubble.children).toContain(content);
  });

  it('resizes when the content is replaced', () => {
    const bubble = new SpeechBubble({ content: box(2, 1), padding: 0.3 });
    const before = bubble.getBody().getBounds();
    const bigger = box(4, 2);
    bubble.setContent(bigger);
    const after = bubble.getBody().getBounds();
    expect(after.max.x - after.min.x).toBeGreaterThan(before.max.x - before.min.x);
    expect(after.max.x - after.min.x).toBeCloseTo(4.6, 5);
    expect(contains(bubble.getBody(), bigger)).toBe(true);
    expect(bubble.getContent()).toBe(bigger);
  });

  it('removes the old content from the group on setContent', () => {
    const first = box(2, 1);
    const bubble = new SpeechBubble({ content: first });
    bubble.setContent(box(1, 1));
    expect(bubble.children).not.toContain(first);
  });

  it('points the tail down for a downward tailDirection', () => {
    const bubble = new SpeechBubble({ content: box(2, 1), tailDirection: [0, -1, 0] });
    const tip = bubble.getTailTip();
    expect(tip[1]).toBeLessThan(bubble.getBody().getBounds().min.y);
    expect(tip[0]).toBeCloseTo(0, 5);
  });

  it('tail tip lands exactly on the pointAt target', () => {
    const target: Vector3Tuple = [3, -2, 0];
    const bubble = new SpeechBubble({ content: box(2, 1), pointAt: target });
    expect(dist(bubble.getTailTip(), target)).toBeLessThan(1e-6);
  });

  it('tail is closer to the target than the body center is', () => {
    const target: Vector3Tuple = [-4, 1, 0];
    const bubble = new SpeechBubble({ content: box(2, 1), pointAt: target });
    expect(dist(bubble.getTailTip(), target)).toBeLessThan(dist([0, 0, 0], target));
    expect(bubble.getTailTip()[0]).toBeLessThan(bubble.getBody().getBounds().min.x);
  });

  it('uses the tail length for a pure direction', () => {
    const bubble = new SpeechBubble({
      content: box(2, 1),
      tailDirection: [1, 0, 0],
      tailLength: 0.8,
    });
    const body = bubble.getBody().getBounds();
    expect(bubble.getTailTip()[0]).toBeCloseTo(body.max.x + 0.8, 5);
  });

  it('re-aims with pointTailAt', () => {
    const bubble = new SpeechBubble({ content: box(2, 1), tailDirection: [0, -1, 0] });
    bubble.pointTailAt([5, 0, 0]);
    expect(dist(bubble.getTailTip(), [5, 0, 0])).toBeLessThan(1e-6);
  });

  it('keeps content sitting off origin inside the body', () => {
    const content = box(2, 1, [3, 2, 0]);
    const bubble = new SpeechBubble({ content, pointAt: [6, 5, 0] });
    expect(contains(bubble.getBody(), content)).toBe(true);
    const c = bubble.getBody().getCenter();
    expect(c[0]).toBeCloseTo(3, 5);
    expect(c[1]).toBeCloseTo(2, 5);
  });

  it('applies fill and stroke options', () => {
    const bubble = new SpeechBubble({
      content: box(1, 1),
      fillColor: '#ff0000',
      fillOpacity: 0.5,
      color: '#00ff00',
    });
    expect(bubble.getBody().fillColor).toBe('#ff0000');
    expect(bubble.getBody().fillOpacity).toBeCloseTo(0.5);
    expect(bubble.getBody().color).toBe('#00ff00');
    expect(bubble.getTail().fillColor).toBe('#ff0000');
  });

  it('survives being moved and then re-aimed', () => {
    const content = box(2, 1);
    const bubble = new SpeechBubble({ content, tailDirection: [0, -1, 0] });
    bubble.shift([2, 1, 0]);
    bubble.pointTailAt([2, -3, 0]);
    expect(dist(bubble.getTailTip(), [2, -3, 0])).toBeLessThan(1e-6);
    expect(contains(bubble.getBody(), content)).toBe(true);
  });
});

describe('ThoughtBubble', () => {
  it('keeps the content inside the cloud', () => {
    const content = box(2, 1);
    const bubble = new ThoughtBubble({ content, padding: 0.3 });
    expect(contains(bubble.getBody(), content)).toBe(true);
  });

  it('grows when the content is replaced', () => {
    const bubble = new ThoughtBubble({ content: box(2, 1) });
    const before = bubble.getBody().getBounds();
    const bigger = box(5, 2);
    bubble.setContent(bigger);
    const after = bubble.getBody().getBounds();
    expect(after.max.x - after.min.x).toBeGreaterThan(before.max.x - before.min.x);
    expect(contains(bubble.getBody(), bigger)).toBe(true);
    expect(bubble.getContent()).toBe(bigger);
  });

  it('has a trail of shrinking circles (default 3)', () => {
    const bubble = new ThoughtBubble({ content: box(2, 1) });
    const trail = bubble.getTrail();
    expect(trail).toHaveLength(3);
    const radii = trail.map((c) => c.getWidth() / 2);
    expect(radii[0]).toBeGreaterThan(radii[1]);
    expect(radii[1]).toBeGreaterThan(radii[2]);
  });

  it('respects trailCount', () => {
    const bubble = new ThoughtBubble({ content: box(2, 1), trailCount: 2 });
    expect(bubble.getTrail()).toHaveLength(2);
  });

  it('trail moves toward the target and ends on it', () => {
    const target: Vector3Tuple = [-4, -3, 0];
    const bubble = new ThoughtBubble({ content: box(2, 1), pointAt: target });
    const centers = bubble.getTrail().map((c) => c.getCenter());
    const d = centers.map((c) => dist(c, target));
    expect(d[0]).toBeGreaterThan(d[1]);
    expect(d[1]).toBeGreaterThan(d[2]);
    expect(d[2]).toBeLessThan(1e-6);
    expect(dist(bubble.getTailTip(), target)).toBeLessThan(1e-6);
  });

  it('trail follows the tail direction and sits outside the cloud', () => {
    const bubble = new ThoughtBubble({ content: box(2, 1), tailDirection: [1, 0, 0] });
    const body = bubble.getBody().getBounds();
    const centers = bubble.getTrail().map((c) => c.getCenter());
    expect(centers[0][0]).toBeGreaterThan(body.max.x - 0.2);
    expect(centers[2][0]).toBeGreaterThan(centers[0][0]);
    for (const c of centers) expect(c[1]).toBeCloseTo(0, 5);
  });

  it('re-aims with pointTailAt', () => {
    const bubble = new ThoughtBubble({ content: box(2, 1) });
    bubble.pointTailAt([0, 6, 0]);
    expect(dist(bubble.getTailTip(), [0, 6, 0])).toBeLessThan(1e-6);
  });
});
