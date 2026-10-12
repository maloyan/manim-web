import { cycleColor } from './chartColors';
import type { GanttTask, GanttTimeValue } from './GanttChart';

/** One resolved task, ready to render. */
export interface GanttTaskSpec {
  /** Task name. */
  name: string;
  /** Start time as a number. */
  startValue: number;
  /** End time as a number. */
  endValue: number;
  /** Index of the row the task sits on. */
  rowIndex: number;
  /** Resolved bar color. */
  color: string;
  /** Names of the tasks this task depends on. */
  dependencies: string[];
}

/** The resolved specs plus the distinct row keys, in row order. */
export interface GanttLayout {
  /** One spec per task, in task order. */
  specs: GanttTaskSpec[];
  /** Distinct row keys, in first-appearance (top-to-bottom) order. */
  rowKeys: string[];
}

/** Read a time value as a number. A Date is read through getTime(). */
export function toTimeNumber(value: GanttTimeValue): number {
  return value instanceof Date ? value.getTime() : value;
}

/**
 * Resolve tasks into render specs and the ordered list of rows.
 *
 * The row key of a task is its `row`, or its name when `row` is absent, so a
 * task without a row key gets its own row. Colors come from the task's own
 * color, or the palette cycled by row index.
 */
export function resolveGanttLayout(tasks: GanttTask[], palette: string[]): GanttLayout {
  const rowKeys: string[] = [];
  const seen = new Set<string>();
  for (const task of tasks) {
    const key = task.row ?? task.name;
    if (!seen.has(key)) {
      seen.add(key);
      rowKeys.push(key);
    }
  }

  const specs: GanttTaskSpec[] = tasks.map((task) => {
    const rowIndex = rowKeys.indexOf(task.row ?? task.name);
    return {
      name: task.name,
      startValue: toTimeNumber(task.start),
      endValue: toTimeNumber(task.end),
      rowIndex,
      color: task.color ?? cycleColor(palette, rowIndex),
      dependencies: task.dependencies ? [...task.dependencies] : [],
    };
  });

  return { specs, rowKeys };
}

/** Time range as [min start, max end] across all specs. */
export function ganttTimeRange(specs: GanttTaskSpec[]): [number, number] {
  if (specs.length === 0) return [0, 1];

  let min = Infinity;
  let max = -Infinity;
  for (const spec of specs) {
    min = Math.min(min, spec.startValue, spec.endValue);
    max = Math.max(max, spec.startValue, spec.endValue);
  }
  if (min === max) max = min + 1;
  return [min, max];
}
