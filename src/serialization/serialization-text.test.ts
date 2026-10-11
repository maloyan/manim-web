// @vitest-environment happy-dom
/**
 * Round-trip tests for the text mobjects (Text and MathTex).
 *
 * Text rasterizes through a 2D canvas and MathTex renders LaTeX asynchronously
 * via MathJax. happy-dom provides neither a working 2D context nor MathJax, so
 * this file stubs the canvas 2D context and silences the expected async render
 * error. The serialization layer itself only reads constructor-level
 * properties, which are available synchronously.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { serializeMobject, deserializeMobject } from './index';
import { Text } from '../mobjects/text/Text';
import { MathTex } from '../mobjects/text/MathTex';
import { logger } from '../utils/logger';

const canvasProto = HTMLCanvasElement.prototype as HTMLCanvasElement & {
  getContext: (type: string, ...rest: unknown[]) => unknown;
};
const origGetContext = canvasProto.getContext;

beforeAll(() => {
  canvasProto.getContext = function (this: HTMLCanvasElement, type: string) {
    if (type === '2d') {
      return {
        scale: () => {},
        clearRect: () => {},
        fillRect: () => {},
        fillText: () => {},
        strokeText: () => {},
        beginPath: () => {},
        measureText: () => ({ width: 10 }),
        save: () => {},
        restore: () => {},
        translate: () => {},
        font: '',
        textBaseline: 'top',
        textAlign: 'left',
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
      };
    }
    return null;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

afterAll(() => {
  canvasProto.getContext = origGetContext;
});

describe('Text round-trip', () => {
  it('preserves text content, font size, family, and color', () => {
    const t = new Text({
      text: 'Hello World',
      fontSize: 72,
      fontFamily: 'Georgia',
      color: '#ff6600',
    });
    const json = serializeMobject(t);
    expect(json.type).toBe('Text');
    expect(json.unknown).toBeUndefined();
    expect(json.props.text).toBe('Hello World');
    expect(json.props.fontSize).toBe(72);
    expect(json.props.fontFamily).toBe('Georgia');

    const restored = deserializeMobject(json) as Text;
    expect(restored).toBeInstanceOf(Text);
    expect(restored.getText()).toBe('Hello World');
    expect(restored.getFontSize()).toBe(72);
    expect(restored.getFontFamily()).toBe('Georgia');
    expect(restored.color.toLowerCase()).toBe('#ff6600');
  });

  it('is stable under serialize→deserialize→serialize', () => {
    const t = new Text({ text: 'Stable', fontSize: 48 });
    const json1 = serializeMobject(t);
    const json2 = serializeMobject(deserializeMobject(json1) as Text);
    expect(json2).toEqual(json1);
  });
});

describe('MathTex round-trip', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    // MathJax is unavailable under happy-dom; the async render rejects and
    // logs via logger.error. Silence it so the strict console policy does not
    // fail unrelated assertions. The serialized state is captured synchronously.
    errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    errorSpy.mockRestore();
  });

  it('captures latex and renderer options, and restores a MathTex instance', async () => {
    const m = new MathTex({ latex: 'x^2 + y^2', fontSize: 2, displayMode: false });
    await m.waitForRender().catch(() => {});
    const json = serializeMobject(m);
    expect(json.type).toBe('MathTex');
    expect(json.unknown).toBeUndefined();
    expect(json.props.latex).toBe('x^2 + y^2');
    expect(json.props.fontSize).toBe(2);
    expect(json.props.displayMode).toBe(false);

    const restored = deserializeMobject(json) as MathTex;
    await restored.waitForRender().catch(() => {});
    expect(restored).toBeInstanceOf(MathTex);
    expect(restored.getLatex()).toBe('x^2 + y^2');
  });
});
