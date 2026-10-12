// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GamepadInput,
  makeGamepadInput,
  resolveButton,
  isGamepadSupported,
  STANDARD_BUTTONS,
  type GamepadLike,
  type GamepadButtonLike,
  type GamepadSource,
} from './GamepadInput';
import { StateMachine, when } from './StateMachine';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';

/** Build a standard-mapping pad with the given pressed button indices. */
function padWith(pressed: number[] = [], axes: number[] = [0, 0, 0, 0]): GamepadLike {
  const buttons: GamepadButtonLike[] = [];
  for (let i = 0; i < 17; i += 1) {
    const on = pressed.includes(i);
    buttons.push({ pressed: on, value: on ? 1 : 0 });
  }
  return { index: 0, connected: true, mapping: 'standard', buttons, axes };
}

/** A mutable snapshot source, so a test can change the state between polls. */
function makeSource(): { source: GamepadSource; set: (pads: Array<GamepadLike | null>) => void } {
  let pads: Array<GamepadLike | null> = [];
  return {
    source: () => pads,
    set: (next) => {
      pads = next;
    },
  };
}

describe('resolveButton', () => {
  it('passes a numeric index through', () => {
    expect(resolveButton(0)).toBe(0);
    expect(resolveButton(15)).toBe(15);
  });

  it('maps standard button names to indices, case-insensitively', () => {
    expect(resolveButton('A')).toBe(STANDARD_BUTTONS.A);
    expect(resolveButton('a')).toBe(0);
    expect(resolveButton('dpadUp')).toBe(12);
    expect(resolveButton('DPADUP')).toBe(12);
    expect(resolveButton('LT')).toBe(6);
  });

  it('folds aliases onto a canonical button', () => {
    expect(resolveButton('cross')).toBe(STANDARD_BUTTONS.A);
    expect(resolveButton('L1')).toBe(STANDARD_BUTTONS.LB);
    expect(resolveButton('back')).toBe(STANDARD_BUTTONS.select);
    expect(resolveButton('up')).toBe(STANDARD_BUTTONS.dpadUp);
  });

  it('returns -1 for an unknown name', () => {
    expect(resolveButton('nope')).toBe(-1);
  });
});

describe('GamepadInput button state', () => {
  let src: ReturnType<typeof makeSource>;
  let pad: GamepadInput;

  beforeEach(() => {
    src = makeSource();
    pad = new GamepadInput({}, src.source);
  });

  afterEach(() => pad.dispose());

  it('isButtonDown reflects the polled snapshot', () => {
    src.set([padWith([STANDARD_BUTTONS.A])]);
    expect(pad.isButtonDown('A')).toBe(false); // not polled yet
    pad.poll();
    expect(pad.isButtonDown('A')).toBe(true);
    expect(pad.isButtonDown(0)).toBe(true);
    expect(pad.isButtonDown('B')).toBe(false);
    expect(pad.anyButtonDown()).toBe(true);
  });

  it('reports the analog value of a button', () => {
    const custom = padWith();
    const buttons = [...custom.buttons];
    buttons[STANDARD_BUTTONS.RT] = { pressed: true, value: 0.42 };
    src.set([{ ...custom, buttons }]);
    pad.poll();
    expect(pad.getButtonValue('RT')).toBeCloseTo(0.42, 6);
  });
});

describe('GamepadInput per-poll edges', () => {
  let src: ReturnType<typeof makeSource>;
  let pad: GamepadInput;

  beforeEach(() => {
    src = makeSource();
    pad = new GamepadInput({}, src.source);
  });

  afterEach(() => pad.dispose());

  it('wasButtonPressed is true only the poll after a 0->1 transition', () => {
    src.set([padWith([STANDARD_BUTTONS.A])]);
    pad.poll();
    expect(pad.wasButtonPressed('A')).toBe(true);
    // Still held, poll again: the edge clears.
    pad.poll();
    expect(pad.wasButtonPressed('A')).toBe(false);
    expect(pad.isButtonDown('A')).toBe(true);
  });

  it('wasButtonReleased is true only the poll after a 1->0 transition', () => {
    src.set([padWith([STANDARD_BUTTONS.A])]);
    pad.poll();
    src.set([padWith([])]);
    pad.poll();
    expect(pad.wasButtonReleased('A')).toBe(true);
    expect(pad.isButtonDown('A')).toBe(false);
    pad.poll();
    expect(pad.wasButtonReleased('A')).toBe(false);
  });

  it('update(dt) is an alias of poll()', () => {
    src.set([padWith([STANDARD_BUTTONS.B])]);
    pad.update(0.016);
    expect(pad.isButtonDown('B')).toBe(true);
    expect(pad.wasButtonPressed('B')).toBe(true);
  });

  it('releases held buttons when the pad disconnects', () => {
    src.set([padWith([STANDARD_BUTTONS.A])]);
    pad.poll();
    expect(pad.isButtonDown('A')).toBe(true);
    src.set([]); // pad gone
    pad.poll();
    expect(pad.isButtonDown('A')).toBe(false);
    expect(pad.wasButtonReleased('A')).toBe(true);
  });
});

describe('GamepadInput axes and deadzone', () => {
  let src: ReturnType<typeof makeSource>;
  let pad: GamepadInput;

  beforeEach(() => {
    src = makeSource();
    pad = new GamepadInput({ deadzone: 0.1 }, src.source);
  });

  afterEach(() => pad.dispose());

  it('deadzone zeroes small axis values but keeps larger ones', () => {
    src.set([padWith([], [0.05, 0.5, 0, 0])]);
    pad.poll();
    expect(pad.getAxis(0)).toBe(0); // below deadzone
    expect(pad.getAxis(1)).toBeCloseTo(0.5, 6);
  });

  it('getAxis accepts a per-read deadzone override', () => {
    src.set([padWith([], [0.3, 0, 0, 0])]);
    pad.poll();
    expect(pad.getAxis(0, 0.5)).toBe(0); // 0.3 < 0.5
    expect(pad.getAxis(0, 0)).toBeCloseTo(0.3, 6);
  });

  it('getLeftStick flips the vertical axis so up is +y', () => {
    // API up is negative Y; expect it flipped to +y.
    src.set([padWith([], [0.8, -0.8, 0, 0])]);
    pad.poll();
    const [x, y] = pad.getLeftStick();
    expect(x).toBeCloseTo(0.8, 6);
    expect(y).toBeCloseTo(0.8, 6);
  });

  it('getRightStick reads axes 2 and 3', () => {
    src.set([padWith([], [0, 0, 0.5, -0.5])]);
    pad.poll();
    expect(pad.getRightStick()[0]).toBeCloseTo(0.5, 6);
    expect(pad.getRightStick()[1]).toBeCloseTo(0.5, 6);
  });
});

describe('GamepadInput direction vector', () => {
  let src: ReturnType<typeof makeSource>;
  let pad: GamepadInput;

  beforeEach(() => {
    src = makeSource();
    pad = new GamepadInput({}, src.source);
  });

  afterEach(() => pad.dispose());

  it('d-pad up is +y and right is +x', () => {
    src.set([padWith([STANDARD_BUTTONS.dpadUp])]);
    pad.poll();
    expect(pad.getDirectionVector()).toEqual([0, 1]);

    src.set([padWith([STANDARD_BUTTONS.dpadRight])]);
    pad.poll();
    expect(pad.getDirectionVector()).toEqual([1, 0]);
  });

  it('normalizes a diagonal d-pad to unit length', () => {
    src.set([padWith([STANDARD_BUTTONS.dpadUp, STANDARD_BUTTONS.dpadRight])]);
    pad.poll();
    const [x, y] = pad.getDirectionVector();
    expect(x).toBeCloseTo(Math.SQRT1_2, 6);
    expect(y).toBeCloseTo(Math.SQRT1_2, 6);
    expect(Math.hypot(x, y)).toBeCloseTo(1, 6);
  });

  it('falls back to the left stick when no d-pad is held', () => {
    // Left stick full up (API negative Y), normalized to [0, 1].
    src.set([padWith([], [0, -1, 0, 0])]);
    pad.poll();
    expect(pad.getDirectionVector()).toEqual([0, 1]);
  });

  it('returns a zero vector for a neutral input', () => {
    src.set([padWith([], [0, 0, 0, 0])]);
    pad.poll();
    expect(pad.getDirectionVector()).toEqual([0, 0]);
  });
});

describe('GamepadInput callbacks', () => {
  let src: ReturnType<typeof makeSource>;
  let pad: GamepadInput;

  beforeEach(() => {
    src = makeSource();
    pad = new GamepadInput({}, src.source);
  });

  afterEach(() => pad.dispose());

  it('fires onButtonDown / onButtonUp once per edge', () => {
    const down = vi.fn();
    const up = vi.fn();
    pad.onButtonDown('A', down);
    pad.onButtonUp('A', up);

    src.set([padWith([STANDARD_BUTTONS.A])]);
    pad.poll();
    expect(down).toHaveBeenCalledTimes(1);
    expect(down.mock.calls[0][0]).toBe(STANDARD_BUTTONS.A);

    pad.poll(); // still held, no re-fire
    expect(down).toHaveBeenCalledTimes(1);

    src.set([padWith([])]);
    pad.poll();
    expect(up).toHaveBeenCalledTimes(1);
  });

  it('fires an "any" callback for every button', () => {
    const any = vi.fn();
    pad.onButtonDown('any', any);
    src.set([padWith([STANDARD_BUTTONS.A, STANDARD_BUTTONS.B])]);
    pad.poll();
    expect(any).toHaveBeenCalledTimes(2);
  });

  it('stops firing after the unsubscribe is called', () => {
    const down = vi.fn();
    const stop = pad.onButtonDown('X', down);
    src.set([padWith([STANDARD_BUTTONS.X])]);
    pad.poll();
    expect(down).toHaveBeenCalledTimes(1);

    stop();
    src.set([padWith([])]);
    pad.poll();
    src.set([padWith([STANDARD_BUTTONS.X])]);
    pad.poll();
    expect(down).toHaveBeenCalledTimes(1);
  });
});

describe('GamepadInput connection introspection', () => {
  it('returns only the connected pads in the snapshot', () => {
    const src = makeSource();
    const pad = new GamepadInput({}, src.source);
    src.set([padWith([]), null, { ...padWith([]), index: 2, connected: false }]);
    const connected = pad.getConnectedGamepads();
    expect(connected).toHaveLength(1);
    expect(connected[0].index).toBe(0);
    pad.dispose();
  });

  it('honors the gamepadIndex option', () => {
    const src = makeSource();
    const pad = new GamepadInput({ gamepadIndex: 1 }, src.source);
    const second = { ...padWith([STANDARD_BUTTONS.A]), index: 1 };
    src.set([padWith([]), second]);
    pad.poll();
    // Button A is pressed only on pad 1, which is the selected pad.
    expect(pad.isButtonDown('A')).toBe(true);
    pad.dispose();
  });
});

describe('GamepadInput interop', () => {
  let src: ReturnType<typeof makeSource>;
  let pad: GamepadInput;

  beforeEach(() => {
    src = makeSource();
    pad = new GamepadInput({}, src.source);
  });

  afterEach(() => pad.dispose());

  it('binds a button to a StateMachine bool input', () => {
    const sm = new StateMachine();
    sm.addState('idle').addState('run');
    sm.boolInput('moving', false);
    sm.addTransition('idle', 'run', when('moving').isTrue());
    sm.addTransition('run', 'idle', when('moving').isFalse());

    pad.bindBool(sm, 'moving', 'A');

    src.set([padWith([STANDARD_BUTTONS.A])]);
    pad.poll();
    expect(sm.getInput('moving')).toBe(true);
    sm.update();
    expect(sm.getCurrentState()).toBe('run');

    src.set([padWith([])]);
    pad.poll();
    expect(sm.getInput('moving')).toBe(false);
    sm.update();
    expect(sm.getCurrentState()).toBe('idle');
  });

  it('binds a button to a StateMachine trigger input', () => {
    const sm = new StateMachine();
    sm.addState('closed').addState('open');
    sm.triggerInput('toggle');
    sm.addTransition('closed', 'open', when('toggle').onTrigger());

    pad.bindTrigger(sm, 'toggle', 'start');

    src.set([padWith([STANDARD_BUTTONS.start])]);
    pad.poll();
    expect(sm.update()).toBe(true);
    expect(sm.getCurrentState()).toBe('open');
  });

  it('drives a ValueTracker from a held button', () => {
    const tracker = new ValueTracker(0);
    pad.bindValue(tracker, 'RT', { heldValue: 5, releasedValue: 0 });

    src.set([padWith([STANDARD_BUTTONS.RT])]);
    pad.poll();
    expect(tracker.getValue()).toBe(5);

    src.set([padWith([])]);
    pad.poll();
    expect(tracker.getValue()).toBe(0);
  });

  it('unsubscribes a bound value button', () => {
    const tracker = new ValueTracker(0);
    const stop = pad.bindValue(tracker, 'RT', { heldValue: 5 });
    stop();
    src.set([padWith([STANDARD_BUTTONS.RT])]);
    pad.poll();
    expect(tracker.getValue()).toBe(0);
  });
});

describe('GamepadInput lifecycle', () => {
  it('clears held buttons on disable so none stays stuck', () => {
    const src = makeSource();
    const pad = new GamepadInput({}, src.source);
    src.set([padWith([STANDARD_BUTTONS.A])]);
    pad.poll();
    expect(pad.isButtonDown('A')).toBe(true);
    pad.disable();
    expect(pad.isButtonDown('A')).toBe(false);
    expect(pad.isEnabled).toBe(false);
  });

  it('re-enables after disable', () => {
    const src = makeSource();
    const pad = new GamepadInput({ autoEnable: false }, src.source);
    expect(pad.isEnabled).toBe(false);
    pad.enable();
    expect(pad.isEnabled).toBe(true);
    pad.dispose();
  });

  it('reports source and target availability', () => {
    const src = makeSource();
    const pad = new GamepadInput({}, src.source);
    expect(pad.hasSource).toBe(true);
    expect(pad.hasTarget).toBe(true); // happy-dom window
    pad.dispose();
  });
});

describe('GamepadInput headless safety', () => {
  const savedWindow = globalThis.window;
  const savedNavigator = globalThis.navigator;

  beforeEach(() => {
    // @ts-expect-error — remove the DOM globals for this block.
    delete globalThis.window;
    // @ts-expect-error — remove the navigator for this block.
    delete globalThis.navigator;
  });

  afterEach(() => {
    globalThis.window = savedWindow;
    globalThis.navigator = savedNavigator;
  });

  it('reports no support when the Gamepad API is absent', () => {
    expect(isGamepadSupported()).toBe(false);
  });

  it('constructs without a DOM or source and reads return defaults', () => {
    const pad = new GamepadInput();
    expect(pad.hasSource).toBe(false);
    expect(pad.hasTarget).toBe(false);
    expect(pad.isButtonDown('A')).toBe(false);
    expect(pad.anyButtonDown()).toBe(false);
    expect(pad.wasButtonPressed('A')).toBe(false);
    expect(pad.getAxis(0)).toBe(0);
    expect(pad.getLeftStick()).toEqual([0, 0]);
    expect(pad.getDirectionVector()).toEqual([0, 0]);
    expect(pad.getConnectedGamepads()).toEqual([]);
  });

  it('enable / disable / dispose / poll do not throw headless', () => {
    const pad = makeGamepadInput({ gamepadIndex: 0 }, null);
    expect(() => {
      pad.enable();
      pad.poll();
      pad.update(0.016);
      pad.onButtonDown('A', () => undefined);
      pad.disable();
      pad.dispose();
    }).not.toThrow();
  });

  it('a null source read returns zero / false without throwing', () => {
    const pad = new GamepadInput({}, null);
    pad.poll();
    expect(pad.isButtonDown('A')).toBe(false);
    expect(pad.getAxis(1)).toBe(0);
    pad.dispose();
  });
});
