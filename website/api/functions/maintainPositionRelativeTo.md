# Function: maintainPositionRelativeTo()

> **maintainPositionRelativeTo**(`mobject`, `target`): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

Defined in: [animation/MaintainPositionRelativeTo.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/MaintainPositionRelativeTo.ts#L28)

Creates an updater function that maintains a mobject's position relative to a target.
The offset is calculated when this function is called and preserved during updates.

## Parameters

### mobject

[`Mobject`](../classes/Mobject.md)

The mobject to keep at a fixed offset

### target

[`Mobject`](../classes/Mobject.md)

The target mobject to track

## Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

An updater function that can be added to a mobject with addUpdater()

## Example

```typescript
const follower = new Circle();
const leader = new Square();

// Keep follower 2 units to the right of leader
follower.moveTo([leader.position.x + 2, leader.position.y, 0]);
follower.addUpdater(maintainPositionRelativeTo(follower, leader));

// Now when leader moves, follower will follow
```
