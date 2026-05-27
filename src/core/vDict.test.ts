import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';
import { VGroup } from './VGroup';
import { VDict, VectorizedPoint } from './VDict';

/** Create a simple VMobject with 4 corner points (a quad). */
function makeVM(tag?: string): VMobject {
  const vm = new VMobject();
  vm.setPoints([
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ]);
  if (tag) (vm as unknown as Record<string, string>)._tag = tag;
  return vm;
}

describe('VDict', () => {
  it('constructor with empty object creates empty VDict', () => {
    const d = new VDict();
    expect(d.size).toBe(0);
    expect([...d.keys()]).toEqual([]);
  });

  it('constructor with named VMobjects adds them', () => {
    const a = makeVM('a');
    const b = makeVM('b');
    const d = new VDict({ a, b });
    expect(d.size).toBe(2);
    expect(d.get('a')).toBe(a);
    expect(d.get('b')).toBe(b);
  });

  it('set() adds a VMobject', () => {
    const d = new VDict();
    const vm = makeVM();
    d.set('item', vm);
    expect(d.size).toBe(1);
    expect(d.get('item')).toBe(vm);
  });

  it('set() replaces existing VMobject with same key', () => {
    const d = new VDict();
    const vm1 = makeVM('first');
    const vm2 = makeVM('second');
    d.set('k', vm1);
    d.set('k', vm2);
    expect(d.size).toBe(1);
    expect(d.get('k')).toBe(vm2);
    expect(d.submobjects).not.toContain(vm1);
    expect(d.submobjects).toContain(vm2);
  });

  it('get() retrieves by string key', () => {
    const vm = makeVM();
    const d = new VDict({ myKey: vm });
    expect(d.get('myKey')).toBe(vm);
  });

  it('get() retrieves by numeric index', () => {
    const vm = makeVM();
    const d = new VDict({ first: vm });
    expect(d.get(0)).toBe(vm);
  });

  it('get() returns undefined for missing key', () => {
    const d = new VDict();
    expect(d.get('nope')).toBeUndefined();
  });

  it('has() returns true for existing key', () => {
    const d = new VDict({ x: makeVM() });
    expect(d.has('x')).toBe(true);
  });

  it('has() returns false for missing key', () => {
    const d = new VDict();
    expect(d.has('missing')).toBe(false);
  });

  it('delete() removes VMobject by key', () => {
    const vm = makeVM();
    const d = new VDict({ gone: vm });
    const result = d.delete('gone');
    expect(result).toBe(true);
    expect(d.size).toBe(0);
    expect(d.get('gone')).toBeUndefined();
    expect(d.submobjects).not.toContain(vm);
  });

  it('delete() returns false for missing key', () => {
    const d = new VDict();
    expect(d.delete('nope')).toBe(false);
  });

  it('keys() returns all key names', () => {
    const d = new VDict({ a: makeVM(), b: makeVM(), c: makeVM() });
    expect([...d.keys()]).toEqual(['a', 'b', 'c']);
  });

  it('values() returns all VMobjects', () => {
    const va = makeVM();
    const vb = makeVM();
    const d = new VDict({ a: va, b: vb });
    const vals = [...d.values()];
    expect(vals).toContain(va);
    expect(vals).toContain(vb);
    expect(vals.length).toBe(2);
  });

  it('entries() returns [name, vmobject] pairs', () => {
    const va = makeVM();
    const vb = makeVM();
    const d = new VDict({ alpha: va, beta: vb });
    const entries = [...d.entries()];
    expect(entries).toEqual([
      ['alpha', va],
      ['beta', vb],
    ]);
  });

  it('size returns count', () => {
    const d = new VDict({ x: makeVM(), y: makeVM() });
    expect(d.size).toBe(2);
    d.set('z', makeVM());
    expect(d.size).toBe(3);
  });

  it('clear() removes all entries', () => {
    const d = new VDict({ a: makeVM(), b: makeVM() });
    d.clear();
    expect(d.size).toBe(0);
    expect([...d.keys()]).toEqual([]);
    expect(d.submobjects.length).toBe(0);
  });

  it('forEach iterates over entries (VGroup-style by index)', () => {
    const va = makeVM();
    const vb = makeVM();
    const d = new VDict({ a: va, b: vb });
    const collected: VMobject[] = [];
    d.forEach((vm) => collected.push(vm));
    expect(collected).toContain(va);
    expect(collected).toContain(vb);
    expect(collected.length).toBe(2);
  });

  it('forEachEntry iterates with keys', () => {
    const va = makeVM();
    const d = new VDict({ only: va });
    const pairs: [string, VMobject][] = [];
    d.forEachEntry((vm, key) => pairs.push([key, vm]));
    expect(pairs).toEqual([['only', va]]);
  });
});

describe('VDict - extended coverage', () => {
  it('addNamed is alias for set', () => {
    const d = new VDict();
    const vm = makeVM();
    d.addNamed('test', vm);
    expect(d.get('test')).toBe(vm);
    expect(d.size).toBe(1);
  });

  it('removeNamed is alias for delete', () => {
    const vm = makeVM();
    const d = new VDict({ test: vm });
    d.removeNamed('test');
    expect(d.size).toBe(0);
    expect(d.get('test')).toBeUndefined();
  });

  it('getItem is alias for get with string key', () => {
    const vm = makeVM();
    const d = new VDict({ item: vm });
    expect(d.getItem('item')).toBe(vm);
  });

  it('getByName is alias for get with string key', () => {
    const vm = makeVM();
    const d = new VDict({ named: vm });
    expect(d.getByName('named')).toBe(vm);
  });

  it('copy creates independent VDict with copied children', () => {
    const va = makeVM('a');
    const vb = makeVM('b');
    const d = new VDict({ a: va, b: vb });
    d.position.set(1, 2, 3);
    d.setColor('#ff0000');
    d.setStrokeOpacity(0.5);

    const clone = d.copy() as VDict;
    expect(clone.size).toBe(2);
    expect(clone.has('a')).toBe(true);
    expect(clone.has('b')).toBe(true);
    expect(clone.get('a')).not.toBe(va); // deep copy
    expect(clone.position.x).toBe(1);
    expect(clone.color).toBe('#ff0000');
  });

  it('copy preserves key-to-vmobject mapping', () => {
    const vm = makeVM();
    const d = new VDict({ myKey: vm });
    const clone = d.copy() as VDict;
    const clonedVM = clone.get('myKey');
    expect(clonedVM).toBeDefined();
    expect(clonedVM).not.toBe(vm);
  });

  it('asProxy allows bracket-style access', () => {
    const vm = makeVM();
    const d = new VDict({ item: vm });
    const proxy = d.asProxy();
    expect(proxy['item']).toBe(vm);
  });

  it('asProxy set inserts via dict', () => {
    const d = new VDict();
    const proxy = d.asProxy();
    const vm = makeVM();
    proxy['newKey'] = vm;
    expect(d.get('newKey')).toBe(vm);
  });

  it('asProxy has checks dict and object properties', () => {
    const vm = makeVM();
    const d = new VDict({ existing: vm });
    const proxy = d.asProxy();
    expect('existing' in proxy).toBe(true);
    expect('size' in proxy).toBe(true); // property from VDict
    expect('nonexistent_xyz_123' in proxy).toBe(false);
  });

  it('asProxy falls through to VDict properties', () => {
    const d = new VDict({ a: makeVM() });
    const proxy = d.asProxy();
    expect(proxy.size).toBe(1);
    expect(typeof proxy.set).toBe('function');
  });

  it('asProxy set with non-VMobject sets on target directly', () => {
    const d = new VDict();
    const proxy = d.asProxy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (proxy as any)['_someField'] = 42;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((d as any)._someField).toBe(42);
  });

  it('forEachEntry receives VDict as third argument', () => {
    const vm = makeVM();
    const d = new VDict({ x: vm });
    let receivedDict: VDict | null = null;
    d.forEachEntry((_vm, _key, dict) => {
      receivedDict = dict;
    });
    expect(receivedDict).toBe(d);
  });

  it('submobjects syncs with dict entries', () => {
    const va = makeVM();
    const vb = makeVM();
    const d = new VDict({ a: va, b: vb });
    expect(d.submobjects.length).toBe(2);
    d.delete('a');
    expect(d.submobjects.length).toBe(1);
    expect(d.submobjects).toContain(vb);
  });

  it('_createCopy returns a new empty VDict', () => {
    const d = new VDict({ a: makeVM() });
    const clone = d.copy() as VDict;
    expect(clone).toBeInstanceOf(VDict);
  });
});
