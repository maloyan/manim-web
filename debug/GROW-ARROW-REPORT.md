# GrowArrow Animation Report

## Current Behavior

When a default `Arrow` is created and `GrowArrow` is applied:

### Initial State (before animation)
```
arrow.position:  [0, 0, 0]
arrow._start:    [0, 0, 0]  (tail at origin)
arrow._end:      [1, 0, 0]  (tip at x=1)
arrow.getCenter(): [0.6, 0, 0]  (midpoint = (0+1)/2)

children positions: [0, 0, 0] (both shaft and tip)
child[0].getCenter(): [0.35, 0]  (shaft center)
child[1].getCenter(): [0.85, 0]  (tip center)
```

### Final State (after animation)
```
arrow.position:  [0.5, 0, 0]       ← CHANGED!
arrow.getCenter(): [0.6, 0, 0]    (unchanged)

children positions: [0, 0, 0] (unchanged)
```

## The Problem

The arrow's **internal position** changes after the animation, but its **visual representation** (getCenter()) stays the same. This violates the principle that animations should be idempotent - applying GrowArrow should leave the arrow in the same state as if it had been created normally.

**Root cause**: In `finish()`, the code sets position to the midpoint:
```typescript
arrow.position.set((start[0] + end[0]) / 2, ...);
```

But this is different from how a default Arrow is constructed - the default Arrow has `position: [0, 0, 0]`, not `[0.5, 0, 0]`.

### Expected Convention
- Default Arrow: `position = [0, 0, 0]`, geometry offsets define where start/end are
- After GrowArrow: `position = [0, 0, 0]`, same as default Arrow

### Actual Behavior  
- Default Arrow: `position = [0, 0, 0]`
- After GrowArrow: `position = [0.5, 0, 0]`

## What Needs to Change

The `finish()` method should restore the arrow's position to `[0, 0, 0]` (or whatever it was before the animation), not set it to the midpoint. The geometry already contains the correct offsets for shaft and tip.

## Proposed Test Script

Create a test that compares a default Arrow with one that's been through a GrowArrow animation:

```typescript
// test-grow-arrow-equivalence.ts
import { Scene } from '../src/core/Scene';
import { Arrow } from '../src/index';
import { GrowArrow } from '../src/index';

const scene = Scene.createHeadless();

// Create default arrow
const arrow1 = new Arrow({ color: '#e94560' });

// Create arrow, apply animation, then reset scale
const arrow2 = new Arrow({ color: '#e94560' });
scene.add(arrow2);
await scene.play(new GrowArrow(arrow2, { duration: 0.1 }));

console.log('=== Comparison ===');
console.log('arrow1 (default):');
console.log('  position:', fmt(arrow1.position));
console.log('  getCenter():', fmt(arrow1.getCenter()));
console.log('  _start:', arrow1._start);
console.log('  _end:', arrow1._end);

console.log('arrow2 (after GrowArrow):');
console.log('  position:', fmt(arrow2.position));
console.log('  getCenter():', fmt(arrow2.getCenter()));
console.log('  _start:', arrow2._start);
console.log('  _end:', arrow2._end);

// They should be equivalent!
```

Run with: `bun run debug/test-grow-arrow-equivalence.ts`