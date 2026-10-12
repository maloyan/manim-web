// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeyboardInput, makeKeyboardInput, normalizeKey } from './KeyboardInput';
import { StateMachine, when } from './StateMachine';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';

/** A fresh event target per test, so listeners never leak across tests. */
function makeTarget(): EventTarget {
  return document.createElement('div');
}

/** Dispatch a keydown at the target. */
function keyDown(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

/** Dispatch a keyup at the target. */
function keyUp(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keyup', { key, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('normalizeKey', () => {
  it('lowercases single characters', () => {
    expect(normalizeKey('W')).toBe('w');
    expect(normalizeKey('A')).toBe('a');
  });

  it('folds aliases onto a canonical name', () => {
    expect(normalizeKey(' ')).toBe('space');
    expect(normalizeKey('Space')).toBe('space');
    expect(normalizeKey('Up')).toBe('arrowup');
    expect(normalizeKey('ArrowUp')).toBe('arrowup');
    expect(normalizeKey('Esc')).toBe('escape');
  });
});

describe('KeyboardInput held state', () => {
  let target: EventTarget;
  let keys: KeyboardInput;

  beforeEach(() => {
    target = makeTarget();
    keys = new KeyboardInput({}, target);
  });

  afterEach(() => keys.dispose());

  it('reports a key as down while held and up after keyup', () => {
    expect(keys.isKeyDown('a')).toBe(false);
    keyDown(target, 'a');
    expect(keys.isKeyDown('a')).toBe(true);
    expect(keys.anyKeyDown()).toBe(true);
    keyUp(target, 'a');
    expect(keys.isKeyDown('a')).toBe(false);
    expect(keys.anyKeyDown()).toBe(false);
  });

  it('matches a held key under any spelling', () => {
    keyDown(target, 'ArrowUp');
    expect(keys.isKeyDown('ArrowUp')).toBe(true);
    expect(keys.isKeyDown('arrowup')).toBe(true);
    expect(keys.isKeyDown('Up')).toBe(true);

    keyDown(target, ' ');
    expect(keys.isKeyDown('Space')).toBe(true);
    expect(keys.isKeyDown(' ')).toBe(true);
  });
});

describe('KeyboardInput per-frame edges', () => {
  let target: EventTarget;
  let keys: KeyboardInput;

  beforeEach(() => {
    target = makeTarget();
    keys = new KeyboardInput({}, target);
  });

  afterEach(() => keys.dispose());

  it('wasPressed is true the frame of keydown and false after update()', () => {
    keyDown(target, 'a');
    expect(keys.wasPressed('a')).toBe(true);
    keys.update(0.016);
    expect(keys.wasPressed('a')).toBe(false);
    // Still held after the edge clears.
    expect(keys.isKeyDown('a')).toBe(true);
  });

  it('wasReleased is true the frame of keyup and false after endFrame()', () => {
    keyDown(target, 'a');
    keys.endFrame();
    keyUp(target, 'a');
    expect(keys.wasReleased('a')).toBe(true);
    keys.endFrame();
    expect(keys.wasReleased('a')).toBe(false);
  });

  it('auto-repeat keydown does not re-fire wasPressed', () => {
    keyDown(target, 'a');
    keys.update();
    // A repeat event while still held.
    keyDown(target, 'a', { repeat: true });
    expect(keys.wasPressed('a')).toBe(false);
    expect(keys.isKeyDown('a')).toBe(true);
  });
});

describe('KeyboardInput movement vector', () => {
  let target: EventTarget;
  let keys: KeyboardInput;

  beforeEach(() => {
    target = makeTarget();
    keys = new KeyboardInput({}, target);
  });

  afterEach(() => keys.dispose());

  it('arrows drive the axis (up is +y, right is +x)', () => {
    keyDown(target, 'ArrowUp');
    expect(keys.getAxis()).toEqual([0, 1]);
    keyUp(target, 'ArrowUp');
    keyDown(target, 'ArrowRight');
    expect(keys.getAxis()).toEqual([1, 0]);
  });

  it('WASD drives the axis the same way as arrows', () => {
    keyDown(target, 'w');
    expect(keys.getAxis()).toEqual([0, 1]);
    keyUp(target, 'w');
    keyDown(target, 'd');
    expect(keys.getAxis()).toEqual([1, 0]);
    keyDown(target, 's');
    // right + down.
    expect(keys.getAxis()).toEqual([1, -1]);
  });

  it('opposite keys cancel on the axis', () => {
    keyDown(target, 'a');
    keyDown(target, 'd');
    expect(keys.getAxis()).toEqual([0, 0]);
  });

  it('normalizes a diagonal direction vector to unit length', () => {
    keyDown(target, 'w');
    keyDown(target, 'd');
    const [x, y] = keys.getDirectionVector();
    expect(x).toBeCloseTo(Math.SQRT1_2, 6);
    expect(y).toBeCloseTo(Math.SQRT1_2, 6);
    expect(Math.hypot(x, y)).toBeCloseTo(1, 6);
  });

  it('returns a zero vector when no movement key is held', () => {
    expect(keys.getDirectionVector()).toEqual([0, 0]);
  });
});

describe('KeyboardInput callbacks', () => {
  let target: EventTarget;
  let keys: KeyboardInput;

  beforeEach(() => {
    target = makeTarget();
    keys = new KeyboardInput({}, target);
  });

  afterEach(() => keys.dispose());

  it('fires onKeyDown / onKeyUp with the normalized key', () => {
    const down = vi.fn();
    const up = vi.fn();
    keys.onKeyDown('Space', down);
    keys.onKeyUp('Space', up);

    keyDown(target, ' ');
    expect(down).toHaveBeenCalledTimes(1);
    expect(down.mock.calls[0][0]).toBe('space');

    keyUp(target, ' ');
    expect(up).toHaveBeenCalledTimes(1);
  });

  it('fires an "any" callback for every key', () => {
    const any = vi.fn();
    keys.onKeyDown('any', any);
    keyDown(target, 'a');
    keyDown(target, 'b');
    expect(any).toHaveBeenCalledTimes(2);
  });

  it('stops firing after the unsubscribe is called', () => {
    const down = vi.fn();
    const stop = keys.onKeyDown('a', down);
    keyDown(target, 'a');
    expect(down).toHaveBeenCalledTimes(1);

    stop();
    keyUp(target, 'a');
    keyDown(target, 'a');
    expect(down).toHaveBeenCalledTimes(1);
  });
});

describe('KeyboardInput lifecycle', () => {
  it('does not react after disable()', () => {
    const target = makeTarget();
    const keys = new KeyboardInput({}, target);
    keys.disable();
    keyDown(target, 'a');
    expect(keys.isKeyDown('a')).toBe(false);
    expect(keys.isEnabled).toBe(false);
  });

  it('clears held keys on disable so none stays stuck', () => {
    const target = makeTarget();
    const keys = new KeyboardInput({}, target);
    keyDown(target, 'a');
    expect(keys.isKeyDown('a')).toBe(true);
    keys.disable();
    expect(keys.isKeyDown('a')).toBe(false);
  });

  it('re-enables after disable', () => {
    const target = makeTarget();
    const keys = new KeyboardInput({ autoEnable: false }, target);
    expect(keys.isEnabled).toBe(false);
    keyDown(target, 'a');
    expect(keys.isKeyDown('a')).toBe(false);

    keys.enable();
    keyDown(target, 'a');
    expect(keys.isKeyDown('a')).toBe(true);
    keys.dispose();
  });

  it('does not react after dispose()', () => {
    const target = makeTarget();
    const keys = new KeyboardInput({}, target);
    keys.dispose();
    keyDown(target, 'a');
    expect(keys.isKeyDown('a')).toBe(false);
  });
});

describe('KeyboardInput preventDefault', () => {
  it('calls preventDefault for every key when true', () => {
    const target = makeTarget();
    const keys = new KeyboardInput({ preventDefault: true }, target);
    const event = keyDown(target, 'ArrowUp');
    expect(event.defaultPrevented).toBe(true);
    keys.dispose();
  });

  it('calls preventDefault only for listed keys', () => {
    const target = makeTarget();
    const keys = new KeyboardInput({ preventDefault: ['Space'] }, target);
    const prevented = keyDown(target, ' ');
    const allowed = keyDown(target, 'a');
    expect(prevented.defaultPrevented).toBe(true);
    expect(allowed.defaultPrevented).toBe(false);
    keys.dispose();
  });

  it('does not call preventDefault by default', () => {
    const target = makeTarget();
    const keys = new KeyboardInput({}, target);
    const event = keyDown(target, 'ArrowUp');
    expect(event.defaultPrevented).toBe(false);
    keys.dispose();
  });
});

describe('KeyboardInput interop', () => {
  let target: EventTarget;
  let keys: KeyboardInput;

  beforeEach(() => {
    target = makeTarget();
    keys = new KeyboardInput({}, target);
  });

  afterEach(() => keys.dispose());

  it('binds a key to a StateMachine bool input', () => {
    const sm = new StateMachine();
    sm.addState('idle').addState('run');
    sm.boolInput('moving', false);
    sm.addTransition('idle', 'run', when('moving').isTrue());
    sm.addTransition('run', 'idle', when('moving').isFalse());

    keys.bindBool(sm, 'moving', 'd');

    keyDown(target, 'd');
    expect(sm.getInput('moving')).toBe(true);
    sm.update();
    expect(sm.getCurrentState()).toBe('run');

    keyUp(target, 'd');
    expect(sm.getInput('moving')).toBe(false);
    sm.update();
    expect(sm.getCurrentState()).toBe('idle');
  });

  it('binds a key to a StateMachine trigger input', () => {
    const sm = new StateMachine();
    sm.addState('closed').addState('open');
    sm.triggerInput('toggle');
    sm.addTransition('closed', 'open', when('toggle').onTrigger());

    keys.bindTrigger(sm, 'toggle', 'Enter');

    keyDown(target, 'Enter');
    expect(sm.update()).toBe(true);
    expect(sm.getCurrentState()).toBe('open');
  });

  it('drives a ValueTracker from a held key', () => {
    const tracker = new ValueTracker(0);
    keys.bindValue(tracker, 'ArrowRight', { heldValue: 5, releasedValue: 0 });

    keyDown(target, 'ArrowRight');
    expect(tracker.getValue()).toBe(5);
    keyUp(target, 'ArrowRight');
    expect(tracker.getValue()).toBe(0);
  });

  it('unsubscribes a bound value key', () => {
    const tracker = new ValueTracker(0);
    const stop = keys.bindValue(tracker, 'ArrowRight', { heldValue: 5 });
    stop();
    keyDown(target, 'ArrowRight');
    expect(tracker.getValue()).toBe(0);
  });
});

describe('KeyboardInput headless safety', () => {
  // Hide window/document so resolveTarget falls through to the headless path.
  const savedWindow = globalThis.window;
  const savedDocument = globalThis.document;

  beforeEach(() => {
    // @ts-expect-error — remove the DOM globals for this block.
    delete globalThis.window;
    // @ts-expect-error — remove the DOM globals for this block.
    delete globalThis.document;
  });

  afterEach(() => {
    globalThis.window = savedWindow;
    globalThis.document = savedDocument;
  });

  it('constructs without a DOM and reads return defaults', () => {
    const keys = new KeyboardInput();
    expect(keys.hasTarget).toBe(false);
    expect(keys.isEnabled).toBe(false);
    expect(keys.isKeyDown('a')).toBe(false);
    expect(keys.anyKeyDown()).toBe(false);
    expect(keys.wasPressed('a')).toBe(false);
    expect(keys.getAxis()).toEqual([0, 0]);
    expect(keys.getDirectionVector()).toEqual([0, 0]);
  });

  it('enable / disable / dispose / update do not throw headless', () => {
    const keys = makeKeyboardInput({ preventDefault: true });
    expect(() => {
      keys.enable();
      keys.update(0.016);
      keys.endFrame();
      keys.onKeyDown('a', () => undefined);
      keys.disable();
      keys.dispose();
    }).not.toThrow();
  });
});
