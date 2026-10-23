import { describe, it, expect } from 'vitest';
import { BohrDiagram } from './BohrDiagram';
import { Circle } from '../geometry/Circle';
import { Dot } from '../geometry/Dot';
import { Text } from '../text/Text';
import { VGroup } from '../../core/VGroup';
import { Create } from '../../animation/creation/Create';

describe('BohrDiagram', () => {
  describe('shell filling from element', () => {
    it('fills carbon as [2, 4]', () => {
      const d = new BohrDiagram({ element: 'C' });
      expect(d.getShellCounts()).toEqual([2, 4]);
      expect(d.getProtons()).toBe(6);
    });

    it('fills sodium as [2, 8, 1]', () => {
      const d = new BohrDiagram({ element: 'Na' });
      expect(d.getShellCounts()).toEqual([2, 8, 1]);
      expect(d.getProtons()).toBe(11);
    });

    it('fills oxygen as [2, 6]', () => {
      const d = new BohrDiagram({ element: 'O' });
      expect(d.getShellCounts()).toEqual([2, 6]);
      expect(d.getProtons()).toBe(8);
    });

    it('fills hydrogen as [1]', () => {
      const d = new BohrDiagram({ element: 'H' });
      expect(d.getShellCounts()).toEqual([1]);
      expect(d.getProtons()).toBe(1);
    });

    it('fills krypton as [2, 8, 18, 8] (2n^2 capped)', () => {
      const d = new BohrDiagram({ element: 'Kr' });
      expect(d.getShellCounts()).toEqual([2, 8, 18, 8]);
      expect(d.getProtons()).toBe(36);
    });

    // MIGRATION: example for the property
    //   ∀ z ∈ [1, 20]: fillShells(z) is the 2, 8, 8, 2 school filling
    //   (sum === z, shell 3 <= 8, shell 4 non-empty only when z > 18), and
    //   ∀ z: fillShells(z, 'capacity')[n-1] <= 2n^2 with sum === z.
    // Replace with a property test once the suite lands.
    it('fills potassium and calcium by the 2, 8, 8, 2 school rule (#860)', () => {
      expect(new BohrDiagram({ element: 'K' }).getShellCounts()).toEqual([2, 8, 8, 1]);
      expect(new BohrDiagram({ element: 'Ca' }).getShellCounts()).toEqual([2, 8, 8, 2]);
    });

    it('keeps the 2n^2 capacity rule as an option', () => {
      const d = new BohrDiagram({ element: 'K', shellRule: 'capacity' });
      expect(d.getShellCounts()).toEqual([2, 8, 9]);
    });

    it('normalizes the element case', () => {
      expect(new BohrDiagram({ element: 'na' }).getShellCounts()).toEqual([2, 8, 1]);
      expect(new BohrDiagram({ element: 'NA' }).getProtons()).toBe(11);
    });
  });

  describe('shell filling from protons', () => {
    it('derives Z and the filling from the proton count', () => {
      const d = new BohrDiagram({ protons: 6 });
      expect(d.getProtons()).toBe(6);
      expect(d.getShellCounts()).toEqual([2, 4]);
    });

    it('lets element win over protons when both are given', () => {
      const d = new BohrDiagram({ element: 'O', protons: 6 });
      expect(d.getProtons()).toBe(8);
      expect(d.getShellCounts()).toEqual([2, 6]);
    });
  });

  describe('explicit shells override', () => {
    it('honors the given shell counts over the computed filling', () => {
      const d = new BohrDiagram({ element: 'Na', shells: [2, 8, 1, 0] });
      expect(d.getShellCounts()).toEqual([2, 8, 1, 0]);
      // Z still comes from the element.
      expect(d.getProtons()).toBe(11);
    });

    it('works with protons plus an explicit shells override', () => {
      const d = new BohrDiagram({ protons: 20, shells: [2, 8, 8, 2] });
      expect(d.getShellCounts()).toEqual([2, 8, 8, 2]);
      expect(d.getProtons()).toBe(20);
    });
  });

  describe('guards', () => {
    it('throws when neither element nor protons is given', () => {
      expect(() => new BohrDiagram({})).toThrow();
    });

    it('throws on an unknown element', () => {
      expect(() => new BohrDiagram({ element: 'Xx' })).toThrow(/unknown element/i);
    });

    it('throws when protons <= 0', () => {
      expect(() => new BohrDiagram({ protons: 0 })).toThrow();
      expect(() => new BohrDiagram({ protons: -3 })).toThrow();
    });

    it('throws on a non-integer proton count', () => {
      expect(() => new BohrDiagram({ protons: 2.5 })).toThrow();
    });
  });

  describe('geometry', () => {
    it('draws one shell circle per shell plus the nucleus circle', () => {
      const d = new BohrDiagram({ element: 'Na' }); // 3 shells
      const circles = d.getFamily().filter((m) => m instanceof Circle && !(m instanceof Dot));
      // nucleus + 3 shells = 4 circles
      expect(circles.length).toBe(4);
      expect(d.getShellCircles()).toHaveLength(3);
    });

    it('draws one electron dot per electron', () => {
      const d = new BohrDiagram({ element: 'Na' }); // 2 + 8 + 1 = 11
      const dots = d.getFamily().filter((m) => m instanceof Dot);
      expect(dots.length).toBe(11);
      expect(d.getElectronDots()).toHaveLength(11);
    });

    it('matches carbon electron and shell counts', () => {
      const d = new BohrDiagram({ element: 'C' }); // 2 + 4 = 6 electrons, 2 shells
      expect(d.getShellCircles()).toHaveLength(2);
      expect(d.getElectronDots()).toHaveLength(6);
    });

    it('shows the nucleus label by default', () => {
      const d = new BohrDiagram({ element: 'C' });
      const texts = d.getFamily().filter((m) => m instanceof Text);
      expect(texts.length).toBe(1);
      expect((texts[0] as Text).getText()).toContain('C');
      expect((texts[0] as Text).getText()).toContain('6');
    });

    it('omits the nucleus label when showNucleusLabel is false', () => {
      const d = new BohrDiagram({ element: 'C', showNucleusLabel: false });
      const texts = d.getFamily().filter((m) => m instanceof Text);
      expect(texts.length).toBe(0);
    });

    it('places electron dots on their shell radius', () => {
      const nucleusRadius = 0.4;
      const shellSpacing = 0.6;
      const d = new BohrDiagram({ element: 'H', nucleusRadius, shellSpacing });
      const dots = d.getElectronDots();
      expect(dots).toHaveLength(1);
      const [x, y] = dots[0].getPoint();
      const r = Math.hypot(x, y);
      expect(r).toBeCloseTo(nucleusRadius + shellSpacing, 5);
    });
  });

  describe('as a VGroup', () => {
    it('is a VGroup', () => {
      expect(new BohrDiagram({ element: 'C' })).toBeInstanceOf(VGroup);
    });

    it('is Create-able without throwing', () => {
      const d = new BohrDiagram({ element: 'Na' });
      expect(() => new Create(d)).not.toThrow();
    });

    it('copies to an independent BohrDiagram with the same counts', () => {
      const d = new BohrDiagram({ element: 'Na' });
      const c = d.copy();
      expect(c).toBeInstanceOf(BohrDiagram);
      expect(c.getShellCounts()).toEqual([2, 8, 1]);
      expect(c.getProtons()).toBe(11);
    });
  });
});
