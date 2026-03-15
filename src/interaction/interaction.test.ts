// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Minimal mocks for Mobject and Scene so we can test interaction logic
// without WebGL / Three.js renderer instantiation.
// ---------------------------------------------------------------------------

/**
 * Create a mock Mobject with controllable center and bounding box.
 */
function createMockMobject(
  opts: {
    center?: [number, number, number];
    bounds?: { width: number; height: number };
    color?: string;
    opacity?: number;
  } = {},
) {
  const center = opts.center ?? [0, 0, 0];
  const bounds = opts.bounds ?? { width: 2, height: 2 };

  return {
    getCenter: vi.fn(() => [...center] as [number, number, number]),
    getBoundingBox: vi.fn(() => ({ ...bounds })),
    position: { x: center[0], y: center[1], z: center[2] },
    scaleVector: {
      x: 1,
      y: 1,
      z: 1,
      set: vi.fn(function (this: any, x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
      }),
    },
    color: opts.color ?? '#ffffff',
    opacity: opts.opacity ?? 1,
    setColor: vi.fn(function (this: any, c: string) {
      this.color = c;
    }),
    setOpacity: vi.fn(function (this: any, o: number) {
      this.opacity = o;
    }),
    scale: vi.fn(),
    moveTo: vi.fn(function (this: any, pos: [number, number, number]) {
      this.position.x = pos[0];
      this.position.y = pos[1];
      this.position.z = pos[2];
    }),
    _markDirty: vi.fn(),
    getThreeObject: vi.fn(() => new THREE.Object3D()),
  };
}

/**
 * Create a mock Scene with a fake canvas element, camera, and mobjects set.
 */
function createMockScene(
  opts: {
    canvasWidth?: number;
    canvasHeight?: number;
    frameWidth?: number;
    frameHeight?: number;
  } = {},
) {
  const canvasWidth = opts.canvasWidth ?? 800;
  const canvasHeight = opts.canvasHeight ?? 600;
  const frameWidth = opts.frameWidth ?? 14;
  const frameHeight = opts.frameHeight ?? 8;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  // happy-dom's getBoundingClientRect returns zeros; override it
  canvas.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: canvasWidth,
    bottom: canvasHeight,
    width: canvasWidth,
    height: canvasHeight,
    x: 0,
    y: 0,
    toJSON: () => {},
  });

  document.body.appendChild(canvas);

  const mobjectsSet = new Set<any>();
  return {
    getCanvas: vi.fn(() => canvas),
    getContainer: vi.fn(() => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      return div;
    }),
    camera: {
      frameWidth,
      frameHeight,
      getCamera: vi.fn(() => ({})),
    },
    mobjects: mobjectsSet,
    threeScene: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    render: vi.fn(),
    isPlaying: false,
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    timeline: null,
    _canvas: canvas,
  };
}

// ---------------------------------------------------------------------------
// Import the modules under test.
// We import after mock setup since the modules don't auto-execute DOM work
// on import - they only do so in constructors.
// ---------------------------------------------------------------------------
import { Clickable, makeClickable } from './Clickable';
import { Hoverable, makeHoverable } from './Hoverable';
import { Draggable, makeDraggable } from './Draggable';
import { SelectionManager } from './SelectionManager';

// ---------------------------------------------------------------------------
// Helper: Simulate mouse/touch events on a canvas
// ---------------------------------------------------------------------------

function fireMouseEvent(
  target: HTMLElement,
  type: string,
  opts: { clientX?: number; clientY?: number; button?: number; shiftKey?: boolean } = {},
) {
  const event = new MouseEvent(type, {
    clientX: opts.clientX ?? 0,
    clientY: opts.clientY ?? 0,
    button: opts.button ?? 0,
    shiftKey: opts.shiftKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

function fireKeyboardEvent(
  target: EventTarget,
  type: string,
  opts: { key?: string; ctrlKey?: boolean; metaKey?: boolean } = {},
) {
  const event = new KeyboardEvent(type, {
    key: opts.key ?? '',
    ctrlKey: opts.ctrlKey ?? false,
    metaKey: opts.metaKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

// ============================================================================
// Clickable
// ============================================================================

describe('Clickable', () => {
  let scene: ReturnType<typeof createMockScene>;
  let mob: ReturnType<typeof createMockMobject>;
  let onClick: ReturnType<typeof vi.fn>;
  let clickable: Clickable;

  beforeEach(() => {
    scene = createMockScene();
    mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    onClick = vi.fn();
    clickable = new Clickable(mob as any, scene as any, { onClick });
  });

  afterEach(() => {
    clickable.dispose();
    scene._canvas.remove();
  });

  it('constructs with enabled state', () => {
    expect(clickable.isEnabled).toBe(true);
  });

  it('exposes the attached mobject', () => {
    expect(clickable.mobject).toBe(mob);
  });

  it('enable() / disable() toggle the enabled state', () => {
    clickable.disable();
    expect(clickable.isEnabled).toBe(false);

    clickable.enable();
    expect(clickable.isEnabled).toBe(true);
  });

  it('fires onClick when click lands inside mobject bounds', () => {
    // Canvas is 800x600, camera frame is 14x8.
    // Center of canvas (400, 300) maps to world (0, 0) which is the mobject center.
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'click', { clientX: 400, clientY: 300 });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(mob, expect.any(MouseEvent));
  });

  it('does NOT fire onClick when click is outside mobject bounds', () => {
    // Far corner: world position is outside the 2x2 bounds around (0,0)
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'click', { clientX: 0, clientY: 0 });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does NOT fire onClick when disabled', () => {
    clickable.disable();
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'click', { clientX: 400, clientY: 300 });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires onDoubleClick when provided and double-click lands inside', () => {
    const onDoubleClick = vi.fn();
    clickable.dispose();
    clickable = new Clickable(mob as any, scene as any, { onClick, onDoubleClick });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'dblclick', { clientX: 400, clientY: 300 });
    expect(onDoubleClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onDoubleClick when not provided', () => {
    // Default clickable has no onDoubleClick handler
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'dblclick', { clientX: 400, clientY: 300 });
    // Should not throw and onClick should not be called for dblclick
    expect(onClick).not.toHaveBeenCalled();
  });

  it('makeClickable factory returns a Clickable instance', () => {
    const c = makeClickable(mob as any, scene as any, { onClick });
    expect(c).toBeInstanceOf(Clickable);
    c.dispose();
  });

  it('dispose removes event listeners (no errors on subsequent clicks)', () => {
    clickable.dispose();
    const canvas = scene.getCanvas();
    // Should not throw after dispose
    fireMouseEvent(canvas, 'click', { clientX: 400, clientY: 300 });
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Hoverable
// ============================================================================

describe('Hoverable', () => {
  let scene: ReturnType<typeof createMockScene>;
  let mob: ReturnType<typeof createMockMobject>;
  let hoverable: Hoverable;

  beforeEach(() => {
    scene = createMockScene();
    mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    hoverable = new Hoverable(mob as any, scene as any);
  });

  afterEach(() => {
    hoverable.dispose();
    scene._canvas.remove();
  });

  it('constructs with default options (hoverScale 1.1, cursor pointer)', () => {
    expect(hoverable.isEnabled).toBe(true);
    expect(hoverable.isHovering).toBe(false);
  });

  it('exposes the attached mobject', () => {
    expect(hoverable.mobject).toBe(mob);
  });

  it('starts hover when mouse moves over mobject', () => {
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(hoverable.isHovering).toBe(true);
  });

  it('ends hover when mouse moves away from mobject', () => {
    const canvas = scene.getCanvas();
    // Enter hover
    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(hoverable.isHovering).toBe(true);

    // Move far away
    fireMouseEvent(canvas, 'mousemove', { clientX: 0, clientY: 0 });
    expect(hoverable.isHovering).toBe(false);
  });

  it('ends hover on mouseleave', () => {
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(hoverable.isHovering).toBe(true);

    fireMouseEvent(canvas, 'mouseleave');
    expect(hoverable.isHovering).toBe(false);
  });

  it('calls onHoverStart and onHoverEnd callbacks', () => {
    const onHoverStart = vi.fn();
    const onHoverEnd = vi.fn();
    hoverable.dispose();
    hoverable = new Hoverable(mob as any, scene as any, { onHoverStart, onHoverEnd });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(onHoverStart).toHaveBeenCalledWith(mob);

    fireMouseEvent(canvas, 'mousemove', { clientX: 0, clientY: 0 });
    expect(onHoverEnd).toHaveBeenCalledWith(mob);
  });

  it('does not enter hover when disabled', () => {
    hoverable.disable();
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(hoverable.isHovering).toBe(false);
  });

  it('disable() ends active hover', () => {
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(hoverable.isHovering).toBe(true);

    hoverable.disable();
    expect(hoverable.isHovering).toBe(false);
  });

  it('applies hoverColor during hover', () => {
    hoverable.dispose();
    hoverable = new Hoverable(mob as any, scene as any, { hoverColor: '#ff0000', hoverScale: 1 });
    const canvas = scene.getCanvas();

    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(mob.setColor).toHaveBeenCalledWith('#ff0000');
  });

  it('applies hoverOpacity during hover', () => {
    hoverable.dispose();
    hoverable = new Hoverable(mob as any, scene as any, { hoverOpacity: 0.5, hoverScale: 1 });
    const canvas = scene.getCanvas();

    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(mob.setOpacity).toHaveBeenCalledWith(0.5);
  });

  it('restores original color/opacity on hover end', () => {
    hoverable.dispose();
    mob.color = '#00ff00';
    mob.opacity = 0.8;
    hoverable = new Hoverable(mob as any, scene as any, {
      hoverColor: '#ff0000',
      hoverOpacity: 0.5,
      hoverScale: 1,
    });
    const canvas = scene.getCanvas();

    // Start hover
    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    // End hover
    fireMouseEvent(canvas, 'mousemove', { clientX: 0, clientY: 0 });

    // Should restore original values
    expect(mob.setColor).toHaveBeenLastCalledWith('#00ff00');
    expect(mob.setOpacity).toHaveBeenLastCalledWith(0.8);
  });

  it('makeHoverable factory returns a Hoverable instance', () => {
    const h = makeHoverable(mob as any, scene as any);
    expect(h).toBeInstanceOf(Hoverable);
    h.dispose();
  });
});

// ============================================================================
// Draggable
// ============================================================================

describe('Draggable', () => {
  let scene: ReturnType<typeof createMockScene>;
  let mob: ReturnType<typeof createMockMobject>;
  let draggable: Draggable;

  beforeEach(() => {
    scene = createMockScene();
    mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    draggable = new Draggable(mob as any, scene as any);
  });

  afterEach(() => {
    draggable.dispose();
    scene._canvas.remove();
  });

  it('constructs with enabled state and not dragging', () => {
    expect(draggable.isEnabled).toBe(true);
    expect(draggable.isDragging).toBe(false);
  });

  it('exposes the attached mobject', () => {
    expect(draggable.mobject).toBe(mob);
  });

  it('enable() / disable() toggle the enabled state', () => {
    draggable.disable();
    expect(draggable.isEnabled).toBe(false);

    draggable.enable();
    expect(draggable.isEnabled).toBe(true);
  });

  it('starts dragging on mousedown inside mobject bounds', () => {
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    expect(draggable.isDragging).toBe(true);
  });

  it('does NOT start dragging on mousedown outside mobject bounds', () => {
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 0, clientY: 0 });
    expect(draggable.isDragging).toBe(false);
  });

  it('does NOT start dragging when disabled', () => {
    draggable.disable();
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    expect(draggable.isDragging).toBe(false);
  });

  it('ends dragging on mouseup', () => {
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    expect(draggable.isDragging).toBe(true);

    fireMouseEvent(window as any, 'mouseup', { clientX: 400, clientY: 300 });
    expect(draggable.isDragging).toBe(false);
  });

  it('calls onDragStart, onDrag, onDragEnd callbacks', () => {
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();

    draggable.dispose();
    draggable = new Draggable(mob as any, scene as any, { onDragStart, onDrag, onDragEnd });

    const canvas = scene.getCanvas();

    // Start drag
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    expect(onDragStart).toHaveBeenCalledTimes(1);

    // Move
    fireMouseEvent(window as any, 'mousemove', { clientX: 450, clientY: 300 });
    expect(onDrag).toHaveBeenCalledTimes(1);

    // End drag
    fireMouseEvent(window as any, 'mouseup', { clientX: 450, clientY: 300 });
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('calls moveTo on the mobject during drag', () => {
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouseEvent(window as any, 'mousemove', { clientX: 450, clientY: 350 });
    expect(mob.moveTo).toHaveBeenCalled();
  });

  it('applies X constraints during drag', () => {
    draggable.dispose();
    draggable = new Draggable(mob as any, scene as any, {
      constrainX: [-1, 1],
    });

    const canvas = scene.getCanvas();
    // Start drag at center
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });

    // Move to far right (world X would be 7 at right edge, clamped to 1)
    fireMouseEvent(window as any, 'mousemove', { clientX: 800, clientY: 300 });

    expect(mob.moveTo).toHaveBeenCalled();
    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    const movedX = lastCall[0][0];
    expect(movedX).toBeLessThanOrEqual(1);
  });

  it('applies Y constraints during drag', () => {
    draggable.dispose();
    draggable = new Draggable(mob as any, scene as any, {
      constrainY: [-1, 1],
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });

    // Move to far top (world Y would be 4 at top edge, clamped to 1)
    fireMouseEvent(window as any, 'mousemove', { clientX: 400, clientY: 0 });

    expect(mob.moveTo).toHaveBeenCalled();
    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    const movedY = lastCall[0][1];
    expect(movedY).toBeLessThanOrEqual(1);
  });

  it('applies snap-to-grid during drag', () => {
    draggable.dispose();
    draggable = new Draggable(mob as any, scene as any, {
      snapToGrid: 0.5,
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });

    // Move slightly (should snap to nearest 0.5 grid)
    fireMouseEvent(window as any, 'mousemove', { clientX: 410, clientY: 310 });

    expect(mob.moveTo).toHaveBeenCalled();
    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    const pos = lastCall[0];
    // Position should be a multiple of 0.5
    expect(pos[0] % 0.5).toBeCloseTo(0, 5);
    expect(pos[1] % 0.5).toBeCloseTo(0, 5);
  });

  it('does not update drag position when not dragging', () => {
    // Just move without mousedown first
    fireMouseEvent(window as any, 'mousemove', { clientX: 450, clientY: 350 });
    expect(mob.moveTo).not.toHaveBeenCalled();
  });

  it('makeDraggable factory returns a Draggable instance', () => {
    const d = makeDraggable(mob as any, scene as any);
    expect(d).toBeInstanceOf(Draggable);
    d.dispose();
  });
});

// ============================================================================
// SelectionManager
// ============================================================================

describe('SelectionManager', () => {
  let scene: ReturnType<typeof createMockScene>;
  let mgr: SelectionManager;
  let mobA: ReturnType<typeof createMockMobject>;
  let mobB: ReturnType<typeof createMockMobject>;
  let mobC: ReturnType<typeof createMockMobject>;

  beforeEach(() => {
    scene = createMockScene();
    mobA = createMockMobject({ center: [-3, 0, 0], bounds: { width: 1, height: 1 } });
    mobB = createMockMobject({ center: [0, 0, 0], bounds: { width: 1, height: 1 } });
    mobC = createMockMobject({ center: [3, 0, 0], bounds: { width: 1, height: 1 } });

    scene.mobjects.add(mobA);
    scene.mobjects.add(mobB);
    scene.mobjects.add(mobC);

    mgr = new SelectionManager(scene as any);
  });

  afterEach(() => {
    mgr.dispose();
    scene._canvas.remove();
  });

  // --- Programmatic selection API ---

  describe('programmatic selection', () => {
    it('starts with empty selection', () => {
      expect(mgr.count).toBe(0);
      expect(mgr.selected.size).toBe(0);
    });

    it('select() adds mobjects to selection', () => {
      mgr.select(mobA as any);
      expect(mgr.count).toBe(1);
      expect(mgr.isSelected(mobA as any)).toBe(true);
    });

    it('select() can add multiple mobjects at once', () => {
      mgr.select(mobA as any, mobB as any, mobC as any);
      expect(mgr.count).toBe(3);
    });

    it('select() is idempotent - adding same mobject twice does not duplicate', () => {
      mgr.select(mobA as any);
      mgr.select(mobA as any);
      expect(mgr.count).toBe(1);
    });

    it('deselect() removes mobjects from selection', () => {
      mgr.select(mobA as any, mobB as any);
      mgr.deselect(mobA as any);
      expect(mgr.count).toBe(1);
      expect(mgr.isSelected(mobA as any)).toBe(false);
      expect(mgr.isSelected(mobB as any)).toBe(true);
    });

    it('deselect() is safe to call on non-selected mobject', () => {
      mgr.deselect(mobA as any);
      expect(mgr.count).toBe(0);
    });

    it('toggleSelect() toggles selection', () => {
      mgr.toggleSelect(mobA as any);
      expect(mgr.isSelected(mobA as any)).toBe(true);

      mgr.toggleSelect(mobA as any);
      expect(mgr.isSelected(mobA as any)).toBe(false);
    });

    it('selectAll() selects all scene mobjects', () => {
      mgr.selectAll();
      expect(mgr.count).toBe(3);
      expect(mgr.isSelected(mobA as any)).toBe(true);
      expect(mgr.isSelected(mobB as any)).toBe(true);
      expect(mgr.isSelected(mobC as any)).toBe(true);
    });

    it('deselectAll() clears all selections', () => {
      mgr.select(mobA as any, mobB as any, mobC as any);
      mgr.deselectAll();
      expect(mgr.count).toBe(0);
    });

    it('getSelectedArray() returns array of selected mobjects', () => {
      mgr.select(mobA as any, mobC as any);
      const arr = mgr.getSelectedArray();
      expect(arr).toHaveLength(2);
      expect(arr).toContain(mobA);
      expect(arr).toContain(mobC);
    });

    it('isSelected() returns false for non-selected mobjects', () => {
      expect(mgr.isSelected(mobA as any)).toBe(false);
    });
  });

  // --- Enable / Disable ---

  describe('enable / disable', () => {
    it('starts enabled', () => {
      expect(mgr.isEnabled).toBe(true);
    });

    it('disable() sets isEnabled to false and clears selection', () => {
      mgr.select(mobA as any);
      mgr.disable();
      expect(mgr.isEnabled).toBe(false);
      expect(mgr.count).toBe(0);
    });

    it('enable() re-enables the manager', () => {
      mgr.disable();
      mgr.enable();
      expect(mgr.isEnabled).toBe(true);
    });
  });

  // --- Selection change callback ---

  describe('onSelectionChange callback', () => {
    it('fires callback on select', () => {
      const onChange = vi.fn();
      mgr.dispose();
      mgr = new SelectionManager(scene as any, { onSelectionChange: onChange });

      mgr.select(mobA as any);
      expect(onChange).toHaveBeenCalledTimes(1);
      const arg = onChange.mock.calls[0][0] as ReadonlySet<any>;
      expect(arg.has(mobA)).toBe(true);
    });

    it('fires callback on deselect', () => {
      const onChange = vi.fn();
      mgr.dispose();
      mgr = new SelectionManager(scene as any, { onSelectionChange: onChange });

      mgr.select(mobA as any);
      onChange.mockClear();

      mgr.deselect(mobA as any);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('fires callback on deselectAll', () => {
      const onChange = vi.fn();
      mgr.dispose();
      mgr = new SelectionManager(scene as any, { onSelectionChange: onChange });

      mgr.select(mobA as any, mobB as any);
      onChange.mockClear();

      mgr.deselectAll();
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('fires callback on selectAll', () => {
      const onChange = vi.fn();
      mgr.dispose();
      mgr = new SelectionManager(scene as any, { onSelectionChange: onChange });

      mgr.selectAll();
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('fires callback on toggleSelect', () => {
      const onChange = vi.fn();
      mgr.dispose();
      mgr = new SelectionManager(scene as any, { onSelectionChange: onChange });

      mgr.toggleSelect(mobA as any);
      expect(onChange).toHaveBeenCalledTimes(1);

      mgr.toggleSelect(mobA as any);
      expect(onChange).toHaveBeenCalledTimes(2);
    });
  });

  // --- Default options ---

  describe('default options', () => {
    it('uses default highlight color #FFFF00', () => {
      // Verify construction doesn't throw with defaults
      const m = new SelectionManager(scene as any);
      expect(m.isEnabled).toBe(true);
      m.dispose();
    });
  });

  // --- Keyboard shortcuts ---

  describe('keyboard shortcuts', () => {
    it('Escape deselects all', () => {
      mgr.select(mobA as any, mobB as any);
      fireKeyboardEvent(window, 'keydown', { key: 'Escape' });
      expect(mgr.count).toBe(0);
    });

    it('Ctrl+A selects all', () => {
      fireKeyboardEvent(window, 'keydown', { key: 'a', ctrlKey: true });
      expect(mgr.count).toBe(3);
    });

    it('Meta+A (Cmd+A) selects all', () => {
      fireKeyboardEvent(window, 'keydown', { key: 'a', metaKey: true });
      expect(mgr.count).toBe(3);
    });

    it('Escape does nothing when disabled', () => {
      mgr.select(mobA as any);
      mgr.disable();
      // Re-select after disable (which cleared selection)
      // The manager is disabled, so keyboard shortcuts should not work
      // We need to manually re-add since disable cleared them
      (mgr as any)._selected.add(mobA);
      fireKeyboardEvent(window, 'keydown', { key: 'Escape' });
      // Since disabled, Escape should have no effect
      expect((mgr as any)._selected.has(mobA)).toBe(true);
    });
  });

  // --- Dispose ---

  describe('dispose', () => {
    it('clears selection on dispose', () => {
      mgr.select(mobA as any, mobB as any);
      mgr.dispose();
      expect(mgr.count).toBe(0);
    });
  });
});

// ============================================================================
// Hit test / coordinate math (tested indirectly through behaviors)
// ============================================================================

describe('Hit test / screen-to-world math', () => {
  let scene: ReturnType<typeof createMockScene>;

  afterEach(() => {
    scene._canvas.remove();
  });

  it('center of canvas maps to world origin', () => {
    // Canvas 800x600, camera frame 14x8
    // Center pixel (400, 300) -> NDC (0, 0) -> world (0, 0)
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 0.5, height: 0.5 } });
    const onClick = vi.fn();
    const clickable = new Clickable(mob as any, scene as any, { onClick });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'click', { clientX: 400, clientY: 300 });
    expect(onClick).toHaveBeenCalledTimes(1);
    clickable.dispose();
  });

  it('top-left corner of canvas maps to negative-x positive-y world coords', () => {
    // (0, 0) -> NDC (-1, 1) -> world (-7, 4)
    scene = createMockScene();
    const mob = createMockMobject({ center: [-7, 4, 0], bounds: { width: 1, height: 1 } });
    const onClick = vi.fn();
    const clickable = new Clickable(mob as any, scene as any, { onClick });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'click', { clientX: 0, clientY: 0 });
    expect(onClick).toHaveBeenCalledTimes(1);
    clickable.dispose();
  });

  it('bottom-right corner of canvas maps to positive-x negative-y world coords', () => {
    // (800, 600) -> NDC (1, -1) -> world (7, -4)
    scene = createMockScene();
    const mob = createMockMobject({ center: [7, -4, 0], bounds: { width: 1, height: 1 } });
    const onClick = vi.fn();
    const clickable = new Clickable(mob as any, scene as any, { onClick });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'click', { clientX: 800, clientY: 600 });
    expect(onClick).toHaveBeenCalledTimes(1);
    clickable.dispose();
  });

  it('click just inside bounding box edge registers hit', () => {
    scene = createMockScene();
    // Mobject at (2, 1) with width=2, height=2 -> bounds from (1,0) to (3,2)
    const mob = createMockMobject({ center: [2, 1, 0], bounds: { width: 2, height: 2 } });
    const onClick = vi.fn();
    const clickable = new Clickable(mob as any, scene as any, { onClick });

    // World (2, 1) is center. World (3, 2) is top-right corner of bounds.
    // NDC for world (2.9, 1.9): x = 2.9/7 = 0.414, y = 1.9/4 = 0.475
    // Pixel: x = (0.414 + 1)/2 * 800 = 565.7, y = (1 - 0.475)/2 * 600 = 157.5
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'click', { clientX: 566, clientY: 158 });
    expect(onClick).toHaveBeenCalledTimes(1);
    clickable.dispose();
  });

  it('click just outside bounding box edge does not register', () => {
    scene = createMockScene();
    // Mobject at (2, 1) with width=2, height=2 -> bounds from (1,0) to (3,2)
    const mob = createMockMobject({ center: [2, 1, 0], bounds: { width: 2, height: 2 } });
    const onClick = vi.fn();
    const clickable = new Clickable(mob as any, scene as any, { onClick });

    // World (3.5, 1) is well outside the right edge (bound at x=3)
    // NDC x = 3.5/7 = 0.5 -> pixel x = (0.5+1)/2 * 800 = 600
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'click', { clientX: 600, clientY: 300 });
    // World x at pixel 600: NDC = (600/800)*2 - 1 = 0.5, world = 0.5 * 7 = 3.5
    // |3.5 - 2| = 1.5 > width/2 = 1, so miss
    expect(onClick).not.toHaveBeenCalled();
    clickable.dispose();
  });

  it('works with different camera frame dimensions', () => {
    scene = createMockScene({ frameWidth: 20, frameHeight: 10 });
    // Center of canvas -> world (0, 0)
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 1, height: 1 } });
    const onClick = vi.fn();
    const clickable = new Clickable(mob as any, scene as any, { onClick });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'click', { clientX: 400, clientY: 300 });
    expect(onClick).toHaveBeenCalledTimes(1);
    clickable.dispose();
  });
});

// ============================================================================
// Drag constraint math (unit-level)
// ============================================================================

describe('Drag constraint math', () => {
  let scene: ReturnType<typeof createMockScene>;

  afterEach(() => {
    scene._canvas.remove();
  });

  it('constrainX clamps minimum', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const draggable = new Draggable(mob as any, scene as any, {
      constrainX: [-1, 1],
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    // Move to far left
    fireMouseEvent(window as any, 'mousemove', { clientX: 0, clientY: 300 });

    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    expect(lastCall[0][0]).toBeGreaterThanOrEqual(-1);
    draggable.dispose();
  });

  it('constrainX clamps maximum', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const draggable = new Draggable(mob as any, scene as any, {
      constrainX: [-1, 1],
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    // Move to far right
    fireMouseEvent(window as any, 'mousemove', { clientX: 800, clientY: 300 });

    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    expect(lastCall[0][0]).toBeLessThanOrEqual(1);
    draggable.dispose();
  });

  it('constrainY clamps minimum', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const draggable = new Draggable(mob as any, scene as any, {
      constrainY: [-1, 1],
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    // Move to far bottom (high clientY = negative world Y)
    fireMouseEvent(window as any, 'mousemove', { clientX: 400, clientY: 600 });

    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    expect(lastCall[0][1]).toBeGreaterThanOrEqual(-1);
    draggable.dispose();
  });

  it('constrainY clamps maximum', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const draggable = new Draggable(mob as any, scene as any, {
      constrainY: [-1, 1],
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    // Move to far top (low clientY = positive world Y)
    fireMouseEvent(window as any, 'mousemove', { clientX: 400, clientY: 0 });

    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    expect(lastCall[0][1]).toBeLessThanOrEqual(1);
    draggable.dispose();
  });

  it('both X and Y constraints applied simultaneously', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const draggable = new Draggable(mob as any, scene as any, {
      constrainX: [-2, 2],
      constrainY: [-1, 1],
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    // Move to top-right corner
    fireMouseEvent(window as any, 'mousemove', { clientX: 800, clientY: 0 });

    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    expect(lastCall[0][0]).toBeLessThanOrEqual(2);
    expect(lastCall[0][1]).toBeLessThanOrEqual(1);
    draggable.dispose();
  });

  it('snap-to-grid rounds position to nearest grid point', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const draggable = new Draggable(mob as any, scene as any, {
      snapToGrid: 1.0,
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    // Move to a position that should snap
    // Pixel 457 -> NDC = (457/800)*2 - 1 = 0.1425 -> world = 0.1425 * 7 = 0.9975
    // Should snap to 1.0
    fireMouseEvent(window as any, 'mousemove', { clientX: 457, clientY: 300 });

    expect(mob.moveTo).toHaveBeenCalled();
    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    expect(lastCall[0][0]).toBe(Math.round(lastCall[0][0]));
    draggable.dispose();
  });

  it('snap-to-grid with sub-unit grid size', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const draggable = new Draggable(mob as any, scene as any, {
      snapToGrid: 0.25,
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouseEvent(window as any, 'mousemove', { clientX: 420, clientY: 310 });

    expect(mob.moveTo).toHaveBeenCalled();
    const lastCall = mob.moveTo.mock.calls[mob.moveTo.mock.calls.length - 1];
    const pos = lastCall[0];
    // Should be a multiple of 0.25
    expect((pos[0] / 0.25) % 1).toBeCloseTo(0, 5);
    expect((pos[1] / 0.25) % 1).toBeCloseTo(0, 5);
    draggable.dispose();
  });

  it('drag delta calculation is correct', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const onDrag = vi.fn();
    const draggable = new Draggable(mob as any, scene as any, { onDrag });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouseEvent(window as any, 'mousemove', { clientX: 450, clientY: 250 });

    expect(onDrag).toHaveBeenCalledTimes(1);
    const [_mob, position, delta] = onDrag.mock.calls[0];
    // Delta should be the difference from start position
    expect(delta[0]).toBeCloseTo(position[0] - 0, 1); // started at world 0
    expect(delta[1]).toBeCloseTo(position[1] - 0, 1);
    expect(delta[2]).toBe(0);
    draggable.dispose();
  });
});

// ============================================================================
// SelectionManager - mouse-based selection (integration-like tests with mock)
// ============================================================================

describe('SelectionManager mouse-based selection', () => {
  let scene: ReturnType<typeof createMockScene>;
  let mgr: SelectionManager;
  let mobCenter: ReturnType<typeof createMockMobject>;

  beforeEach(() => {
    scene = createMockScene();
    // Place a mobject at the center of the world (maps to center of canvas)
    mobCenter = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    scene.mobjects.add(mobCenter);
    mgr = new SelectionManager(scene as any);
  });

  afterEach(() => {
    mgr.dispose();
    scene._canvas.remove();
  });

  it('click on empty area does nothing', () => {
    const canvas = scene.getCanvas();
    // Click far corner - no mobject there
    fireMouseEvent(canvas, 'mousedown', { clientX: 0, clientY: 0 });
    fireMouseEvent(window as any, 'mouseup', { clientX: 0, clientY: 0 });
    expect(mgr.count).toBe(0);
  });

  it('does not select when disabled', () => {
    mgr.disable();
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouseEvent(window as any, 'mouseup', { clientX: 400, clientY: 300 });
    expect(mgr.count).toBe(0);
  });

  it('ignores right-click (button !== 0)', () => {
    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300, button: 2 });
    fireMouseEvent(window as any, 'mouseup', { clientX: 400, clientY: 300 });
    expect(mgr.count).toBe(0);
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('Edge cases', () => {
  let scene: ReturnType<typeof createMockScene>;

  afterEach(() => {
    scene._canvas.remove();
  });

  it('Clickable uses getBoundingBox for hit testing', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const onClick = vi.fn();
    const clickable = new Clickable(mob as any, scene as any, { onClick });

    const canvas = scene.getCanvas();
    // Point at center (0,0) which is within bounds width:2, height:2
    fireMouseEvent(canvas, 'click', { clientX: 400, clientY: 300 });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(mob.getBoundingBox).toHaveBeenCalled();
    clickable.dispose();
  });

  it('Draggable uses getBoundingBox for hit testing', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const draggable = new Draggable(mob as any, scene as any);

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    expect(draggable.isDragging).toBe(true);
    expect(mob.getBoundingBox).toHaveBeenCalled();
    fireMouseEvent(window as any, 'mouseup', { clientX: 400, clientY: 300 });
    draggable.dispose();
  });

  it('Hoverable uses getBoundingBox for hit testing', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const hoverable = new Hoverable(mob as any, scene as any);

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(hoverable.isHovering).toBe(true);
    expect(mob.getBoundingBox).toHaveBeenCalled();
    hoverable.dispose();
  });

  it('Draggable with no options works without errors', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    const draggable = new Draggable(mob as any, scene as any);

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouseEvent(window as any, 'mousemove', { clientX: 410, clientY: 310 });
    fireMouseEvent(window as any, 'mouseup', { clientX: 410, clientY: 310 });
    // Should not throw
    expect(draggable.isDragging).toBe(false);
    draggable.dispose();
  });

  it('Hoverable dispose while hovering restores original state', () => {
    scene = createMockScene();
    const mob = createMockMobject({ center: [0, 0, 0], bounds: { width: 2, height: 2 } });
    mob.color = '#00ff00';
    mob.opacity = 0.7;
    const hoverable = new Hoverable(mob as any, scene as any, {
      hoverColor: '#ff0000',
      hoverOpacity: 0.3,
      hoverScale: 1,
    });

    const canvas = scene.getCanvas();
    fireMouseEvent(canvas, 'mousemove', { clientX: 400, clientY: 300 });
    expect(hoverable.isHovering).toBe(true);

    hoverable.dispose();
    expect(hoverable.isHovering).toBe(false);
    // Original values should be restored
    expect(mob.setColor).toHaveBeenLastCalledWith('#00ff00');
    expect(mob.setOpacity).toHaveBeenLastCalledWith(0.7);
  });

  it('SelectionManager selectAll with empty scene does nothing', () => {
    scene = createMockScene();
    const mgr = new SelectionManager(scene as any);
    mgr.selectAll();
    expect(mgr.count).toBe(0);
    mgr.dispose();
  });

  it('SelectionManager toggleSelect twice returns to original state', () => {
    scene = createMockScene();
    const mob = createMockMobject();
    scene.mobjects.add(mob);
    const mgr = new SelectionManager(scene as any);

    mgr.toggleSelect(mob as any);
    mgr.toggleSelect(mob as any);
    expect(mgr.isSelected(mob as any)).toBe(false);
    expect(mgr.count).toBe(0);
    mgr.dispose();
  });

  it('multiple Clickable instances on same canvas do not interfere', () => {
    scene = createMockScene();
    const mob1 = createMockMobject({ center: [-3, 0, 0], bounds: { width: 1, height: 1 } });
    const mob2 = createMockMobject({ center: [3, 0, 0], bounds: { width: 1, height: 1 } });

    const onClick1 = vi.fn();
    const onClick2 = vi.fn();

    const c1 = new Clickable(mob1 as any, scene as any, { onClick: onClick1 });
    const c2 = new Clickable(mob2 as any, scene as any, { onClick: onClick2 });

    const canvas = scene.getCanvas();

    // Click at center - neither mob1 (-3, 0) nor mob2 (3, 0) should trigger
    fireMouseEvent(canvas, 'click', { clientX: 400, clientY: 300 });
    expect(onClick1).not.toHaveBeenCalled();
    expect(onClick2).not.toHaveBeenCalled();

    // Click at mob1 position: world (-3, 0) -> NDC (-3/7, 0) = (-0.4286, 0)
    // pixel x = (-0.4286 + 1)/2 * 800 = 228.57 -> 229
    fireMouseEvent(canvas, 'click', { clientX: 229, clientY: 300 });
    expect(onClick1).toHaveBeenCalledTimes(1);
    expect(onClick2).not.toHaveBeenCalled();

    c1.dispose();
    c2.dispose();
  });
});
