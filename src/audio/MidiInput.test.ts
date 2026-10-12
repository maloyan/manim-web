/**
 * Tests for the MidiInput Web MIDI driver.
 *
 * Every test injects a FAKE access whose input ports expose a settable
 * `onmidimessage`, so no real `MIDIAccess` is ever created. A helper emits raw
 * MIDI status bytes through that port, exactly as a device would. The tests run
 * in the default Node environment (no DOM), which also proves the module is
 * Node / SSR safe. They assert:
 *   - note-on sets a normalized velocity, note-off clears it,
 *   - control-change updates the normalized control value,
 *   - pitch-bend parses the 14-bit value to [-1, 1],
 *   - event callbacks fire,
 *   - a bound ValueTracker receives the mapped value on update,
 *   - with no `requestMIDIAccess` everything no-ops (zeros / null, no throw).
 */
import { describe, it, expect, vi } from 'vitest';
import { MidiInput, isMidiSupported, type MidiAccessLike, type MidiInputLike } from './MidiInput';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';

// ---------------------------------------------------------------------------
// Fake access / input
// ---------------------------------------------------------------------------

/** A fake MIDI input port that records its handler and can emit messages. */
class FakeInput implements MidiInputLike {
  onmidimessage: ((event: { data: Uint8Array | null }) => void) | null = null;
  constructor(readonly name: string | null = null) {}

  /** Emit a raw MIDI message to the attached handler. */
  emit(bytes: number[] | null): void {
    this.onmidimessage?.({ data: bytes === null ? null : Uint8Array.from(bytes) });
  }
}

/** Build a fake access over the given input ports. */
function makeAccess(...inputs: FakeInput[]): MidiAccessLike & { triggerStateChange(): void } {
  let stateChange: (() => void) | null = null;
  return {
    inputs,
    get onstatechange(): (() => void) | null {
      return stateChange;
    },
    set onstatechange(next: (() => void) | null) {
      stateChange = next;
    },
    triggerStateChange(): void {
      stateChange?.();
    },
  };
}

// ---------------------------------------------------------------------------
// Note messages
// ---------------------------------------------------------------------------

describe('MidiInput notes', () => {
  it('note-on sets a normalized velocity and marks the note on', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0x90, 60, 127]); // note-on, middle C, full velocity

    expect(midi.isNoteOn(60)).toBe(true);
    expect(midi.getNote(60)).toBeCloseTo(1, 5);
  });

  it('normalizes a partial velocity to [0, 1]', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0x90, 64, 64]);
    expect(midi.getNote(64)).toBeCloseTo(64 / 127, 5);
  });

  it('note-off clears the note', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0x90, 60, 100]);
    expect(midi.isNoteOn(60)).toBe(true);

    input.emit([0x80, 60, 0]); // note-off
    expect(midi.isNoteOn(60)).toBe(false);
    expect(midi.getNote(60)).toBeNull();
  });

  it('treats a note-on with zero velocity as a note-off', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0x90, 72, 80]);
    expect(midi.isNoteOn(72)).toBe(true);

    input.emit([0x90, 72, 0]); // running-status note-off
    expect(midi.isNoteOn(72)).toBe(false);
  });

  it('ignores the channel in the status byte', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0x95, 48, 100]); // note-on on channel 5
    expect(midi.isNoteOn(48)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Control change
// ---------------------------------------------------------------------------

describe('MidiInput control change', () => {
  it('updates the normalized control value', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0xb0, 1, 127]); // CC 1 (mod wheel) full
    expect(midi.getControl(1)).toBeCloseTo(1, 5);

    input.emit([0xb0, 1, 0]);
    expect(midi.getControl(1)).toBeCloseTo(0, 5);
  });

  it('returns 0 for a controller that has not been seen', () => {
    const midi = new MidiInput({ access: makeAccess(new FakeInput()) });
    expect(midi.getControl(74)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Pitch bend
// ---------------------------------------------------------------------------

describe('MidiInput pitch bend', () => {
  it('parses the centered 14-bit value to 0', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    // center = 8192 => LSB 0, MSB 64 (64 << 7 = 8192)
    input.emit([0xe0, 0, 64]);
    expect(midi.getPitchBend()).toBeCloseTo(0, 5);
  });

  it('parses the minimum value to -1', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0xe0, 0, 0]); // raw 0
    expect(midi.getPitchBend()).toBeCloseTo(-1, 5);
  });

  it('parses the maximum value near +1', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0xe0, 0x7f, 0x7f]); // raw 16383
    expect(midi.getPitchBend()).toBeCloseTo((16383 - 8192) / 8192, 5);
  });

  it('combines the LSB and MSB into the 14-bit value', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    // LSB 10, MSB 65 => raw = (65 << 7) | 10 = 8330
    input.emit([0xe0, 10, 65]);
    expect(midi.getPitchBend()).toBeCloseTo((8330 - 8192) / 8192, 5);
  });
});

// ---------------------------------------------------------------------------
// Event callbacks
// ---------------------------------------------------------------------------

describe('MidiInput callbacks', () => {
  it('fires onNoteOn with the note and normalized velocity', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    const onNoteOn = vi.fn();
    midi.onNoteOn(onNoteOn);

    input.emit([0x90, 60, 127]);
    expect(onNoteOn).toHaveBeenCalledWith(60, 1);
  });

  it('fires onNoteOff on a note-off', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    const onNoteOff = vi.fn();
    midi.onNoteOff(onNoteOff);

    input.emit([0x90, 60, 100]);
    input.emit([0x80, 60, 0]);
    expect(onNoteOff).toHaveBeenCalledWith(60);
  });

  it('fires onControlChange with the controller and normalized value', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    const onCc = vi.fn();
    midi.onControlChange(onCc);

    input.emit([0xb0, 7, 64]); // CC 7 (volume)
    expect(onCc).toHaveBeenCalledWith(7, 64 / 127);
  });

  it('stops notifying after unsubscribe', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    const onNoteOn = vi.fn();
    const off = midi.onNoteOn(onNoteOn);

    off();
    input.emit([0x90, 60, 100]);
    expect(onNoteOn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ValueTracker binding
// ---------------------------------------------------------------------------

describe('MidiInput bindToTracker', () => {
  it('drives the tracker with the mapped read on update', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0xb0, 1, 127]); // CC 1 = 1.0

    const tracker = new ValueTracker(0);
    midi.bindToTracker(tracker, () => midi.getControl(1), { scale: 4, offset: 1 });

    // Not called until update runs.
    expect(tracker.getValue()).toBe(0);

    tracker.update(0.016);
    // mapped = 1 + 1.0 * 4 = 5.
    expect(tracker.getValue()).toBeCloseTo(5, 5);
  });

  it('defaults the read to getPitchBend', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0xe0, 0, 0]); // pitch bend = -1

    const tracker = new ValueTracker(0);
    midi.bindToTracker(tracker);
    tracker.update(0.016);
    expect(tracker.getValue()).toBeCloseTo(-1, 5);
  });

  it('returns the updater so it can be removed', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    const tracker = new ValueTracker(0);
    const updater = midi.bindToTracker(tracker, () => midi.getControl(1));
    tracker.removeUpdater(updater);
    tracker.update(0.016);
    expect(tracker.getValue()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// createUpdater factory
// ---------------------------------------------------------------------------

describe('MidiInput createUpdater', () => {
  it('maps the MIDI state onto a mobject property each frame', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0xb0, 20, 64]);

    const tracker = new ValueTracker(0);
    const updater = midi.createUpdater<ValueTracker>((mob, m) => {
      mob.setValue(m.getControl(20));
    });
    tracker.addUpdater(updater);
    tracker.update(0.016);
    expect(tracker.getValue()).toBeCloseTo(64 / 127, 5);
  });
});

// ---------------------------------------------------------------------------
// Connection / introspection
// ---------------------------------------------------------------------------

describe('MidiInput connection', () => {
  it('lists the attached input names', async () => {
    const midi = new MidiInput();
    await midi.connect({
      access: makeAccess(new FakeInput('Keystation'), new FakeInput('Launchpad')),
    });
    expect(midi.getInputNames()).toEqual(['Keystation', 'Launchpad']);
    expect(midi.connected).toBe(true);
  });

  it('re-attaches inputs on a device state change', () => {
    const existing = new FakeInput('A');
    const access = makeAccess(existing);
    const midi = new MidiInput({ access });

    // A new port becomes reachable through the same access after binding.
    (access.inputs as FakeInput[]).push(new FakeInput('B'));
    access.triggerStateChange();

    expect(midi.getInputNames()).toEqual(['A', 'B']);
  });

  it('dispose detaches handlers and resets state', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    input.emit([0x90, 60, 100]);
    expect(midi.isNoteOn(60)).toBe(true);

    midi.dispose();
    expect(midi.connected).toBe(false);
    expect(midi.isNoteOn(60)).toBe(false);
    expect(input.onmidimessage).toBeNull();
    // Messages after dispose are ignored (handler detached).
    input.emit([0x90, 62, 100]);
    expect(midi.isNoteOn(62)).toBe(false);
  });

  it('ignores empty or null message data', () => {
    const input = new FakeInput();
    const midi = new MidiInput({ access: makeAccess(input) });
    expect(() => input.emit(null)).not.toThrow();
    expect(() => input.emit([])).not.toThrow();
    expect(midi.getPitchBend()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Node / SSR safety (no Web MIDI)
// ---------------------------------------------------------------------------

describe('MidiInput without Web MIDI support', () => {
  it('reports MIDI unsupported in Node', () => {
    expect(isMidiSupported()).toBe(false);
  });

  it('connect is a safe no-op that resolves to this', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const midi = new MidiInput();
    const result = await midi.connect();
    expect(result).toBe(midi);
    expect(midi.connected).toBe(false);
    warnSpy.mockRestore();
  });

  it('reads return zeros / null when disconnected, no throw', () => {
    const midi = new MidiInput();
    expect(midi.getNote(60)).toBeNull();
    expect(midi.isNoteOn(60)).toBe(false);
    expect(midi.getControl(1)).toBe(0);
    expect(midi.getPitchBend()).toBe(0);
    expect(midi.getInputNames()).toEqual([]);
  });

  it('dispose is safe when nothing was bound', () => {
    const midi = new MidiInput();
    expect(() => midi.dispose()).not.toThrow();
  });
});
