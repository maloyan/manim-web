import { describe, it, expect } from 'vitest';
import { Cell } from './Cell';
import { VGroup } from '../../core/VGroup';
import { Circle } from '../geometry/Circle';
import { Ellipse } from '../geometry/Ellipse';
import { Dot } from '../geometry/Dot';
import { Arc } from '../geometry/Arc';
import { ParametricFunction } from '../graphing/ParametricFunction';
import { organelleColor } from './biologyColors';
import type { OrganelleSpec } from './biologyTypes';

const ORGANELLES: OrganelleSpec[] = [
  { name: 'mitochondrion', shape: 'ellipse' },
  { name: 'ribosome' },
  { name: 'lysosome' },
];

describe('Cell', () => {
  it('is a VGroup so animations apply directly', () => {
    expect(new Cell()).toBeInstanceOf(VGroup);
  });

  it('has a circular membrane by default', () => {
    const cell = new Cell({ radius: 2 });
    expect(cell.getMembrane()).toBeInstanceOf(Circle);
  });

  it('has an elliptical membrane when shape is ellipse', () => {
    const cell = new Cell({ shape: 'ellipse', width: 4, height: 2 });
    expect(cell.getMembrane()).toBeInstanceOf(Ellipse);
  });

  it('has a nucleus by default', () => {
    const cell = new Cell();
    expect(cell.getNucleus()).toBeInstanceOf(Circle);
  });

  it('omits the nucleus when showNucleus is false', () => {
    const cell = new Cell({ showNucleus: false });
    expect(cell.getNucleus()).toBeNull();
  });

  it('builds the requested organelles', () => {
    const cell = new Cell({ organelles: ORGANELLES });
    expect(cell.numOrganelles).toBe(3);
    expect(cell.getOrganelles()).toHaveLength(3);
    expect(cell.organellesGroup.children).toHaveLength(3);
  });

  it('labels each organelle by default', () => {
    const cell = new Cell({ organelles: ORGANELLES });
    expect(cell.labelsGroup.children).toHaveLength(3);
    expect(cell.getOrganelle(0)?.label?.getText()).toBe('mitochondrion');
    expect(cell.getOrganelle(1)?.label?.getText()).toBe('ribosome');
  });

  it('uses an explicit label over the name', () => {
    const cell = new Cell({ organelles: [{ name: 'mitochondrion', label: 'Mito' }] });
    expect(cell.getOrganelle(0)?.label?.getText()).toBe('Mito');
  });

  it('draws no labels when labels is false', () => {
    const cell = new Cell({ organelles: ORGANELLES, labels: false });
    expect(cell.labelsGroup.children).toHaveLength(0);
    expect(cell.getOrganelle(0)?.label).toBeNull();
  });

  it('applies the organelle palette color', () => {
    const cell = new Cell({ organelles: ORGANELLES });
    expect(cell.getOrganelle(0)?.color).toBe(organelleColor('mitochondrion'));
    expect(cell.getOrganelle(2)?.color).toBe(organelleColor('lysosome'));
  });

  it('honors a per-name color override', () => {
    const cell = new Cell({ organelles: [{ name: 'ribosome' }], colors: { ribosome: '#abcdef' } });
    expect(cell.getOrganelle(0)?.color).toBe('#abcdef');
  });

  it('honors a per-organelle color override', () => {
    const cell = new Cell({ organelles: [{ name: 'ribosome', color: '#654321' }] });
    expect(cell.getOrganelle(0)?.color).toBe('#654321');
  });

  it('builds an ellipse organelle when its shape is ellipse', () => {
    const cell = new Cell({ organelles: [{ name: 'mitochondrion', shape: 'ellipse' }] });
    expect(cell.getOrganelle(0)?.shape).toBeInstanceOf(Ellipse);
  });

  it('places an organelle at an explicit position', () => {
    const cell = new Cell({ organelles: [{ name: 'ribosome', position: [1, -0.5, 0] }] });
    expect(cell.getOrganelle(0)?.position).toEqual([1, -0.5, 0]);
  });

  it('is deterministic across builds with the same options', () => {
    const a = new Cell({ organelles: ORGANELLES });
    const b = new Cell({ organelles: ORGANELLES });
    for (let i = 0; i < a.numOrganelles; i++) {
      expect(a.getOrganelle(i)?.position).toEqual(b.getOrganelle(i)?.position);
      expect(a.getOrganelle(i)?.color).toBe(b.getOrganelle(i)?.color);
    }
  });

  // ===== Edge cases =====

  it('does not throw with no organelles', () => {
    expect(() => new Cell({ organelles: [] })).not.toThrow();
    const cell = new Cell({ organelles: [] });
    expect(cell.numOrganelles).toBe(0);
    expect(cell.getMembrane()).toBeInstanceOf(Circle);
  });

  it('does not throw with no options at all', () => {
    expect(() => new Cell()).not.toThrow();
  });

  it('does not throw on an empty organelle label', () => {
    expect(() => new Cell({ organelles: [{ name: '', label: '' }] })).not.toThrow();
    const cell = new Cell({ organelles: [{ name: '', label: '' }] });
    expect(cell.getOrganelle(0)?.label).toBeNull();
  });

  it('returns undefined for an out-of-range organelle', () => {
    const cell = new Cell({ organelles: ORGANELLES });
    expect(cell.getOrganelle(99)).toBeUndefined();
  });

  it('copy() preserves the organelle count and membrane shape', () => {
    const cell = new Cell({ shape: 'ellipse', organelles: ORGANELLES });
    const clone = cell.copy();
    expect(clone).toBeInstanceOf(Cell);
    expect(clone.numOrganelles).toBe(cell.numOrganelles);
    expect(clone.getMembrane()).toBeInstanceOf(Ellipse);
  });

  // ===== Bilayer membrane =====

  it('has an inner bilayer outline matching the membrane shape', () => {
    expect(new Cell().innerMembrane).toBeInstanceOf(Circle);
    expect(new Cell({ shape: 'ellipse', width: 4, height: 2 }).innerMembrane).toBeInstanceOf(
      Ellipse,
    );
  });

  it('fills the membrane with a soft cytoplasm tint', () => {
    const cell = new Cell({ radius: 2 });
    expect(cell.getMembrane().fillOpacity).toBeGreaterThan(0);
    expect(cell.getMembrane().fillOpacity).toBeLessThan(0.3);
  });

  // ===== Nucleus detail =====

  it('builds a nucleus envelope, tint and nucleolus', () => {
    const cell = new Cell();
    expect(cell.nucleusGroup).toBeInstanceOf(VGroup);
    // disc, inner tint, envelope ring, nucleolus.
    expect(cell.nucleusGroup?.children).toHaveLength(4);
  });

  it('has no nucleus group when showNucleus is false', () => {
    const cell = new Cell({ showNucleus: false });
    expect(cell.nucleusGroup).toBeNull();
    expect(cell.getNucleus()).toBeNull();
  });

  // ===== Realistic organelle composites =====

  it('builds a mitochondrion as a body with cristae', () => {
    const cell = new Cell({ organelles: [{ name: 'mitochondrion' }] });
    const shape = cell.getOrganelle(0)?.shape;
    expect(shape).toBeInstanceOf(VGroup);
    const children = (shape as VGroup).children;
    expect(children.length).toBeGreaterThan(1);
    expect(children.some((c) => c instanceof Ellipse)).toBe(true);
    expect(children.some((c) => c instanceof ParametricFunction)).toBe(true);
  });

  it('builds a golgi as stacked arcs', () => {
    const cell = new Cell({ organelles: [{ name: 'golgi' }] });
    const shape = cell.getOrganelle(0)?.shape as VGroup;
    expect(shape).toBeInstanceOf(VGroup);
    expect(shape.children.length).toBeGreaterThanOrEqual(3);
    expect(shape.children.every((c) => c instanceof Arc)).toBe(true);
  });

  it('builds a ribosome as a cluster of dots, not one circle', () => {
    const cell = new Cell({ organelles: [{ name: 'ribosome' }] });
    const shape = cell.getOrganelle(0)?.shape as VGroup;
    expect(shape).toBeInstanceOf(VGroup);
    expect(shape.children.length).toBeGreaterThanOrEqual(4);
    expect(shape.children.every((c) => c instanceof Dot)).toBe(true);
  });

  it('builds an endoplasmic reticulum as wavy membranes', () => {
    const cell = new Cell({ organelles: [{ name: 'endoplasmic reticulum' }] });
    const shape = cell.getOrganelle(0)?.shape as VGroup;
    expect(shape).toBeInstanceOf(VGroup);
    expect(shape.children.every((c) => c instanceof ParametricFunction)).toBe(true);
  });

  it('builds a lysosome as a sac with enzyme dots', () => {
    const cell = new Cell({ organelles: [{ name: 'lysosome' }] });
    const shape = cell.getOrganelle(0)?.shape as VGroup;
    expect(shape).toBeInstanceOf(VGroup);
    expect(shape.children.filter((c) => c instanceof Dot).length).toBeGreaterThanOrEqual(3);
  });

  it('keeps an explicit shape as a plain primitive', () => {
    const cell = new Cell({ organelles: [{ name: 'mitochondrion', shape: 'ellipse' }] });
    expect(cell.getOrganelle(0)?.shape).toBeInstanceOf(Ellipse);
  });

  it('draws plain circles when organelleDetail is false', () => {
    const cell = new Cell({ organelleDetail: false, organelles: [{ name: 'mitochondrion' }] });
    expect(cell.getOrganelle(0)?.shape).toBeInstanceOf(Circle);
  });
});
