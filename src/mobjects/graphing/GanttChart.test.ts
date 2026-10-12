import { describe, it, expect } from 'vitest';
import { GanttChart, type GanttTask } from './GanttChart';
import { VGroup } from '../../core/VGroup';
import { Rectangle } from '../geometry/Rectangle';
import { Arrow } from '../geometry/Arrow';
import { Line } from '../geometry/Line';

const TASKS: GanttTask[] = [
  { name: 'Design', start: 0, end: 3 },
  { name: 'Build', start: 3, end: 8, dependencies: ['Design'] },
  { name: 'Test', start: 8, end: 10, dependencies: ['Build'] },
];

describe('GanttChart', () => {
  it('builds one bar per task', () => {
    const chart = new GanttChart({ tasks: TASKS });
    expect(chart.getBars()).toBeInstanceOf(VGroup);
    expect(chart.getBars().children).toHaveLength(TASKS.length);
  });

  it('exposes each bar as a Rectangle', () => {
    const chart = new GanttChart({ tasks: TASKS });
    for (const task of TASKS) {
      expect(chart.getBar(task.name)).toBeInstanceOf(Rectangle);
    }
  });

  it('spans each bar across the mapped start->end x-range', () => {
    const chart = new GanttChart({ tasks: TASKS });
    for (const task of TASKS) {
      const bar = chart.getBar(task.name)!;
      const startX = chart.valueToX(task.start as number);
      const endX = chart.valueToX(task.end as number);
      expect(bar.getLeft()[0]).toBeCloseTo(startX, 6);
      expect(bar.getRight()[0]).toBeCloseTo(endX, 6);
    }
  });

  it('places each bar at the y-coordinate of its row', () => {
    const chart = new GanttChart({ tasks: TASKS });
    // Each task is its own row (no row key), rows ordered top-to-bottom.
    for (let i = 0; i < TASKS.length; i++) {
      const bar = chart.getBar(TASKS[i].name)!;
      expect(bar.getCenter()[1]).toBeCloseTo(chart.rowCenterY(i), 6);
    }
  });

  it('groups tasks that share a row key onto the same row', () => {
    const chart = new GanttChart({
      tasks: [
        { name: 'A', start: 0, end: 2, row: 'Team 1' },
        { name: 'B', start: 3, end: 5, row: 'Team 1' },
        { name: 'C', start: 0, end: 4, row: 'Team 2' },
      ],
    });
    expect(chart.getRowCount()).toBe(2);
    expect(chart.getBar('A')!.getCenter()[1]).toBeCloseTo(chart.rowCenterY(0), 6);
    expect(chart.getBar('B')!.getCenter()[1]).toBeCloseTo(chart.rowCenterY(0), 6);
    expect(chart.getBar('C')!.getCenter()[1]).toBeCloseTo(chart.rowCenterY(1), 6);
  });

  it('covers the time range from the min start to the max end', () => {
    const chart = new GanttChart({ tasks: TASKS });
    expect(chart.getTimeRange()).toEqual([0, 10]);
  });

  it('accepts Date values for start and end', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-11');
    const chart = new GanttChart({ tasks: [{ name: 'Sprint', start, end }] });
    expect(chart.getTimeRange()).toEqual([start.getTime(), end.getTime()]);
    const bar = chart.getBar('Sprint')!;
    expect(bar.getLeft()[0]).toBeCloseTo(chart.valueToX(start), 6);
    expect(bar.getRight()[0]).toBeCloseTo(chart.valueToX(end), 6);
  });

  it('draws no dependency arrows by default', () => {
    const chart = new GanttChart({ tasks: TASKS });
    expect(chart.getDependencyArrows().children).toHaveLength(0);
  });

  it('connects each dependency arrow from the predecessor end to the task start', () => {
    const chart = new GanttChart({ tasks: TASKS, showDependencies: true });
    const arrows = chart.getDependencyArrows();
    expect(arrows).toBeInstanceOf(VGroup);
    // Design->Build and Build->Test = 2 arrows.
    expect(arrows.children).toHaveLength(2);
    expect(arrows.children[0]).toBeInstanceOf(Arrow);

    // Arrow 0: from Design end (x=3) to Build start (x=3).
    const design = chart.getBar('Design')!;
    const build = chart.getBar('Build')!;
    const a0 = arrows.children[0] as Arrow;
    expect(a0.getStart()[0]).toBeCloseTo(chart.valueToX(3), 4);
    expect(a0.getStart()[1]).toBeCloseTo(design.getCenter()[1], 4);
    expect(a0.getEnd()[1]).toBeCloseTo(build.getCenter()[1], 4);
  });

  it('ignores dependencies that reference an unknown task', () => {
    const chart = new GanttChart({
      tasks: [{ name: 'Solo', start: 0, end: 5, dependencies: ['Ghost'] }],
      showDependencies: true,
    });
    expect(chart.getDependencyArrows().children).toHaveLength(0);
  });

  it('adds a today marker when a today value is given', () => {
    const chart = new GanttChart({ tasks: TASKS, today: 5 });
    const marker = chart.getTodayMarker();
    expect(marker).toBeInstanceOf(Line);
    expect(marker!.getStart()[0]).toBeCloseTo(chart.valueToX(5), 6);
    expect(marker!.getEnd()[0]).toBeCloseTo(chart.valueToX(5), 6);
  });

  it('has no today marker by default', () => {
    const chart = new GanttChart({ tasks: TASKS });
    expect(chart.getTodayMarker()).toBeNull();
  });

  it('uses a per-task color when provided', () => {
    const chart = new GanttChart({
      tasks: [{ name: 'X', start: 0, end: 1, color: '#123456' }],
    });
    expect(chart.getBar('X')!.color.toLowerCase()).toBe('#123456');
  });

  it('gives a zero-or-negative duration task a visible minimum width', () => {
    const chart = new GanttChart({
      tasks: [
        { name: 'Milestone', start: 4, end: 4 },
        { name: 'Bad', start: 6, end: 2 },
      ],
    });
    expect(chart.getBars().children).toHaveLength(2);
    expect(chart.getBar('Milestone')!.getWidth()).toBeGreaterThan(0);
    expect(chart.getBar('Bad')!.getWidth()).toBeGreaterThan(0);
    // The min-width bar is anchored at its start.
    expect(chart.getBar('Milestone')!.getLeft()[0]).toBeCloseTo(chart.valueToX(4), 6);
  });

  it('handles a single task without throwing', () => {
    expect(() => new GanttChart({ tasks: [{ name: 'Only', start: 0, end: 5 }] })).not.toThrow();
    const chart = new GanttChart({ tasks: [{ name: 'Only', start: 0, end: 5 }] });
    expect(chart.getBars().children).toHaveLength(1);
    expect(chart.getRowCount()).toBe(1);
  });

  it('handles an empty task list without throwing', () => {
    expect(() => new GanttChart({ tasks: [] })).not.toThrow();
    const chart = new GanttChart({ tasks: [] });
    expect(chart.getBars().children).toHaveLength(0);
    expect(chart.getRowCount()).toBe(0);
    expect(chart.getDependencyArrows().children).toHaveLength(0);
    expect(chart.getTodayMarker()).toBeNull();
  });

  it('returns undefined for an unknown bar name', () => {
    const chart = new GanttChart({ tasks: TASKS });
    expect(chart.getBar('Nope')).toBeUndefined();
  });

  it('is copyable', () => {
    const chart = new GanttChart({ tasks: TASKS, showDependencies: true, today: 5 });
    const clone = chart.copy();
    expect(clone).toBeInstanceOf(GanttChart);
    expect(clone.getBars().children).toHaveLength(TASKS.length);
    expect(clone.getDependencyArrows().children).toHaveLength(2);
    expect(clone.getTodayMarker()).toBeInstanceOf(Line);
  });
});
