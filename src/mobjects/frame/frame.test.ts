import { describe, it, expect } from 'vitest';
import {
  ScreenRectangle,
  FullScreenRectangle,
  FullScreenFadeRectangle,
  DEFAULT_ASPECT_RATIO,
  createFadeToBlack,
  createFadeToWhite,
} from './index';
import { Rectangle } from '../geometry/Rectangle';
import { BLACK, WHITE } from '../../constants/colors';
import { DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT } from '../../constants';

describe('ScreenRectangle', () => {
  it('constructs with default options', () => {
    const sr = new ScreenRectangle();
    expect(sr.getHeight()).toBe(4);
    expect(sr.getAspectRatio()).toBe(DEFAULT_ASPECT_RATIO);
    expect(sr.getWidth()).toBeCloseTo(4 * (16 / 9));
  });

  it('constructs with custom height', () => {
    const sr = new ScreenRectangle({ height: 6 });
    expect(sr.getHeight()).toBe(6);
    expect(sr.getWidth()).toBeCloseTo(6 * DEFAULT_ASPECT_RATIO);
  });

  it('constructs with custom aspect ratio', () => {
    const sr = new ScreenRectangle({ aspectRatio: 4 / 3 });
    expect(sr.getAspectRatio()).toBeCloseTo(4 / 3);
    expect(sr.getWidth()).toBeCloseTo(4 * (4 / 3));
  });

  it('setAspectRatio updates width while keeping height', () => {
    const sr = new ScreenRectangle({ height: 3 });
    sr.setAspectRatio(2);
    expect(sr.getAspectRatio()).toBe(2);
    expect(sr.getWidth()).toBeCloseTo(6);
  });

  it('setHeight maintains aspect ratio', () => {
    const sr = new ScreenRectangle({ height: 4, aspectRatio: 2 });
    sr.setHeight(6);
    expect(sr.getHeight()).toBe(6);
    expect(sr.getWidth()).toBeCloseTo(12);
  });

  it('is a Rectangle', () => {
    const sr = new ScreenRectangle();
    expect(sr).toBeInstanceOf(Rectangle);
  });

  it('DEFAULT_ASPECT_RATIO is 16/9', () => {
    expect(DEFAULT_ASPECT_RATIO).toBeCloseTo(16 / 9);
  });
});

describe('FullScreenRectangle', () => {
  it('constructs with default frame dimensions', () => {
    const fsr = new FullScreenRectangle();
    expect(fsr.getFrameWidth()).toBe(DEFAULT_FRAME_WIDTH);
    expect(fsr.getFrameHeight()).toBe(DEFAULT_FRAME_HEIGHT);
  });

  it('constructs with default black fill', () => {
    const fsr = new FullScreenRectangle();
    expect(fsr.fillColor).toBe(BLACK);
    expect(fsr.fillOpacity).toBe(1);
  });

  it('constructs with custom color', () => {
    const fsr = new FullScreenRectangle({ color: '#0000ff' });
    expect(fsr.fillColor).toBe('#0000ff');
  });

  it('constructs with custom frame dimensions', () => {
    const fsr = new FullScreenRectangle({ frameWidth: 16, frameHeight: 9 });
    expect(fsr.getFrameWidth()).toBe(16);
    expect(fsr.getFrameHeight()).toBe(9);
  });

  it('constructs with no stroke by default', () => {
    const fsr = new FullScreenRectangle();
    expect(fsr.strokeWidth).toBe(0);
  });

  it('matchCamera updates frame dimensions', () => {
    const fsr = new FullScreenRectangle();
    fsr.matchCamera(20, 10);
    expect(fsr.getFrameWidth()).toBe(20);
    expect(fsr.getFrameHeight()).toBe(10);
  });

  it('is a Rectangle', () => {
    const fsr = new FullScreenRectangle();
    expect(fsr).toBeInstanceOf(Rectangle);
  });
});

describe('FullScreenFadeRectangle', () => {
  it('constructs with default opacity 0 (transparent)', () => {
    const fade = new FullScreenFadeRectangle();
    expect(fade.getFadeProgress()).toBe(0);
    expect(fade.isTransparent()).toBe(true);
    expect(fade.isOpaque()).toBe(false);
  });

  it('constructs with custom opacity', () => {
    const fade = new FullScreenFadeRectangle({ opacity: 0.5 });
    expect(fade.getFadeProgress()).toBe(0.5);
    expect(fade.isTransparent()).toBe(false);
    expect(fade.isOpaque()).toBe(false);
  });

  it('setFadeProgress updates opacity', () => {
    const fade = new FullScreenFadeRectangle();
    fade.setFadeProgress(0.7);
    expect(fade.getFadeProgress()).toBeCloseTo(0.7);
    expect(fade.fillOpacity).toBeCloseTo(0.7);
  });

  it('setFadeProgress clamps to [0, 1]', () => {
    const fade = new FullScreenFadeRectangle();
    fade.setFadeProgress(2);
    expect(fade.getFadeProgress()).toBe(1);

    fade.setFadeProgress(-1);
    expect(fade.getFadeProgress()).toBe(0);
  });

  it('setFadeProgress returns this for chaining', () => {
    const fade = new FullScreenFadeRectangle();
    const result = fade.setFadeProgress(0.5);
    expect(result).toBe(fade);
  });

  it('fadeIn sets to fully opaque', () => {
    const fade = new FullScreenFadeRectangle();
    fade.fadeIn();
    expect(fade.getFadeProgress()).toBe(1);
    expect(fade.isOpaque()).toBe(true);
  });

  it('fadeOut sets to fully transparent', () => {
    const fade = new FullScreenFadeRectangle({ opacity: 1 });
    fade.fadeOut();
    expect(fade.getFadeProgress()).toBe(0);
    expect(fade.isTransparent()).toBe(true);
  });

  it('isTransparent only true at exactly 0', () => {
    const fade = new FullScreenFadeRectangle({ opacity: 0.01 });
    expect(fade.isTransparent()).toBe(false);
  });

  it('isOpaque only true at exactly 1', () => {
    const fade = new FullScreenFadeRectangle({ opacity: 0.99 });
    expect(fade.isOpaque()).toBe(false);
  });
});

describe('Factory functions', () => {
  it('createFadeToBlack creates a black fade rectangle', () => {
    const fade = createFadeToBlack();
    expect(fade).toBeInstanceOf(FullScreenFadeRectangle);
    expect(fade.fillColor).toBe(BLACK);
  });

  it('createFadeToWhite creates a white fade rectangle', () => {
    const fade = createFadeToWhite();
    expect(fade).toBeInstanceOf(FullScreenFadeRectangle);
    expect(fade.fillColor).toBe(WHITE);
  });
});
