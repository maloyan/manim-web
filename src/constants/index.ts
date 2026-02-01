export * from './colors';

// Manim default configuration
export const DEFAULT_STROKE_WIDTH = 4;
export const DEFAULT_FONT_SIZE = 48;
export const DEFAULT_ANIMATION_DURATION = 1;
export const DEFAULT_FRAME_WIDTH = 14.222;  // Manim's default
export const DEFAULT_FRAME_HEIGHT = 8;
export const DEFAULT_PIXEL_WIDTH = 1920;
export const DEFAULT_PIXEL_HEIGHT = 1080;
export const DEFAULT_FPS = 60;

// Buffer / spacing constants (matching Manim Python)
export const SMALL_BUFF = 0.1;
export const MED_SMALL_BUFF = 0.25;
export const MED_LARGE_BUFF = 0.5;
export const LARGE_BUFF = 1;
export const DEFAULT_MOBJECT_TO_EDGE_BUFFER = MED_LARGE_BUFF;
export const DEFAULT_MOBJECT_TO_MOBJECT_BUFFER = MED_SMALL_BUFF;
