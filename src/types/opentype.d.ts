declare module 'opentype.js' {
  export interface Glyph {
    index: number;
    advanceWidth?: number;
    getPath(x: number, y: number, fontSize: number): { commands: PathCommand[] };
    [key: string]: unknown;
  }

  export interface PathCommand {
    type: 'M' | 'L' | 'Q' | 'C' | 'Z';
    x: number;
    y: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  export interface Font {
    unitsPerEm: number;
    charToGlyph(char: string): Glyph;
    getKerningValue(left: Glyph, right: Glyph): number;
    [key: string]: unknown;
  }

  function load(url: string): Promise<Font>;

  const opentype: {
    load: typeof load;
  };

  export default opentype;
}
