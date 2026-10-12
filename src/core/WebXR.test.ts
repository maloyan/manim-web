import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { enableXR, isXRSupported, WebXRSession, type XRSceneLike } from './WebXR';

/**
 * These tests never touch a real headset or a real WebGL context. They inject
 * a stub `navigator.xr` and a stub renderer that records `xr.enabled` and
 * `setAnimationLoop` calls, which is all the XR lifecycle contract needs.
 */

interface StubRenderer {
  threeRenderer: THREE.WebGLRenderer;
  xr: {
    enabled: boolean;
    setReferenceSpaceType: ReturnType<typeof vi.fn>;
    setSession: ReturnType<typeof vi.fn>;
  };
  setAnimationLoop: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
}

function makeStubRenderer(): StubRenderer {
  const xr = {
    enabled: false,
    setReferenceSpaceType: vi.fn(),
    setSession: vi.fn().mockResolvedValue(undefined),
  };
  const setAnimationLoop = vi.fn();
  const render = vi.fn();
  const threeRenderer = { xr, setAnimationLoop, render } as unknown as THREE.WebGLRenderer;
  return { threeRenderer, xr, setAnimationLoop, render };
}

interface StubSession {
  session: XRSession;
  end: ReturnType<typeof vi.fn>;
  listeners: Map<string, Array<() => void>>;
  fireEnd: () => void;
}

function makeStubSession(): StubSession {
  const listeners = new Map<string, Array<() => void>>();
  const end = vi.fn().mockResolvedValue(undefined);
  const session = {
    end,
    addEventListener: vi.fn((type: string, cb: () => void) => {
      const list = listeners.get(type) ?? [];
      list.push(cb);
      listeners.set(type, list);
    }),
    removeEventListener: vi.fn((type: string, cb: () => void) => {
      const list = listeners.get(type);
      if (list)
        listeners.set(
          type,
          list.filter((f) => f !== cb),
        );
    }),
  } as unknown as XRSession;
  return {
    session,
    end,
    listeners,
    fireEnd: () => (listeners.get('end') ?? []).forEach((f) => f()),
  };
}

function makeScene(renderer: StubRenderer): XRSceneLike {
  return {
    threeScene: new THREE.Scene(),
    renderer: { getThreeRenderer: () => renderer.threeRenderer },
    camera3D: { getCamera: () => new THREE.PerspectiveCamera() },
  };
}

function stubXR(session: XRSession, supported = true) {
  const isSessionSupported = vi.fn().mockResolvedValue(supported);
  const requestSession = vi.fn().mockResolvedValue(session);
  vi.stubGlobal('navigator', { xr: { isSessionSupported, requestSession } });
  return { isSessionSupported, requestSession };
}

describe('WebXR', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isXRSupported', () => {
    it('reflects the stub navigator.xr', async () => {
      const { session } = makeStubSession();
      const { isSessionSupported } = stubXR(session, true);
      await expect(isXRSupported('immersive-vr')).resolves.toBe(true);
      expect(isSessionSupported).toHaveBeenCalledWith('immersive-vr');
    });

    it('reflects an unsupported stub', async () => {
      const { session } = makeStubSession();
      stubXR(session, false);
      await expect(isXRSupported()).resolves.toBe(false);
    });

    it('is false when navigator.xr is absent', async () => {
      vi.stubGlobal('navigator', {});
      await expect(isXRSupported()).resolves.toBe(false);
    });

    it('is false and does not throw when navigator is absent', async () => {
      vi.stubGlobal('navigator', undefined);
      await expect(isXRSupported()).resolves.toBe(false);
    });

    it('is false when isSessionSupported throws', async () => {
      vi.stubGlobal('navigator', {
        xr: { isSessionSupported: vi.fn().mockRejectedValue(new Error('boom')) },
      });
      await expect(isXRSupported()).resolves.toBe(false);
    });
  });

  describe('enterXR', () => {
    it('enables xr, requests the session, and switches to setAnimationLoop', async () => {
      const renderer = makeStubRenderer();
      const { session } = makeStubSession();
      const { requestSession } = stubXR(session);
      const xr = enableXR(makeScene(renderer), { mode: 'immersive-vr' });

      const entered = await xr.enterXR();

      expect(entered).toBe(true);
      expect(xr.active).toBe(true);
      expect(renderer.xr.enabled).toBe(true);
      expect(renderer.xr.setReferenceSpaceType).toHaveBeenCalledWith('local-floor');
      expect(renderer.xr.setSession).toHaveBeenCalledWith(session);
      expect(requestSession).toHaveBeenCalledWith('immersive-vr', {});
      expect(renderer.setAnimationLoop).toHaveBeenCalledTimes(1);
      expect(typeof renderer.setAnimationLoop.mock.calls[0][0]).toBe('function');
      expect(xr.session).toBe(session);
    });

    it('requests the chosen mode and forwards sessionInit', async () => {
      const renderer = makeStubRenderer();
      const { session } = makeStubSession();
      const { requestSession } = stubXR(session);
      const init = { optionalFeatures: ['hand-tracking'] };
      const xr = enableXR(makeScene(renderer), { mode: 'immersive-ar', sessionInit: init });

      await xr.enterXR();

      expect(requestSession).toHaveBeenCalledWith('immersive-ar', init);
    });

    it('renders the scene and calls onFrame from the XR loop', async () => {
      const renderer = makeStubRenderer();
      const { session } = makeStubSession();
      stubXR(session);
      const onFrame = vi.fn();
      const scene = makeScene(renderer);
      const xr = enableXR(scene, { onFrame });

      await xr.enterXR();
      const loop = renderer.setAnimationLoop.mock.calls[0][0] as (t: number, f: unknown) => void;
      loop(123, undefined);

      expect(renderer.render).toHaveBeenCalledWith(scene.threeScene, expect.anything());
      expect(onFrame).toHaveBeenCalledWith(123, null);
    });

    it('is a no-op (returns false, no throw) without navigator.xr', async () => {
      const renderer = makeStubRenderer();
      vi.stubGlobal('navigator', {});
      const xr = enableXR(makeScene(renderer));

      const entered = await xr.enterXR();

      expect(entered).toBe(false);
      expect(xr.active).toBe(false);
      expect(renderer.xr.enabled).toBe(false);
      expect(renderer.setAnimationLoop).not.toHaveBeenCalled();
    });

    it('returns false and rolls back when requestSession rejects', async () => {
      const renderer = makeStubRenderer();
      vi.stubGlobal('navigator', {
        xr: {
          isSessionSupported: vi.fn().mockResolvedValue(true),
          requestSession: vi.fn().mockRejectedValue(new Error('denied')),
        },
      });
      const xr = enableXR(makeScene(renderer));

      const entered = await xr.enterXR();

      expect(entered).toBe(false);
      expect(renderer.xr.enabled).toBe(false);
      expect(renderer.setAnimationLoop).not.toHaveBeenCalled();
    });

    it('is idempotent when already active', async () => {
      const renderer = makeStubRenderer();
      const { session } = makeStubSession();
      const { requestSession } = stubXR(session);
      const xr = enableXR(makeScene(renderer));

      await xr.enterXR();
      const entered = await xr.enterXR();

      expect(entered).toBe(true);
      expect(requestSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('exitXR', () => {
    it('ends the session and restores the desktop render state', async () => {
      const renderer = makeStubRenderer();
      renderer.xr.enabled = false;
      const { session, end } = makeStubSession();
      stubXR(session);
      const onExit = vi.fn();
      const xr = enableXR(makeScene(renderer), { onExit });

      await xr.enterXR();
      expect(renderer.xr.enabled).toBe(true);
      await xr.exitXR();

      expect(end).toHaveBeenCalledTimes(1);
      expect(xr.active).toBe(false);
      expect(xr.session).toBeNull();
      expect(renderer.xr.enabled).toBe(false);
      expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
      expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when inactive', async () => {
      const renderer = makeStubRenderer();
      const { session } = makeStubSession();
      stubXR(session);
      const xr = enableXR(makeScene(renderer));

      await expect(xr.exitXR()).resolves.toBeUndefined();
      expect(renderer.setAnimationLoop).not.toHaveBeenCalled();
    });

    it('cleans up when the session ends from inside the headset', async () => {
      const renderer = makeStubRenderer();
      const { session, fireEnd } = makeStubSession();
      stubXR(session);
      const xr = enableXR(makeScene(renderer));

      await xr.enterXR();
      expect(xr.active).toBe(true);
      fireEnd();

      expect(xr.active).toBe(false);
      expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
    });
  });

  describe('createButton', () => {
    it('no-ops (returns null) without a DOM', () => {
      const renderer = makeStubRenderer();
      const { session } = makeStubSession();
      stubXR(session);
      const xr = enableXR(makeScene(renderer));

      expect(typeof document).toBe('undefined');
      expect(xr.createButton()).toBeNull();
    });
  });

  describe('construction', () => {
    it('is inert until enterXR (does not touch the renderer)', () => {
      const renderer = makeStubRenderer();
      enableXR(makeScene(renderer));

      expect(renderer.xr.enabled).toBe(false);
      expect(renderer.setAnimationLoop).not.toHaveBeenCalled();
      expect(renderer.render).not.toHaveBeenCalled();
    });

    it('exposes the requested mode', () => {
      const renderer = makeStubRenderer();
      const xr: WebXRSession = enableXR(makeScene(renderer), { mode: 'immersive-ar' });
      expect(xr.mode).toBe('immersive-ar');
    });
  });
});
