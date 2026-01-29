declare module 'opentype.js' {
  export interface Glyph {
    index: number;
    advanceWidth?: number;
    getPath(x: number, y: number, fontSize: number): Path;
  }

  export interface Path {
    commands: PathCommand[];
  }

  export type PathCommand =
    | { type: 'M'; x: number; y: number }
    | { type: 'L'; x: number; y: number }
    | { type: 'Q'; x1: number; y1: number; x: number; y: number }
    | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
    | { type: 'Z' };

  export interface Font {
    unitsPerEm: number;
    charToGlyph(char: string): Glyph;
    getKerningValue(left: Glyph, right: Glyph): number;
  }

  export function load(url: string): Promise<Font>;

  const opentype: {
    load: typeof load;
  };
  export default opentype;
}
