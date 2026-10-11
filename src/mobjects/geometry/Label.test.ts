// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { Label } from './Label';
import { BackgroundRectangle, SurroundingRectangle } from './ShapeMatchers';
import { Square } from './Rectangle';

describe('Label', () => {
  it('wraps a prebuilt mobject in a background box and a frame (3 children)', () => {
    const inner = new Square();
    const label = new Label(inner);

    expect(label.children.length).toBe(3);
    expect(label.renderedLabel).toBe(inner);
    expect(label.backgroundRect).toBeInstanceOf(BackgroundRectangle);
    expect(label.frame).toBeInstanceOf(SurroundingRectangle);
  });

  it('orders children as [background, label, frame]', () => {
    const inner = new Square();
    const label = new Label(inner);

    expect(label.children[0]).toBe(label.backgroundRect);
    expect(label.children[1]).toBe(label.renderedLabel);
    expect(label.children[2]).toBe(label.frame);
  });
});
