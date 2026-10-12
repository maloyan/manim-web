import { logger } from '../utils/logger';

/**
 * A value held by a bool or number input. Trigger inputs expose a boolean
 * "pending" flag through the same accessor.
 */
export type InputValue = boolean | number;

/** The kind of an input slot. */
export type InputKind = 'bool' | 'number' | 'trigger';

/**
 * Read-only view of the input values at the moment a guard is evaluated.
 * A {@link Guard} reads inputs only through this snapshot, so guards stay pure
 * and deterministic.
 */
export interface InputsSnapshot {
  /** The current bool or number value, or `undefined` for an unknown input. */
  get(name: string): InputValue | undefined;
  /** Whether a trigger input is pending for this evaluation. */
  isTriggered(name: string): boolean;
}

/**
 * A transition guard. It returns `true` when the transition may fire for the
 * given input snapshot. Build one with {@link when}, or combine several with
 * {@link allOf} and {@link anyOf}.
 */
export interface Guard {
  evaluate(snapshot: InputsSnapshot): boolean;
}

/**
 * Context passed to a state `onEnter` / `onExit` action and to a per-transition
 * action. It names the states involved and carries the delta time of the
 * {@link StateMachine.update} call that caused the transition.
 */
export interface StateContext {
  /** The machine that performed the transition. */
  machine: StateMachine;
  /** The state being left, or `null` when entering the initial state. */
  from: string | null;
  /** The state being entered. */
  to: string;
  /** Delta time (seconds) of the update that triggered the transition. */
  dt: number;
}

/** An action run on state entry/exit or on a transition. */
export type StateAction = (context: StateContext) => void;

/** Options for a state. */
export interface StateConfig {
  /** Run when the machine enters this state (the place to start an animation). */
  onEnter?: StateAction;
  /** Run when the machine leaves this state. */
  onExit?: StateAction;
}

/** Options for a transition. */
export interface TransitionConfig {
  /** Run after the target `onEnter`, when this transition fires. */
  action?: StateAction;
}

/** Options for a {@link StateMachine}. */
export interface StateMachineOptions {
  /** The initial state name. Defaults to the first state added. */
  initial?: string;
}

interface InputSlot {
  kind: InputKind;
  value: InputValue;
}

interface Transition {
  from: string;
  to: string;
  guard: Guard | null;
  action?: StateAction;
}

/**
 * Builds a {@link Guard} for one input. Returned by {@link when}.
 *
 * @example
 * ```typescript
 * when('hovering').isTrue();
 * when('speed').greaterThan(10);
 * when('click').onTrigger();
 * ```
 */
export class GuardBuilder {
  constructor(private readonly _name: string) {}

  /** Match when the input equals `value` (bool or number). */
  is(value: InputValue): Guard {
    const name = this._name;
    return { evaluate: (s) => s.get(name) === value };
  }

  /** Match when the bool input is `true`. */
  isTrue(): Guard {
    return this.is(true);
  }

  /** Match when the bool input is `false`. */
  isFalse(): Guard {
    return this.is(false);
  }

  /** Match when the number input equals `value`. */
  equals(value: number): Guard {
    return this.is(value);
  }

  /** Match when the number input is strictly greater than `value`. */
  greaterThan(value: number): Guard {
    const name = this._name;
    return {
      evaluate: (s) => {
        const v = s.get(name);
        return typeof v === 'number' && v > value;
      },
    };
  }

  /** Match when the number input is strictly less than `value`. */
  lessThan(value: number): Guard {
    const name = this._name;
    return {
      evaluate: (s) => {
        const v = s.get(name);
        return typeof v === 'number' && v < value;
      },
    };
  }

  /** Match when the number input is greater than or equal to `value`. */
  atLeast(value: number): Guard {
    const name = this._name;
    return {
      evaluate: (s) => {
        const v = s.get(name);
        return typeof v === 'number' && v >= value;
      },
    };
  }

  /** Match when the number input is less than or equal to `value`. */
  atMost(value: number): Guard {
    const name = this._name;
    return {
      evaluate: (s) => {
        const v = s.get(name);
        return typeof v === 'number' && v <= value;
      },
    };
  }

  /** Match when the trigger input is pending for this evaluation. */
  onTrigger(): Guard {
    const name = this._name;
    return { evaluate: (s) => s.isTriggered(name) };
  }
}

/**
 * Start a guard for the input `name`.
 * @param name - The input the guard reads.
 * @returns A {@link GuardBuilder}.
 */
export function when(name: string): GuardBuilder {
  return new GuardBuilder(name);
}

/** Combine guards so the result matches only when every guard matches. */
export function allOf(...guards: Guard[]): Guard {
  return { evaluate: (s) => guards.every((g) => g.evaluate(s)) };
}

/** Combine guards so the result matches when at least one guard matches. */
export function anyOf(...guards: Guard[]): Guard {
  return { evaluate: (s) => guards.some((g) => g.evaluate(s)) };
}

/**
 * StateMachine — a Rive-style, input-driven animation controller.
 *
 * A machine holds named **states**, typed **inputs** ({@link boolInput},
 * {@link numberInput}, {@link triggerInput}) and **transitions** between states
 * guarded by input conditions. Call {@link update} each frame to evaluate the
 * transitions of the current state. On entering a state the machine runs that
 * state's `onEnter` action, which is where an animation or a property change
 * starts. This makes interactive, state-driven animations (hover to expand,
 * toggle, multi-state UI flows) first-class, which manim-web lacked.
 *
 * The core logic is headless and deterministic: it reads no DOM and, for the
 * same input sequence, produces the same state sequence. To drive it from UI
 * events, pass {@link inputHandler} / {@link triggerHandler} to a `Clickable`
 * `onClick`, a `Hoverable` `onHoverStart` / `onHoverEnd`, or a `Slider`
 * `onChange`.
 *
 * @example
 * ```typescript
 * const sm = new StateMachine();
 * sm.addState('idle');
 * sm.addState('open', { onEnter: () => box.animateTo({ scale: 2 }) });
 * sm.boolInput('hovering', false);
 * sm.triggerInput('click');
 * sm.addTransition('idle', 'open', when('hovering').isTrue());
 * sm.addTransition('open', 'idle', when('click').onTrigger());
 *
 * makeHoverable(box, scene, {
 *   onHoverStart: () => sm.inputHandler('hovering')(true),
 *   onHoverEnd: () => sm.inputHandler('hovering')(false),
 * });
 * // Each frame:
 * sm.update(dt);
 * ```
 */
export class StateMachine {
  private readonly _states = new Map<string, StateConfig>();
  private readonly _inputs = new Map<string, InputSlot>();
  private readonly _transitions = new Map<string, Transition[]>();
  private readonly _initial: string | null;
  private _current: string | null = null;

  /**
   * Create a StateMachine.
   * @param options - Optional initial-state name.
   */
  constructor(options?: StateMachineOptions) {
    this._initial = options?.initial ?? null;
    this._current = this._initial;
  }

  /**
   * Add a state. The first state added becomes the initial state unless an
   * explicit `initial` was passed to the constructor.
   * @param name - Unique state name.
   * @param config - Optional `onEnter` / `onExit` actions.
   * @returns this, for chaining.
   */
  addState(name: string, config: StateConfig = {}): this {
    if (this._states.has(name)) {
      logger.warn(`[StateMachine] state "${name}" already exists; overwriting.`);
    }
    this._states.set(name, config);
    if (this._current === null) {
      this._current = name;
    }
    return this;
  }

  /**
   * Declare a boolean input.
   * @param name - Unique input name.
   * @param initial - Initial value (default: false).
   * @returns this, for chaining.
   */
  boolInput(name: string, initial = false): this {
    this._inputs.set(name, { kind: 'bool', value: initial });
    return this;
  }

  /**
   * Declare a numeric input.
   * @param name - Unique input name.
   * @param initial - Initial value (default: 0).
   * @returns this, for chaining.
   */
  numberInput(name: string, initial = 0): this {
    this._inputs.set(name, { kind: 'number', value: initial });
    return this;
  }

  /**
   * Declare a trigger input. A trigger is pending for exactly one
   * {@link update} evaluation after {@link fire}, then it auto-resets.
   * @param name - Unique input name.
   * @returns this, for chaining.
   */
  triggerInput(name: string): this {
    this._inputs.set(name, { kind: 'trigger', value: false });
    return this;
  }

  /**
   * Add a transition from one state to another, guarded by an optional
   * condition. Transitions are evaluated in the order they are added, and the
   * first matching one fires.
   * @param from - Source state name.
   * @param to - Target state name.
   * @param guard - Condition that must pass; omit for an unconditional transition.
   * @param config - Optional per-transition action.
   * @returns this, for chaining.
   */
  addTransition(from: string, to: string, guard?: Guard, config: TransitionConfig = {}): this {
    const list = this._transitions.get(from) ?? [];
    list.push({ from, to, guard: guard ?? null, action: config.action });
    this._transitions.set(from, list);
    return this;
  }

  /**
   * Set a bool or number input value. A no-op (with a warning) for an unknown
   * input or for a trigger input (use {@link fire}).
   * @param name - Input name.
   * @param value - New value.
   * @returns this, for chaining.
   */
  setInput(name: string, value: InputValue): this {
    const slot = this._inputs.get(name);
    if (!slot) {
      logger.warn(`[StateMachine] setInput on unknown input "${name}".`);
      return this;
    }
    if (slot.kind === 'trigger') {
      logger.warn(`[StateMachine] use fire() for trigger input "${name}".`);
      return this;
    }
    slot.value = value;
    return this;
  }

  /**
   * Make a trigger input pending for the next {@link update}. A no-op (with a
   * warning) for an unknown input or for a non-trigger input.
   * @param name - Trigger input name.
   * @returns this, for chaining.
   */
  fire(name: string): this {
    const slot = this._inputs.get(name);
    if (!slot) {
      logger.warn(`[StateMachine] fire on unknown input "${name}".`);
      return this;
    }
    if (slot.kind !== 'trigger') {
      logger.warn(`[StateMachine] fire() is only for trigger inputs; "${name}" is ${slot.kind}.`);
      return this;
    }
    slot.value = true;
    return this;
  }

  /**
   * Read an input value. Returns the pending flag for a trigger, or `undefined`
   * for an unknown input.
   * @param name - Input name.
   */
  getInput(name: string): InputValue | undefined {
    return this._inputs.get(name)?.value;
  }

  /** The current state name, or `null` when no state is defined. */
  getCurrentState(): string | null {
    return this._current;
  }

  /**
   * A handler that sets a bool or number input, for wiring to a UI event such
   * as a `Slider` `onChange` or a `Hoverable` callback.
   * @param name - Input name.
   */
  inputHandler(name: string): (value: InputValue) => void {
    return (value: InputValue) => {
      this.setInput(name, value);
    };
  }

  /**
   * A handler that fires a trigger input, for wiring to a UI event such as a
   * `Clickable` `onClick`.
   * @param name - Trigger input name.
   */
  triggerHandler(name: string): () => void {
    return () => {
      this.fire(name);
    };
  }

  /**
   * Evaluate the transitions of the current state once. At most one transition
   * fires per call (the first matching, in insertion order). Any pending
   * triggers are reset after the evaluation.
   * @param dt - Delta time (seconds) passed to action contexts. Default 0.
   * @returns `true` if a transition fired.
   */
  update(dt = 0): boolean {
    let changed = false;
    if (this._current !== null) {
      const snapshot = this._snapshot();
      const list = this._transitions.get(this._current) ?? [];
      for (const t of list) {
        if (t.guard === null || t.guard.evaluate(snapshot)) {
          changed = this._performTransition(t, dt);
          break;
        }
      }
    }
    this._resetTriggers();
    return changed;
  }

  /**
   * Reset the machine to its initial state and clear all pending triggers.
   * Does not run `onEnter` / `onExit` actions.
   * @returns this, for chaining.
   */
  reset(): this {
    this._current = this._initial ?? this._firstState();
    this._resetTriggers();
    return this;
  }

  private _firstState(): string | null {
    const first = this._states.keys().next();
    return first.done ? null : first.value;
  }

  private _snapshot(): InputsSnapshot {
    const inputs = this._inputs;
    return {
      get(name: string): InputValue | undefined {
        return inputs.get(name)?.value;
      },
      isTriggered(name: string): boolean {
        const slot = inputs.get(name);
        return slot?.kind === 'trigger' && slot.value === true;
      },
    };
  }

  private _performTransition(t: Transition, dt: number): boolean {
    if (!this._states.has(t.to)) {
      logger.warn(`[StateMachine] transition to unknown state "${t.to}"; ignoring.`);
      return false;
    }
    const from = this._current;
    const context: StateContext = { machine: this, from, to: t.to, dt };

    if (from !== null) {
      this._states.get(from)?.onExit?.(context);
    }
    this._current = t.to;
    this._states.get(t.to)?.onEnter?.(context);
    t.action?.(context);
    return true;
  }

  private _resetTriggers(): void {
    for (const slot of this._inputs.values()) {
      if (slot.kind === 'trigger') {
        slot.value = false;
      }
    }
  }
}
