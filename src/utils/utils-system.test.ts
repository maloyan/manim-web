import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FrameTimeTracker, PerformanceMonitor } from './Performance';
import { logger } from './logger';
import {
  serializeMobject,
  stateToJSON,
  stateFromJSON,
  snapshotToJSON,
  snapshotFromJSON,
  saveMobjectState,
  restoreMobjectState,
  SceneStateManager,
  MobjectState,
  SceneSnapshot,
} from '../core/StateManager';
import { VMobject } from '../core/VMobject';

function makeVM(): VMobject {
  const vm = new VMobject();
  vm.setPoints([
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ]);
  return vm;
}

// =========================================================================
// PerformanceMonitor - FPS calculation, rolling average, callback
// =========================================================================
describe('PerformanceMonitor - FPS computation', () => {
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafId: number;
  let perfNowMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rafCallbacks = new Map();
    rafId = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = ++rafId;
      rafCallbacks.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafCallbacks.delete(id);
    });
    perfNowMock = vi.spyOn(performance, 'now');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function flushRaf(): void {
    const entries = [...rafCallbacks.entries()];
    if (entries.length === 0) return;
    const [id, cb] = entries[entries.length - 1];
    rafCallbacks.delete(id);
    cb(0);
  }

  it('computes FPS after 1 second elapses', () => {
    const monitor = new PerformanceMonitor();
    perfNowMock.mockReturnValueOnce(0).mockReturnValueOnce(0);
    monitor.start();
    for (let i = 0; i < 59; i++) {
      perfNowMock.mockReturnValueOnce(500);
      flushRaf();
    }
    perfNowMock.mockReturnValueOnce(1001);
    flushRaf();
    expect(monitor.getFps()).toBeGreaterThan(50);
    expect(monitor.getFps()).toBeLessThanOrEqual(65);
    expect(monitor.getInstantFps()).toBeGreaterThan(50);
    monitor.stop();
  });

  it('invokes callback with FPS value', () => {
    const callback = vi.fn();
    const monitor = new PerformanceMonitor();
    perfNowMock.mockReturnValueOnce(0).mockReturnValueOnce(0);
    monitor.start(callback);
    for (let i = 0; i < 29; i++) {
      perfNowMock.mockReturnValueOnce(500);
      flushRaf();
    }
    perfNowMock.mockReturnValueOnce(1005);
    flushRaf();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(typeof callback.mock.calls[0][0]).toBe('number');
    expect(callback.mock.calls[0][0]).toBeGreaterThan(0);
    monitor.stop();
  });

  it('rolling average smooths FPS over multiple seconds', () => {
    const monitor = new PerformanceMonitor();
    perfNowMock.mockReturnValueOnce(0).mockReturnValueOnce(0);
    monitor.start();
    // Second 1: ~30 frames
    for (let i = 0; i < 29; i++) {
      perfNowMock.mockReturnValueOnce(500);
      flushRaf();
    }
    perfNowMock.mockReturnValueOnce(1000);
    flushRaf();
    const fps1 = monitor.getFps();
    expect(fps1).toBeGreaterThanOrEqual(29);
    expect(fps1).toBeLessThanOrEqual(31);
    // Second 2: ~60 frames
    for (let i = 0; i < 59; i++) {
      perfNowMock.mockReturnValueOnce(1500);
      flushRaf();
    }
    perfNowMock.mockReturnValueOnce(2000);
    flushRaf();
    const fps2 = monitor.getFps();
    expect(fps2).toBeGreaterThanOrEqual(40);
    expect(fps2).toBeLessThanOrEqual(50);
    monitor.stop();
  });

  it('getInstantFps returns 0 before any measurement', () => {
    expect(new PerformanceMonitor().getInstantFps()).toBe(0);
  });

  it('stop prevents further rAF scheduling', () => {
    const monitor = new PerformanceMonitor();
    perfNowMock.mockReturnValue(0);
    monitor.start();
    monitor.stop();
    expect(monitor.isRunning()).toBe(false);
    if (rafCallbacks.size > 0) {
      perfNowMock.mockReturnValue(2000);
      flushRaf();
      expect(rafCallbacks.size).toBe(0);
    }
  });
});

// =========================================================================
// FrameTimeTracker - edge cases not in utils-extra.test.ts
// =========================================================================
describe('FrameTimeTracker - edge cases', () => {
  let perfNowMock: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    perfNowMock = vi.spyOn(performance, 'now');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('get95thPercentile with a single sample returns that sample', () => {
    const t = new FrameTimeTracker();
    perfNowMock.mockReturnValueOnce(0);
    t.startFrame();
    perfNowMock.mockReturnValueOnce(16);
    t.endFrame();
    expect(t.get95thPercentile()).toBeCloseTo(16, 5);
  });

  it('get95thPercentile with two samples returns the higher one', () => {
    const t = new FrameTimeTracker();
    perfNowMock.mockReturnValueOnce(0);
    t.startFrame();
    perfNowMock.mockReturnValueOnce(10);
    t.endFrame();
    perfNowMock.mockReturnValueOnce(10);
    t.startFrame();
    perfNowMock.mockReturnValueOnce(60);
    t.endFrame();
    expect(t.get95thPercentile()).toBeCloseTo(50, 5);
  });

  it('getSummary returns all zeros when empty', () => {
    const s = new FrameTimeTracker().getSummary();
    expect(s.avg).toBe(0);
    expect(s.min).toBe(0);
    expect(s.max).toBe(0);
    expect(s.p95).toBe(0);
  });

  it('handles identical frame times correctly', () => {
    const t = new FrameTimeTracker();
    for (let i = 0; i < 10; i++) {
      perfNowMock.mockReturnValueOnce(i * 16);
      t.startFrame();
      perfNowMock.mockReturnValueOnce(i * 16 + 16);
      t.endFrame();
    }
    const s = t.getSummary();
    expect(s.avg).toBeCloseTo(16, 5);
    expect(s.min).toBeCloseTo(16, 5);
    expect(s.max).toBeCloseTo(16, 5);
    expect(s.p95).toBeCloseTo(16, 5);
  });

  it('handles sub-millisecond frame times', () => {
    const t = new FrameTimeTracker();
    perfNowMock.mockReturnValueOnce(100);
    t.startFrame();
    perfNowMock.mockReturnValueOnce(100.25);
    t.endFrame();
    expect(t.getAverageFrameTime()).toBeCloseTo(0.25, 5);
  });
});

// =========================================================================
// Logger - sanitization of objects, arrays, nested data
// =========================================================================
describe('logger - sanitization of structured data', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sanitizes sensitive data inside plain objects', () => {
    logger.info({ token: 'Bearer ' + 'eyJ' + 'secrettoken12345' });
    const logged = infoSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(logged.token).toContain('[REDACTED]');
  });

  it('sanitizes sensitive data inside arrays', () => {
    logger.info(['user@example.com', 'safe string']);
    const logged = infoSpy.mock.calls[0][1] as unknown[];
    expect(logged[0]).toContain('[REDACTED]');
    expect(logged[1]).toBe('safe string');
  });

  it('sanitizes nested objects recursively', () => {
    logger.info({ config: { secret_key: 'secret_key=abcdef1234567890' } });
    const logged = infoSpy.mock.calls[0][1] as Record<string, Record<string, unknown>>;
    expect(String(logged.config.secret_key)).toContain('[REDACTED]');
    expect(String(logged.config.secret_key)).not.toContain('abcdef1234567890');
  });

  it('leaves non-string types untouched (numbers, booleans, null)', () => {
    logger.info({ count: 42, active: true, data: null });
    const logged = infoSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(logged.count).toBe(42);
    expect(logged.active).toBe(true);
    expect(logged.data).toBeNull();
  });

  it('redacts multiple sensitive patterns in a single string', () => {
    logger.info('Key: ' + 'AKIA' + '1234567890ABCDEF, email: admin@corp.io');
    const logged = infoSpy.mock.calls[0][1] as string;
    expect(logged).not.toContain('AKIA1234');
    expect(logged).not.toContain('admin@corp.io');
    expect((logged.match(/\[REDACTED\]/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it('handles mixed argument types in a single call', () => {
    logger.info('prefix', { key: 'ghp_' + 'abc123456789012345678901234567890123' }, 42);
    expect(infoSpy.mock.calls[0][1]).toBe('prefix');
    expect(String((infoSpy.mock.calls[0][2] as Record<string, unknown>).key)).toContain(
      '[REDACTED]',
    );
    expect(infoSpy.mock.calls[0][3]).toBe(42);
  });

  it('redacts Stripe test keys and access_token patterns', () => {
    logger.info('pk_test' + '_abcdefghij1234567890abcd');
    expect(infoSpy.mock.calls[0][1]).toContain('[REDACTED]');
    logger.info('access_token=myverysecrettoken1234');
    expect(infoSpy.mock.calls[1][1]).toContain('[REDACTED]');
  });
});

describe('logger - log level filtering', () => {
  it('logger.error calls console.error above info threshold', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('critical failure');
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][1]).toBe('critical failure');
    vi.restoreAllMocks();
  });

  it('logger.warn calls console.warn above info threshold', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('a warning');
    expect(spy).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('all logger methods prefix with [manim-web]', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test');
    expect(spy.mock.calls[0][0]).toBe('[manim-web]');
    vi.restoreAllMocks();
  });
});

// =========================================================================
// StateManager - saveMobjectState / restoreMobjectState
// =========================================================================
describe('saveMobjectState / restoreMobjectState', () => {
  it('captures state and stores it on the mobject', () => {
    const vm = makeVM();
    vm.position.set(1, 2, 3);
    vm.setColor('#ff0000');
    const state = saveMobjectState(vm);
    expect(state.position).toEqual([1, 2, 3]);
    expect(state.color.toLowerCase()).toBe('#ff0000');
    expect((vm as unknown as Record<string, unknown>).__savedMobjectState).toBe(state);
    expect(vm.savedState).toBeDefined();
  });

  it('restores from saved state', () => {
    const vm = makeVM();
    vm.position.set(5, 6, 7);
    vm.setOpacity(0.5);
    saveMobjectState(vm);
    vm.position.set(0, 0, 0);
    vm.setOpacity(1);
    expect(restoreMobjectState(vm)).toBe(true);
    expect(vm.position.x).toBe(5);
    expect(vm.position.y).toBe(6);
    expect(vm.position.z).toBe(7);
    expect(vm.opacity).toBeCloseTo(0.5);
  });

  it('returns false when no state was saved', () => {
    expect(restoreMobjectState(makeVM())).toBe(false);
  });

  it('captures VMobject points', () => {
    const state = saveMobjectState(makeVM());
    expect(state.points3D).toBeDefined();
    expect(state.points3D!.length).toBe(4);
  });

  it('round-trip preserves strokeWidth and fillOpacity', () => {
    const vm = makeVM();
    vm.setStrokeWidth(12);
    vm.setFillOpacity(0.75);
    saveMobjectState(vm);
    vm.setStrokeWidth(1);
    vm.setFillOpacity(0);
    restoreMobjectState(vm);
    expect(vm.strokeWidth).toBe(12);
    expect(vm.fillOpacity).toBe(0.75);
  });
});

// =========================================================================
// snapshotToJSON / snapshotFromJSON
// =========================================================================
describe('snapshotToJSON / snapshotFromJSON', () => {
  it('round-trips a SceneSnapshot through JSON', () => {
    const snapshot: SceneSnapshot = {
      label: 'test-snapshot',
      timestamp: 1700000000000,
      mobjects: [
        {
          id: 'mob-1',
          position: [1, 2, 3],
          rotation: [0, 0, 0, 'XYZ'],
          scale: [1, 1, 1],
          color: '#ffffff',
          opacity: 1,
          strokeWidth: 4,
          fillOpacity: 0,
          style: { strokeColor: '#fff', strokeOpacity: 1, fillColor: '#fff', fillOpacity: 0 },
          children: [],
        },
      ],
    };
    const json = snapshotToJSON(snapshot);
    expect(typeof json).toBe('string');
    const parsed = snapshotFromJSON(json);
    expect(parsed.label).toBe('test-snapshot');
    expect(parsed.timestamp).toBe(1700000000000);
    expect(parsed.mobjects[0].position).toEqual([1, 2, 3]);
  });

  it('handles snapshot with no label', () => {
    const parsed = snapshotFromJSON(snapshotToJSON({ timestamp: 123, mobjects: [] }));
    expect(parsed.label).toBeUndefined();
    expect(parsed.mobjects).toEqual([]);
  });
});

// =========================================================================
// stateToJSON / stateFromJSON - edge cases
// =========================================================================
describe('stateToJSON / stateFromJSON', () => {
  it('preserves nested children through JSON round-trip', () => {
    const parent = new VMobject();
    const child = new VMobject();
    child.position.set(10, 20, 30);
    child.setPoints([[1, 2, 3]]);
    parent.add(child);
    const parsed = stateFromJSON(stateToJSON(serializeMobject(parent)));
    expect(parsed.children.length).toBe(1);
    expect(parsed.children[0].position).toEqual([10, 20, 30]);
    expect(parsed.children[0].points3D!.length).toBe(1);
  });

  it('preserves custom data field if present', () => {
    const state: MobjectState = {
      id: 'test',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 'XYZ'],
      scale: [1, 1, 1],
      color: '#000',
      opacity: 1,
      strokeWidth: 2,
      fillOpacity: 0,
      style: { strokeColor: '#000', strokeOpacity: 1, fillColor: '#000', fillOpacity: 0 },
      children: [],
      custom: { myFlag: true, myValue: 42 },
    };
    const parsed = stateFromJSON(stateToJSON(state));
    expect(parsed.custom).toEqual({ myFlag: true, myValue: 42 });
  });
});

// =========================================================================
// SceneStateManager - extended behaviors
// =========================================================================
describe('SceneStateManager - extended', () => {
  function makeScene(maxDepth?: number) {
    const mobjects: VMobject[] = [makeVM()];
    const mgr = new SceneStateManager(() => mobjects, maxDepth);
    return { mobjects, mgr };
  }

  it('undoStack and redoStack expose read-only views', () => {
    const { mgr } = makeScene();
    mgr.save('s1');
    mgr.save('s2');
    expect(mgr.undoStack.length).toBe(2);
    expect(mgr.undoStack[0].label).toBe('s1');
    expect(mgr.undoStack[1].label).toBe('s2');
  });

  it('undo then save clears redo (new branch)', () => {
    const { mobjects, mgr } = makeScene();
    mobjects[0].position.set(0, 0, 0);
    mgr.save('initial');
    mobjects[0].position.set(5, 0, 0);
    mgr.save('moved');
    mgr.undo();
    expect(mgr.canRedo).toBe(true);
    mgr.save('new branch');
    expect(mgr.canRedo).toBe(false);
  });

  it('multiple undo/redo cycles work correctly', () => {
    const { mobjects, mgr } = makeScene();
    const vm = mobjects[0];
    vm.position.set(1, 0, 0);
    mgr.save('pos1');
    vm.position.set(2, 0, 0);
    mgr.save('pos2');
    vm.position.set(3, 0, 0);
    mgr.save('pos3');
    vm.position.set(4, 0, 0);
    mgr.undo();
    expect(vm.position.x).toBe(3);
    mgr.undo();
    expect(vm.position.x).toBe(2);
    mgr.undo();
    expect(vm.position.x).toBe(1);
    mgr.redo();
    expect(vm.position.x).toBe(2);
    mgr.redo();
    expect(vm.position.x).toBe(3);
  });

  it('maxDepth enforced during redo-triggered undo push', () => {
    const { mobjects, mgr } = makeScene(2);
    mobjects[0].position.set(1, 0, 0);
    mgr.save('s1');
    mobjects[0].position.set(2, 0, 0);
    mgr.save('s2');
    mgr.undo();
    mgr.redo();
    expect(mgr.undoCount).toBeLessThanOrEqual(2);
  });

  it('save returns snapshot with label and timestamp', () => {
    const { mgr } = makeScene();
    const before = Date.now();
    const snapshot = mgr.save('my-label');
    expect(snapshot.label).toBe('my-label');
    expect(snapshot.timestamp).toBeGreaterThanOrEqual(before);
    expect(snapshot.mobjects.length).toBe(1);
  });

  it('getState captures data without affecting stacks', () => {
    const { mobjects, mgr } = makeScene();
    mobjects[0].position.set(11, 22, 33);
    const snapshot = mgr.getState('peek');
    expect(snapshot.mobjects[0].position).toEqual([11, 22, 33]);
    expect(mgr.undoCount).toBe(0);
  });

  it('setState applies snapshot without touching stacks', () => {
    const { mobjects, mgr } = makeScene();
    mobjects[0].position.set(1, 1, 1);
    const snapshot = mgr.getState();
    mobjects[0].position.set(9, 9, 9);
    mgr.setState(snapshot);
    expect(mobjects[0].position.x).toBe(1);
    expect(mgr.undoCount).toBe(0);
  });

  it('handles empty mobjects array gracefully', () => {
    const mgr = new SceneStateManager(() => []);
    const snapshot = mgr.save('empty');
    expect(snapshot.mobjects.length).toBe(0);
    expect(mgr.undo()).toBe(true);
  });

  it('default maxDepth is 50', () => {
    const { mgr } = makeScene();
    expect(mgr.maxDepth).toBe(50);
  });
});
