/**
 * MaintainPositionRelativeTo updater function.
 * Creates an updater that keeps a mobject at a fixed offset from another mobject.
 */

import { Mobject, UpdaterFunction } from '../core/Mobject';

/**
 * Creates an updater function that maintains a mobject's position relative to a target.
 * The offset is calculated when this function is called and preserved during updates.
 *
 * @param mobject - The mobject to keep at a fixed offset
 * @param target - The target mobject to track
 * @returns An updater function that can be added to a mobject with addUpdater()
 *
 * @example
 * ```typescript
 * const follower = new Circle();
 * const leader = new Square();
 *
 * // Keep follower 2 units to the right of leader
 * follower.moveTo([leader.position.x + 2, leader.position.y, 0]);
 * follower.addUpdater(maintainPositionRelativeTo(follower, leader));
 *
 * // Now when leader moves, follower will follow
 * ```
 */
export function maintainPositionRelativeTo(
  mobject: Mobject,
  target: Mobject
): UpdaterFunction {
  // Capture the initial offset between the mobject and target
  const offset = [
    mobject.position.x - target.position.x,
    mobject.position.y - target.position.y,
    mobject.position.z - target.position.z,
  ];

  return (m: Mobject, _dt: number) => {
    m.moveTo([
      target.position.x + offset[0],
      target.position.y + offset[1],
      target.position.z + offset[2],
    ]);
  };
}
