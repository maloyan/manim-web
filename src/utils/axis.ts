export type AxisName = 'x' | 'y' | 'z';

export function axisVector(axis: AxisName): [number, number, number] {
  switch (axis) {
    case 'x':
      return [1, 0, 0];
    case 'y':
      return [0, 1, 0];
    case 'z':
      return [0, 0, 1];
  }
}

export function axisVectorFromEulerKey(key: 'X' | 'Y' | 'Z'): [number, number, number] {
  return axisVector(key.toLowerCase() as AxisName);
}
