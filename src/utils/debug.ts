/**
 * Family operations and debugging utilities, ported from ManimCE
 * `manim/utils/family_ops.py`, `manim/utils/family.py` and
 * `manim/utils/debug.py`.
 *
 * The family traversal itself already lives on `Mobject.getFamily()`
 * (manim-web's equivalent of ManimCE `Mobject.get_family()`); these helpers
 * wrap it under camelCased names rather than reimplementing it.
 */

import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { VGroup } from '../core/VGroup';
import { Integer } from '../mobjects/text/DecimalNumber';
import { logger } from './logger';

/**
 * Return every family member (self plus all descendants) of each mobject in
 * `mobjectList`, flattened into a single list. Mirrors ManimCE
 * `extract_mobject_family_members`.
 *
 * @param onlyThoseWithPoints - keep only members that own geometry (a
 *   `VMobject` with its own points), matching ManimCE `only_those_with_points`.
 */
export function extractMobjectFamilyMembers(
  mobjectList: Mobject[],
  onlyThoseWithPoints: boolean = false,
): Mobject[] {
  const result: Mobject[] = [];
  for (const mob of mobjectList) {
    result.push(...mob.getFamily());
  }
  if (onlyThoseWithPoints) {
    return result.filter((mob) => mob instanceof VMobject && mob.hasOwnPoints());
  }
  return result;
}

/**
 * Remove everything in `toRemove` from `mobjectList`, but when a removed item
 * is a family member of an item in `mobjectList`, add that item's other family
 * members back in. Mirrors ManimCE
 * `restructure_list_to_exclude_certain_family_members`.
 */
export function restructureListToExcludeCertainFamilyMembers(
  mobjectList: Mobject[],
  toRemove: Mobject[],
): Mobject[] {
  const newList: Mobject[] = [];
  const removalSet = new Set<Mobject>(extractMobjectFamilyMembers(toRemove));

  const addSafeMobjectsFromList = (listToExamine: Mobject[], setToRemove: Set<Mobject>): void => {
    for (const mob of listToExamine) {
      if (setToRemove.has(mob)) continue;
      const intersect = new Set<Mobject>(
        mob.getFamily().filter((member) => setToRemove.has(member)),
      );
      if (intersect.size > 0) {
        addSafeMobjectsFromList(mob.children, intersect);
      } else {
        newList.push(mob);
      }
    }
  };

  addSafeMobjectsFromList(mobjectList, removalSet);
  return newList;
}

/** Options for {@link indexLabels}. */
export interface IndexLabelsOptions {
  /** Height of each label in scene units. Default: 0.15 (matches ManimCE). */
  labelHeight?: number;
}

/**
 * Return a `VGroup` of `Integer` labels showing the index of each submobject of
 * `mobject`. Useful for inspecting the parts of a complicated mobject. Mirrors
 * ManimCE `index_labels`.
 */
export function indexLabels(mobject: Mobject, options: IndexLabelsOptions = {}): VGroup {
  const { labelHeight = 0.15 } = options;
  const labels = new VGroup();
  mobject.children.forEach((submob, n) => {
    const label = new Integer({ value: n });
    label.setHeight(labelHeight);
    label.moveTo(submob);
    labels.add(label);
  });
  return labels;
}

/**
 * Build a tree view of `mobject` and its descendants, one line per family
 * member indented by depth. Mirrors ManimCE `print_family`, but returns the
 * string and logs it through the repo logger (never `console`).
 */
export function printFamily(mobject: Mobject, nTabs: number = 0): string {
  const lines: string[] = [];
  const build = (mob: Mobject, depth: number): void => {
    lines.push('\t'.repeat(depth) + `${mob.constructor.name} ${mob.id}`);
    for (const submob of mob.children) {
      build(submob, depth + 1);
    }
  };
  build(mobject, nTabs);
  const output = lines.join('\n');
  logger.debug(output);
  return output;
}
