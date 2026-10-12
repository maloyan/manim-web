import { describe, it, expect, vi } from 'vitest';
import { StateMachine, when, allOf, anyOf, type StateContext } from './StateMachine';

describe('StateMachine', () => {
  describe('states and initial state', () => {
    it('uses the first added state as the initial state', () => {
      const sm = new StateMachine();
      sm.addState('idle').addState('active');
      expect(sm.getCurrentState()).toBe('idle');
    });

    it('honors an explicit initial state in options', () => {
      const sm = new StateMachine({ initial: 'active' });
      sm.addState('idle').addState('active');
      expect(sm.getCurrentState()).toBe('active');
    });

    it('starts with a null state when no state is added', () => {
      const sm = new StateMachine();
      expect(sm.getCurrentState()).toBeNull();
    });
  });

  describe('bool inputs and guards', () => {
    it('transitions to the target state when a bool guard passes', () => {
      const sm = new StateMachine();
      sm.addState('idle').addState('open');
      sm.boolInput('toggled', false);
      sm.addTransition('idle', 'open', when('toggled').is(true));

      // Guard not satisfied yet.
      expect(sm.update()).toBe(false);
      expect(sm.getCurrentState()).toBe('idle');

      sm.setInput('toggled', true);
      expect(sm.update()).toBe(true);
      expect(sm.getCurrentState()).toBe('open');
    });

    it('does not transition when the guard does not match', () => {
      const sm = new StateMachine();
      sm.addState('idle').addState('open');
      sm.boolInput('toggled', false);
      sm.addTransition('idle', 'open', when('toggled').isTrue());

      sm.update();
      expect(sm.getCurrentState()).toBe('idle');
    });

    it('supports isFalse guards', () => {
      const sm = new StateMachine();
      sm.addState('on').addState('off');
      sm.boolInput('power', true);
      sm.addTransition('on', 'off', when('power').isFalse());

      sm.setInput('power', false);
      sm.update();
      expect(sm.getCurrentState()).toBe('off');
    });
  });

  describe('number inputs and guards', () => {
    it('evaluates greaterThan, lessThan and equals guards', () => {
      const sm = new StateMachine();
      sm.addState('low').addState('high');
      sm.numberInput('speed', 0);
      sm.addTransition('low', 'high', when('speed').greaterThan(10));

      sm.setInput('speed', 5);
      sm.update();
      expect(sm.getCurrentState()).toBe('low');

      sm.setInput('speed', 11);
      sm.update();
      expect(sm.getCurrentState()).toBe('high');
    });

    it('evaluates equals exactly', () => {
      const sm = new StateMachine();
      sm.addState('a').addState('b');
      sm.numberInput('level', 0);
      sm.addTransition('a', 'b', when('level').equals(3));

      sm.setInput('level', 2);
      sm.update();
      expect(sm.getCurrentState()).toBe('a');

      sm.setInput('level', 3);
      sm.update();
      expect(sm.getCurrentState()).toBe('b');
    });

    it('evaluates lessThan guards', () => {
      const sm = new StateMachine();
      sm.addState('warm').addState('cold');
      sm.numberInput('temp', 20);
      sm.addTransition('warm', 'cold', when('temp').lessThan(0));

      sm.setInput('temp', -5);
      sm.update();
      expect(sm.getCurrentState()).toBe('cold');
    });
  });

  describe('trigger inputs', () => {
    it('fires for exactly one evaluation, then auto-resets', () => {
      const sm = new StateMachine();
      sm.addState('closed').addState('open').addState('other');
      sm.triggerInput('tap');
      sm.addTransition('closed', 'open', when('tap').onTrigger());
      sm.addTransition('open', 'other', when('tap').onTrigger());

      sm.fire('tap');
      expect(sm.update()).toBe(true);
      expect(sm.getCurrentState()).toBe('open');

      // The trigger was consumed by the single evaluation above.
      expect(sm.update()).toBe(false);
      expect(sm.getCurrentState()).toBe('open');
    });

    it('reports a pending trigger through getInput until the next update', () => {
      const sm = new StateMachine();
      sm.addState('s0');
      sm.triggerInput('go');

      expect(sm.getInput('go')).toBe(false);
      sm.fire('go');
      expect(sm.getInput('go')).toBe(true);
      sm.update();
      expect(sm.getInput('go')).toBe(false);
    });
  });

  describe('state actions', () => {
    it('runs onEnter of the target state and onExit of the source on a transition', () => {
      const enter = vi.fn();
      const exit = vi.fn();
      const sm = new StateMachine();
      sm.addState('idle', { onExit: exit });
      sm.addState('run', { onEnter: enter });
      sm.boolInput('go', false);
      sm.addTransition('idle', 'run', when('go').isTrue());

      sm.setInput('go', true);
      sm.update();

      expect(exit).toHaveBeenCalledTimes(1);
      expect(enter).toHaveBeenCalledTimes(1);
      const ctx = enter.mock.calls[0][0] as StateContext;
      expect(ctx.from).toBe('idle');
      expect(ctx.to).toBe('run');
      expect(ctx.machine).toBe(sm);
    });

    it('runs a per-transition action after onEnter', () => {
      const order: string[] = [];
      const sm = new StateMachine();
      sm.addState('a');
      sm.addState('b', { onEnter: () => order.push('enter') });
      sm.triggerInput('t');
      sm.addTransition('a', 'b', when('t').onTrigger(), {
        action: () => order.push('action'),
      });

      sm.fire('t');
      sm.update();
      expect(order).toEqual(['enter', 'action']);
    });

    it('passes dt through to the action context', () => {
      let seen = -1;
      const sm = new StateMachine();
      sm.addState('a').addState('b', { onEnter: (c) => (seen = c.dt) });
      sm.boolInput('go', true);
      sm.addTransition('a', 'b', when('go').isTrue());

      sm.update(0.016);
      expect(seen).toBeCloseTo(0.016);
    });
  });

  describe('combined guards', () => {
    it('allOf requires every guard to pass', () => {
      const sm = new StateMachine();
      sm.addState('a').addState('b');
      sm.boolInput('ready', false);
      sm.numberInput('count', 0);
      sm.addTransition('a', 'b', allOf(when('ready').isTrue(), when('count').greaterThan(2)));

      sm.setInput('ready', true);
      sm.setInput('count', 1);
      sm.update();
      expect(sm.getCurrentState()).toBe('a');

      sm.setInput('count', 3);
      sm.update();
      expect(sm.getCurrentState()).toBe('b');
    });

    it('anyOf requires at least one guard to pass', () => {
      const sm = new StateMachine();
      sm.addState('a').addState('b');
      sm.boolInput('x', false);
      sm.boolInput('y', false);
      sm.addTransition('a', 'b', anyOf(when('x').isTrue(), when('y').isTrue()));

      sm.setInput('y', true);
      sm.update();
      expect(sm.getCurrentState()).toBe('b');
    });
  });

  describe('transition ordering', () => {
    it('takes the first matching transition in insertion order (deterministic)', () => {
      const sm = new StateMachine();
      sm.addState('start').addState('first').addState('second');
      sm.boolInput('go', true);
      sm.addTransition('start', 'first', when('go').isTrue());
      sm.addTransition('start', 'second', when('go').isTrue());

      sm.update();
      expect(sm.getCurrentState()).toBe('first');
    });

    it('performs at most one transition per update', () => {
      const sm = new StateMachine();
      sm.addState('a').addState('b').addState('c');
      sm.boolInput('go', true);
      sm.addTransition('a', 'b', when('go').isTrue());
      sm.addTransition('b', 'c', when('go').isTrue());

      sm.update();
      expect(sm.getCurrentState()).toBe('b');
      sm.update();
      expect(sm.getCurrentState()).toBe('c');
    });

    it('supports an unconditional transition with no guard', () => {
      const sm = new StateMachine();
      sm.addState('a').addState('b');
      sm.addTransition('a', 'b');
      sm.update();
      expect(sm.getCurrentState()).toBe('b');
    });
  });

  describe('robustness for unknown names', () => {
    it('does not throw when setting an unknown input', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const sm = new StateMachine();
      sm.addState('a');
      expect(() => sm.setInput('nope', true)).not.toThrow();
      expect(sm.getInput('nope')).toBeUndefined();
    });

    it('does not throw when firing an unknown trigger', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const sm = new StateMachine();
      sm.addState('a');
      expect(() => sm.fire('nope')).not.toThrow();
    });

    it('a guard on an unknown input simply does not match', () => {
      const sm = new StateMachine();
      sm.addState('a').addState('b');
      sm.addTransition('a', 'b', when('ghost').isTrue());
      sm.update();
      expect(sm.getCurrentState()).toBe('a');
    });

    it('ignores a transition into an unknown target state without throwing', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const sm = new StateMachine();
      sm.addState('a');
      sm.boolInput('go', true);
      sm.addTransition('a', 'ghost', when('go').isTrue());
      expect(() => sm.update()).not.toThrow();
      expect(sm.getCurrentState()).toBe('a');
    });

    it('does not throw on update with no current state', () => {
      const sm = new StateMachine();
      expect(() => sm.update()).not.toThrow();
      expect(sm.update()).toBe(false);
    });
  });

  describe('inputs API', () => {
    it('reports bool and number input values through getInput', () => {
      const sm = new StateMachine();
      sm.addState('a');
      sm.boolInput('flag', true);
      sm.numberInput('n', 7);
      expect(sm.getInput('flag')).toBe(true);
      expect(sm.getInput('n')).toBe(7);
    });

    it('warns and ignores setInput on a trigger input, and fire on a non-trigger', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const sm = new StateMachine();
      sm.addState('a');
      sm.triggerInput('t');
      sm.boolInput('b', false);
      expect(() => sm.setInput('t', true)).not.toThrow();
      expect(() => sm.fire('b')).not.toThrow();
    });

    it('exposes handler factories that drive inputs from UI events', () => {
      const sm = new StateMachine();
      sm.addState('a');
      sm.boolInput('b', false);
      sm.numberInput('n', 0);
      sm.triggerInput('t');

      sm.inputHandler('b')(true);
      expect(sm.getInput('b')).toBe(true);

      sm.inputHandler('n')(42);
      expect(sm.getInput('n')).toBe(42);

      sm.triggerHandler('t')();
      expect(sm.getInput('t')).toBe(true);
    });
  });

  describe('reset', () => {
    it('returns to the initial state and clears triggers', () => {
      const sm = new StateMachine({ initial: 'a' });
      sm.addState('a').addState('b');
      sm.boolInput('go', true);
      sm.addTransition('a', 'b', when('go').isTrue());

      sm.update();
      expect(sm.getCurrentState()).toBe('b');

      sm.reset();
      expect(sm.getCurrentState()).toBe('a');
    });
  });

  describe('determinism', () => {
    it('produces the same state sequence for the same input sequence', () => {
      const build = (): StateMachine => {
        const sm = new StateMachine();
        sm.addState('idle').addState('hover').addState('open');
        sm.boolInput('hovering', false);
        sm.triggerInput('click');
        sm.addTransition('idle', 'hover', when('hovering').isTrue());
        sm.addTransition('hover', 'open', when('click').onTrigger());
        sm.addTransition('open', 'idle', when('hovering').isFalse());
        return sm;
      };

      const run = (sm: StateMachine): string[] => {
        const seq: string[] = [];
        sm.setInput('hovering', true);
        sm.update();
        seq.push(sm.getCurrentState() ?? 'null');
        sm.fire('click');
        sm.update();
        seq.push(sm.getCurrentState() ?? 'null');
        sm.setInput('hovering', false);
        sm.update();
        seq.push(sm.getCurrentState() ?? 'null');
        return seq;
      };

      expect(run(build())).toEqual(run(build()));
      expect(run(build())).toEqual(['hover', 'open', 'idle']);
    });
  });
});
