import { describe, it, expect } from 'vitest';
import {
  extractMobjectFamilyMembers,
  restructureListToExcludeCertainFamilyMembers,
  indexLabels,
  printFamily,
} from './debug';
import { VMobject } from '../core/VMobject';
import { VGroup } from '../core/VGroup';

describe('family_ops / debug (ManimCE parity)', () => {
  it('extractMobjectFamilyMembers flattens self plus descendants', () => {
    const a = new VMobject();
    const b = new VMobject();
    const c = new VMobject();
    const group = new VGroup(a, b, c);
    // group + 3 children
    expect(extractMobjectFamilyMembers([group]).length).toBe(4);
  });

  it('restructure keeps sibling family members when one submobject is removed', () => {
    const a = new VMobject();
    const b = new VMobject();
    const c = new VMobject();
    const group = new VGroup(a, b, c);
    const result = restructureListToExcludeCertainFamilyMembers([group], [a]);
    expect(result).toContain(b);
    expect(result).toContain(c);
    expect(result).not.toContain(a);
    expect(result).not.toContain(group);
  });

  it('indexLabels returns one label per submobject', () => {
    const group = new VGroup(new VMobject(), new VMobject(), new VMobject());
    const labels = indexLabels(group);
    expect(labels.children.length).toBe(3);
  });

  it('printFamily returns an indented tree string', () => {
    const child = new VMobject();
    const group = new VGroup(child);
    const text = printFamily(group);
    const lines = text.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[1].startsWith('\t')).toBe(true);
  });
});
